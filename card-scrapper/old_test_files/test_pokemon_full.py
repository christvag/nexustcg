from database.sqlite_manager import SQLiteManager
from scrapers.pokemon_scraper_fixed import PokemonScraperFixed
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

def main():
    start_time = datetime.now()
    logger.info("=" * 60)
    logger.info("POKEMON FULL SCRAPER - ALL 19,245+ CARDS")
    logger.info("=" * 60)
    
    # Initialize database
    db = SQLiteManager("pokemon_full.db")
    if not db.connect():
        logger.error("Failed to connect to database")
        return
    
    if not db.create_tables():
        logger.error("Failed to create tables")
        return
    
    logger.info("Database initialized successfully")
    
    # Initialize scraper
    scraper = PokemonScraperFixed()
    
    # Get initial count
    initial_count = db.get_card_count("Pokemon TCG")
    logger.info(f"Initial Pokemon cards in database: {initial_count}")
    
    # Scrape all cards (no demo limits)
    logger.info("Starting Pokemon FULL scraping (all sets, all cards)...")
    cards = scraper.scrape()
    
    if not cards:
        logger.warning("No cards scraped!")
        return
    
    logger.info(f"Successfully scraped {len(cards)} Pokemon cards")
    
    # Show sample cards
    logger.info("Sample cards from full scraping:")
    for i, card in enumerate(cards[:8]):
        logger.info(f"  {i+1}. {card['card_name']}")
        logger.info(f"      Set: {card['set_name']}")
        logger.info(f"      Rarity: {card['rarity']}")
        logger.info(f"      Number: #{card['card_number']}")
        if card['card_image_url']:
            logger.info(f"      Image: {card['card_image_url']}")
        logger.info("")
    
    # Save to database
    logger.info("Saving cards to database...")
    saved_count = db.bulk_insert_cards(cards)
    
    # Get final count
    final_count = db.get_card_count("Pokemon TCG")
    new_cards = final_count - initial_count
    
    # Summary
    duration = datetime.now() - start_time
    logger.info("=" * 60)
    logger.info("POKEMON FULL SCRAPING COMPLETED")
    logger.info("=" * 60)
    logger.info(f"Duration: {duration}")
    logger.info(f"Cards scraped: {len(cards)}")
    logger.info(f"Cards saved: {saved_count}")
    logger.info(f"New cards added: {new_cards}")
    logger.info(f"Total Pokemon cards in database: {final_count}")
    logger.info("=" * 60)
    
    # Detailed analysis
    db.cursor.execute("SELECT set_name, COUNT(*) as count FROM trading_cards WHERE card_game = 'Pokemon TCG' GROUP BY set_name ORDER BY count DESC")
    logger.info("All sets processed:")
    for row in db.cursor.fetchall():
        logger.info(f"  {row['set_name']}: {row['count']} cards")
    
    # Progress toward 19,245 goal
    target_cards = 19245
    progress_percent = (final_count / target_cards) * 100
    logger.info(f"\nProgress toward 19,245 card goal:")
    logger.info(f"  Current: {final_count:,} cards")
    logger.info(f"  Target: {target_cards:,} cards") 
    logger.info(f"  Progress: {progress_percent:.1f}%")
    
    if final_count < target_cards:
        remaining = target_cards - final_count
        logger.info(f"  Remaining: {remaining:,} cards")
        rate_per_min = len(cards) / (duration.total_seconds() / 60) if duration.total_seconds() > 0 else 0
        if rate_per_min > 0:
            est_time = remaining / rate_per_min
            logger.info(f"  Estimated additional time needed: {est_time:.1f} minutes")
    
    # Data quality analysis
    db.cursor.execute("SELECT COUNT(*) FROM trading_cards WHERE card_game = 'Pokemon TCG' AND card_name != 'Unknown'")
    named_cards = db.cursor.fetchone()[0]
    
    db.cursor.execute("SELECT COUNT(*) FROM trading_cards WHERE card_game = 'Pokemon TCG' AND card_image_url IS NOT NULL")
    cards_with_images = db.cursor.fetchone()[0]
    
    logger.info(f"\nData Quality:")
    logger.info(f"  Cards with Pokemon names: {named_cards}/{final_count} ({named_cards/final_count*100:.1f}%)")
    logger.info(f"  Cards with images: {cards_with_images}/{final_count} ({cards_with_images/final_count*100:.1f}%)")
    
    db.disconnect()

if __name__ == "__main__":
    main()