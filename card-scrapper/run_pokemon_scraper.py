#!/usr/bin/env python3
"""
Main script to run the improved Pokemon scraper with full set collection
"""
import sys
import os
import logging
from pathlib import Path
from datetime import datetime

# Add the project root to the Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from scrapers.pokemon_scraper_improved import PokemonScraperImproved
from database.sqlite_manager_enhanced import SQLiteManagerEnhanced

# Configure logging
log_filename = f"pokemon_scraper_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_filename),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)


def main():
    """Main function to run the Pokemon scraper"""
    print("Pokemon Card Scraper - Improved Version")
    print("=" * 50)
    print(f"Log file: {log_filename}")
    print()
    
    # Initialize components
    scraper = PokemonScraperImproved()
    db_manager = SQLiteManagerEnhanced("pokemon_cards_complete.db")
    
    try:
        # Connect to database
        logger.info("Connecting to database...")
        if not db_manager.connect():
            logger.error("Failed to connect to database")
            return False
        
        # Create tables
        logger.info("Creating database tables...")
        if not db_manager.create_tables():
            logger.error("Failed to create database tables")
            return False
        
        # Run scraper
        logger.info("Starting Pokemon card scraping...")
        print("Starting card scraping process...")
        print("This may take several minutes depending on the number of sets...")
        
        cards = scraper.scrape()
        
        if not cards:
            logger.error("No cards were scraped")
            print("ERROR: No cards were scraped!")
            return False
        
        logger.info(f"Successfully scraped {len(cards)} cards")
        print(f"\nScraping complete! Found {len(cards)} cards")
        
        # Save to database
        logger.info("Saving cards to database...")
        print("Saving to database...")
        
        inserted_count = db_manager.bulk_insert_cards(cards)
        logger.info(f"Successfully saved {inserted_count} cards to database")
        print(f"Successfully saved {inserted_count} cards to database")
        
        # Generate statistics
        total_count = db_manager.get_card_count("Pokemon TCG")
        sets = db_manager.get_all_sets("Pokemon TCG")
        
        print(f"\nFinal Statistics:")
        print(f"- Total cards in database: {total_count}")
        print(f"- Number of sets: {len(sets)}")
        print(f"- Database file: pokemon_cards_complete.db")
        
        # Show sample sets
        if sets:
            print(f"\nSample sets scraped:")
            for i, set_name in enumerate(sets[:10]):
                set_count = len(db_manager.get_cards_by_set("Pokemon TCG", set_name))
                print(f"  {i+1}. {set_name}: {set_count} cards")
            if len(sets) > 10:
                print(f"  ... and {len(sets) - 10} more sets")
        
        # Export sample data
        export_file = f"pokemon_cards_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        if db_manager.export_to_json(export_file, "Pokemon TCG"):
            print(f"\nData exported to: {export_file}")
        
        print(f"\nScraping completed successfully!")
        print(f"Check the log file for detailed information: {log_filename}")
        
        return True
        
    except KeyboardInterrupt:
        logger.info("Scraping interrupted by user")
        print("\nScraping interrupted by user")
        return False
        
    except Exception as e:
        logger.error(f"Scraping failed with error: {e}")
        print(f"\nERROR: Scraping failed - {e}")
        return False
        
    finally:
        db_manager.disconnect()


if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\nOperation cancelled by user")
        sys.exit(1)