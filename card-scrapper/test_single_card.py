#!/usr/bin/env python3
"""
Simple test for scraping a single Pokemon card
"""
import sys
import os
from pathlib import Path

# Add the project root to the Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from scrapers.pokemon_scraper_improved import PokemonScraperImproved

def test_single_card():
    """Test scraping a single card"""
    print("Testing single card scraping...")
    
    scraper = PokemonScraperImproved()
    
    # Test card URL
    card_url = "https://limitlesstcg.com/cards/BLK/1"
    
    try:
        card_data = scraper.scrape_individual_card(card_url, "Black Bolt", "1")
        
        if card_data:
            print(f"\nSuccessfully scraped card: {card_data.get('card_name')}")
            print(f"Set: {card_data.get('set_name')}")
            print(f"Number: {card_data.get('card_number')}")
            print(f"Rarity: {card_data.get('rarity')}")
            print(f"Type: {card_data.get('card_type')}")
            print(f"HP: {card_data.get('hp')}")
            print(f"Print versions: {len(card_data.get('print_versions', []))} versions found")
            return True
        else:
            print("Failed to scrape card data")
            return False
            
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    if test_single_card():
        print("\n[SUCCESS] Card scraping test passed!")
    else:
        print("\n[ERROR] Card scraping test failed!")