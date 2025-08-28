from database.sqlite_manager import SQLiteManager
from scrapers.yugioh_scraper_improved import YuGiOhScraperImproved
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
    logger.info("YUGIOH COMPLETE DATABASE SCRAPER - STARTING")
    logger.info("=" * 60)
    
    # Initialize database
    db = SQLiteManager("yugioh_cards.db")
    if not db.connect():
        logger.error("Failed to connect to database")
        return
    
    if not db.create_tables():
        logger.error("Failed to create tables")
        return
    
    logger.info("Database initialized successfully")
    
    # Initialize scraper
    scraper = YuGiOhScraperImproved()
    
    # Get initial count
    initial_count = db.get_card_count("YuGiOh")
    logger.info(f"Initial YuGiOh cards in database: {initial_count}")
    
    # Scrape cards
    logger.info("Starting YuGiOh scraping...")
    cards = scraper.scrape()
    
    if not cards:
        logger.error("No cards scraped!")
        return
    
    logger.info(f"Successfully scraped {len(cards)} YuGiOh cards")
    
    # Show sample cards
    logger.info("Sample cards:")
    for i, card in enumerate(cards[:5]):
        logger.info(f"  {i+1}. {card['card_name']} | {card['set_name']} | {card['rarity']} | #{card['card_number']}")
    
    # Save to database
    logger.info("Saving cards to database...")
    saved_count = db.bulk_insert_cards(cards)
    
    # Get final count
    final_count = db.get_card_count("YuGiOh")
    new_cards = final_count - initial_count
    
    # Summary
    duration = datetime.now() - start_time
    logger.info("=" * 60)
    logger.info("YUGIOH SCRAPING COMPLETED")
    logger.info("=" * 60)
    logger.info(f"Duration: {duration}")
    logger.info(f"Cards scraped: {len(cards)}")
    logger.info(f"Cards saved: {saved_count}")
    logger.info(f"New cards added: {new_cards}")
    logger.info(f"Total YuGiOh cards in database: {final_count}")
    logger.info("=" * 60)
    
    # Show database stats
    db.cursor.execute("SELECT set_name, COUNT(*) as count FROM trading_cards WHERE card_game = 'YuGiOh' GROUP BY set_name ORDER BY count DESC LIMIT 10")
    logger.info("Top 10 sets by card count:")
    for row in db.cursor.fetchall():
        logger.info(f"  {row['set_name']}: {row['count']} cards")
    
    db.disconnect()

if __name__ == "__main__":
    main()