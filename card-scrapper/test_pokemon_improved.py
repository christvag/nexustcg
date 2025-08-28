#!/usr/bin/env python3
"""
Test script for the improved Pokemon scraper
"""
import sys
import os
import logging
from pathlib import Path

# Add the project root to the Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from scrapers.pokemon_scraper_improved import PokemonScraperImproved
from database.sqlite_manager_enhanced import SQLiteManagerEnhanced

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


def test_pokemon_scraper():
    """Test the improved Pokemon scraper"""
    logger.info("Starting Pokemon scraper test...")
    
    # Initialize scraper
    scraper = PokemonScraperImproved()
    
    # Initialize database
    db_manager = SQLiteManagerEnhanced("pokemon_improved.db")
    
    try:
        # Connect to database
        if not db_manager.connect():
            logger.error("Failed to connect to database")
            return False
        
        # Create tables
        if not db_manager.create_tables():
            logger.error("Failed to create database tables")
            return False
        
        # Run scraper (limited to a few sets for testing)
        cards = scraper.scrape()
        
        if not cards:
            logger.error("No cards were scraped")
            return False
        
        logger.info(f"Scraped {len(cards)} cards")
        
        # Show sample card data
        if cards:
            logger.info("Sample card data:")
            sample_card = cards[0]
            for key, value in sample_card.items():
                logger.info(f"  {key}: {value}")
        
        # Save to database
        inserted_count = db_manager.bulk_insert_cards(cards)
        logger.info(f"Successfully inserted {inserted_count} cards to database")
        
        # Get statistics
        total_count = db_manager.get_card_count("Pokemon TCG")
        logger.info(f"Total Pokemon cards in database: {total_count}")
        
        # Get all sets
        sets = db_manager.get_all_sets("Pokemon TCG")
        logger.info(f"Number of sets scraped: {len(sets)}")
        if sets:
            logger.info(f"Sets: {', '.join(sets[:5])}")  # Show first 5 sets
        
        # Export sample data to JSON
        if db_manager.export_to_json("pokemon_sample.json", "Pokemon TCG"):
            logger.info("Sample data exported to pokemon_sample.json")
        
        return True
        
    except Exception as e:
        logger.error(f"Test failed with error: {e}")
        return False
        
    finally:
        db_manager.disconnect()


def test_individual_card():
    """Test scraping a single card for debugging"""
    logger.info("Testing individual card scraping...")
    
    scraper = PokemonScraperImproved()
    
    try:
        # Test scraping a specific card
        card_url = "https://limitlesstcg.com/cards/BLK/1"
        card_data = scraper.scrape_individual_card(card_url, "Black Bolt", "1")
        
        if card_data:
            logger.info("Successfully scraped individual card:")
            for key, value in card_data.items():
                logger.info(f"  {key}: {value}")
            return True
        else:
            logger.error("Failed to scrape individual card")
            return False
            
    except Exception as e:
        logger.error(f"Individual card test failed: {e}")
        return False


if __name__ == "__main__":
    print("Pokemon Scraper Improved - Test Script")
    print("=" * 50)
    
    # Test individual card first
    print("Testing individual card scraping...")
    if test_individual_card():
        print("[PASS] Individual card test passed")
    else:
        print("[FAIL] Individual card test failed")
        sys.exit(1)
    
    print("\nTesting full scraper...")
    if test_pokemon_scraper():
        print("[PASS] Full scraper test passed")
        print("\nTest completed successfully!")
    else:
        print("[FAIL] Full scraper test failed")
        sys.exit(1)