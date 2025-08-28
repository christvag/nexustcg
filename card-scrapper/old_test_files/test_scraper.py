from database.sqlite_manager import SQLiteManager
from scrapers.mtg_scraper import MTGScraper
import logging

logging.basicConfig(level=logging.DEBUG)

# Test the database connection and card insertion
db = SQLiteManager("test_cards.db")
if not db.connect():
    print("Failed to connect to database")
    exit(1)

if not db.create_tables():
    print("Failed to create tables")
    exit(1)

# Test inserting a single card manually
test_card = {
    'card_game': 'Test Game',
    'set_name': 'Test Set',
    'card_name': 'Test Card',
    'rarity': 'Common',
    'card_number': '001',
    'card_image_url': 'https://example.com/card.jpg'
}

print("Inserting test card...")
if db.insert_card(test_card):
    print("Test card inserted successfully")
else:
    print("Failed to insert test card")

count = db.get_card_count()
print(f"Total cards in database: {count}")

# Now test MTG scraper with limited scope
print("\nTesting MTG scraper...")
scraper = MTGScraper()

# Override the scrape_via_api method to limit to just one set
def limited_scrape():
    import json
    try:
        # Get just one set
        sets_url = f"{scraper.api_base}/sets"
        sets_response = scraper.fetch_page(sets_url, use_cloudscraper=False)
        
        if not sets_response:
            return []
        
        sets_data = json.loads(sets_response)
        sets_list = sets_data.get('data', [])[:1]  # Just get first set
        
        cards = []
        for set_data in sets_list:
            print(f"Processing set: {set_data.get('name')}")
            set_cards = scraper.scrape_set_cards(set_data)
            cards.extend(set_cards[:5])  # Limit to 5 cards
            break  # Just one set
        
        return cards
    except Exception as e:
        print(f"Error: {e}")
        return []

# Test with limited scraping
cards = limited_scrape()
print(f"Scraped {len(cards)} test cards")

if cards:
    print("Sample card:", cards[0])
    
    # Try to save these cards
    saved_count = db.bulk_insert_cards(cards)
    print(f"Saved {saved_count} cards to database")
    
    final_count = db.get_card_count()
    print(f"Final count in database: {final_count}")

db.disconnect()