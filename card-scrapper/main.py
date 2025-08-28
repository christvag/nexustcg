import logging
import sys
from datetime import datetime
from typing import List, Dict, Any
import argparse
from database.db_manager import DatabaseManager
from scrapers import (
    PokemonScraper,
    YuGiOhScraper,
    MTGScraper,
    LorcanaScraper,
    OnePieceScraper
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'scraper_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)


class CardScraperOrchestrator:
    def __init__(self):
        self.db_manager = DatabaseManager()
        self.scrapers = {
            'pokemon': PokemonScraper,
            'yugioh': YuGiOhScraper,
            'mtg': MTGScraper,
            'lorcana': LorcanaScraper,
            'onepiece': OnePieceScraper
        }
        self.stats = {
            'total_cards': 0,
            'cards_by_game': {},
            'errors': []
        }
    
    def initialize_database(self) -> bool:
        logger.info("Initializing database connection...")
        if not self.db_manager.connect():
            logger.error("Failed to connect to database")
            return False
        
        logger.info("Creating database tables...")
        if not self.db_manager.create_tables():
            logger.error("Failed to create database tables")
            return False
        
        logger.info("Database initialized successfully")
        return True
    
    def scrape_game(self, game_name: str) -> List[Dict[str, Any]]:
        logger.info(f"Starting scraper for {game_name}...")
        
        if game_name not in self.scrapers:
            logger.error(f"Unknown game: {game_name}")
            return []
        
        try:
            scraper_class = self.scrapers[game_name]
            scraper = scraper_class()
            cards = scraper.scrape()
            
            logger.info(f"Scraped {len(cards)} cards for {game_name}")
            return cards
            
        except Exception as e:
            error_msg = f"Error scraping {game_name}: {e}"
            logger.error(error_msg)
            self.stats['errors'].append(error_msg)
            return []
    
    def save_cards_to_database(self, cards: List[Dict[str, Any]], game_name: str) -> int:
        if not cards:
            logger.warning(f"No cards to save for {game_name}")
            return 0
        
        logger.info(f"Saving {len(cards)} cards to database for {game_name}...")
        
        saved_count = self.db_manager.bulk_insert_cards(cards)
        
        logger.info(f"Successfully saved {saved_count} cards for {game_name}")
        return saved_count
    
    def run(self, games: List[str] = None):
        start_time = datetime.now()
        logger.info("=" * 60)
        logger.info("TRADING CARD SCRAPER - STARTING")
        logger.info("=" * 60)
        
        # Initialize database
        if not self.initialize_database():
            logger.error("Failed to initialize database. Exiting.")
            return
        
        # Determine which games to scrape
        games_to_scrape = games if games else list(self.scrapers.keys())
        
        logger.info(f"Games to scrape: {', '.join(games_to_scrape)}")
        
        # Scrape each game
        for game_name in games_to_scrape:
            logger.info("-" * 40)
            logger.info(f"Processing: {game_name.upper()}")
            logger.info("-" * 40)
            
            # Get initial count
            initial_count = self.db_manager.get_card_count(
                self.scrapers[game_name]().game_name
            )
            
            # Scrape cards
            cards = self.scrape_game(game_name)
            
            # Save to database
            saved_count = self.save_cards_to_database(cards, game_name)
            
            # Update statistics
            final_count = self.db_manager.get_card_count(
                self.scrapers[game_name]().game_name
            )
            
            self.stats['cards_by_game'][game_name] = {
                'scraped': len(cards),
                'saved': saved_count,
                'total_in_db': final_count,
                'new_cards': final_count - initial_count
            }
            
            self.stats['total_cards'] += saved_count
            
            logger.info(f"Completed {game_name}: {saved_count} cards processed")
        
        # Print summary
        self.print_summary(start_time)
        
        # Cleanup
        self.db_manager.disconnect()
    
    def print_summary(self, start_time: datetime):
        duration = datetime.now() - start_time
        
        logger.info("=" * 60)
        logger.info("SCRAPING COMPLETED - SUMMARY")
        logger.info("=" * 60)
        logger.info(f"Duration: {duration}")
        logger.info(f"Total cards processed: {self.stats['total_cards']}")
        
        logger.info("\nCards by game:")
        for game, stats in self.stats['cards_by_game'].items():
            logger.info(f"  {game.upper()}:")
            logger.info(f"    - Scraped: {stats['scraped']}")
            logger.info(f"    - Saved: {stats['saved']}")
            logger.info(f"    - New cards: {stats['new_cards']}")
            logger.info(f"    - Total in DB: {stats['total_in_db']}")
        
        if self.stats['errors']:
            logger.warning(f"\nErrors encountered: {len(self.stats['errors'])}")
            for error in self.stats['errors']:
                logger.warning(f"  - {error}")
        
        # Database summary
        total_db_count = self.db_manager.get_card_count()
        logger.info(f"\nTotal cards in database: {total_db_count}")
        logger.info("=" * 60)


def main():
    parser = argparse.ArgumentParser(
        description='Scrape trading card game information and store in PostgreSQL'
    )
    parser.add_argument(
        '--games',
        nargs='+',
        choices=['pokemon', 'yugioh', 'mtg', 'lorcana', 'onepiece'],
        help='Specific games to scrape (default: all)'
    )
    parser.add_argument(
        '--test',
        action='store_true',
        help='Run in test mode (scrape only a small sample)'
    )
    
    args = parser.parse_args()
    
    try:
        orchestrator = CardScraperOrchestrator()
        orchestrator.run(games=args.games)
        
    except KeyboardInterrupt:
        logger.info("\nScraping interrupted by user")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()