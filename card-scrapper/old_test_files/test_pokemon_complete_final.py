from database.sqlite_manager import SQLiteManager
from scrapers.pokemon_scraper_complete import PokemonScraperComplete
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
    logger.info("POKEMON COMPLETE SCRAPER - INDIVIDUAL CARD PROCESSING")
    logger.info("=" * 60)
    
    # Initialize database
    db = SQLiteManager("pokemon_complete_final.db")
    if not db.connect():
        logger.error("Failed to connect to database")
        return
    
    if not db.create_tables():
        logger.error("Failed to create tables")
        return
    
    logger.info("Database initialized successfully")
    
    # Initialize scraper
    scraper = PokemonScraperComplete()
    
    # Get initial count
    initial_count = db.get_card_count("Pokemon TCG")
    logger.info(f"Initial Pokemon cards in database: {initial_count}")
    
    # Scrape cards with individual card page processing
    logger.info("Starting Pokemon complete scraping (individual card pages)...")
    cards = scraper.scrape()
    
    if not cards:
        logger.warning("No cards scraped!")
        return
    
    logger.info(f"Successfully scraped {len(cards)} Pokemon cards")
    
    # Show sample cards with detailed information
    logger.info("Sample cards with detailed information:")
    for i, card in enumerate(cards[:5]):
        logger.info(f"  {i+1}. {card['card_name']}")
        logger.info(f"      Set: {card['set_name']}")
        logger.info(f"      Rarity: {card['rarity']}")
        logger.info(f"      Number: #{card['card_number']}")
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
    logger.info("POKEMON COMPLETE SCRAPING COMPLETED")
    logger.info("=" * 60)
    logger.info(f"Duration: {duration}")
    logger.info(f"Cards scraped: {len(cards)}")
    logger.info(f"Cards saved: {saved_count}")
    logger.info(f"New cards added: {new_cards}")
    logger.info(f"Total Pokemon cards in database: {final_count}")
    logger.info("=" * 60)
    
    # Detailed analysis
    db.cursor.execute("SELECT set_name, COUNT(*) as count FROM trading_cards WHERE card_game = 'Pokemon TCG' GROUP BY set_name ORDER BY count DESC")
    logger.info("Sets processed:")
    for row in db.cursor.fetchall():
        logger.info(f"  {row['set_name']}: {row['count']} cards")
    
    # Show different rarity types found
    db.cursor.execute("SELECT DISTINCT rarity FROM trading_cards WHERE card_game = 'Pokemon TCG' ORDER BY rarity")
    logger.info("\nUnique rarities found:")
    for row in db.cursor.fetchall():
        logger.info(f"  {row['rarity']}")
    
    # Show card name variety
    db.cursor.execute("SELECT DISTINCT card_name FROM trading_cards WHERE card_game = 'Pokemon TCG' AND card_name != 'Unknown' ORDER BY card_name LIMIT 10")
    logger.info("\nSample Pokemon names:")
    for row in db.cursor.fetchall():
        logger.info(f"  {row['card_name']}")
    
    # Check data quality
    db.cursor.execute("SELECT COUNT(*) FROM trading_cards WHERE card_game = 'Pokemon TCG' AND card_name != 'Unknown'")
    named_cards = db.cursor.fetchone()[0]
    
    db.cursor.execute("SELECT COUNT(*) FROM trading_cards WHERE card_game = 'Pokemon TCG' AND card_number IS NOT NULL")
    numbered_cards = db.cursor.fetchone()[0]
    
    db.cursor.execute("SELECT COUNT(*) FROM trading_cards WHERE card_game = 'Pokemon TCG' AND card_image_url IS NOT NULL")
    cards_with_images = db.cursor.fetchone()[0]
    
    logger.info(f"\nData Quality Analysis:")
    logger.info(f"  Cards with names: {named_cards}/{final_count} ({named_cards/final_count*100:.1f}%)")
    logger.info(f"  Cards with numbers: {numbered_cards}/{final_count} ({numbered_cards/final_count*100:.1f}%)")
    logger.info(f"  Cards with images: {cards_with_images}/{final_count} ({cards_with_images/final_count*100:.1f}%)")
    
    db.disconnect()

if __name__ == "__main__":
    main()