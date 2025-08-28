from scrapers.base_scraper import BaseScraper
import logging
import requests
from typing import List, Dict, Any
from tqdm import tqdm

logger = logging.getLogger(__name__)


class YuGiOhScraperSimple(BaseScraper):
    def __init__(self):
        super().__init__("YuGiOh")
        self.api_url = "https://db.ygoprodeck.com/api/v7/cardinfo.php"
        
    def scrape(self) -> List[Dict[str, Any]]:
        logger.info(f"Starting {self.game_name} scraper (Complete Database)...")
        all_cards = []
        
        try:
            # Get complete card database from API
            all_cards = self.scrape_complete_api()
            
            logger.info(f"Total YuGiOh cards scraped: {len(all_cards)}")
            return all_cards
            
        except Exception as e:
            logger.error(f"Error in YuGiOh scraper: {e}")
            return all_cards
    
    def scrape_complete_api(self) -> List[Dict[str, Any]]:
        cards = []
        try:
            logger.info("Fetching complete YuGiOh database from API...")
            
            # Simple request - this worked in debug script
            response = requests.get(self.api_url, timeout=60)
            response.raise_for_status()
            
            logger.info(f"API response received: {len(response.content)} bytes")
            
            # Parse JSON
            data = response.json()
            
            if 'data' in data:
                card_list = data['data']
            else:
                card_list = data if isinstance(data, list) else []
            
            logger.info(f"Processing {len(card_list)} cards from API...")
            
            for card in tqdm(card_list, desc="Processing YuGiOh cards"):
                # Extract card sets information
                card_sets = card.get('card_sets', [])
                
                if card_sets:
                    # Create an entry for each set the card appears in
                    for card_set in card_sets:
                        card_data = self.format_api_card(card, card_set)
                        if card_data:
                            cards.append(card_data)
                else:
                    # Card without set information - still include it
                    card_data = self.format_api_card(card, None)
                    if card_data:
                        cards.append(card_data)
            
            return cards
            
        except Exception as e:
            logger.error(f"Error fetching from API: {e}")
            return cards
    
    def format_api_card(self, card: Dict, card_set: Dict = None) -> Dict[str, Any]:
        try:
            card_name = card.get('name')
            if not card_name:
                return None
            
            # Get set information
            if card_set:
                set_name = card_set.get('set_name', 'Unknown Set')
                card_number = card_set.get('set_code')
                rarity = card_set.get('set_rarity')
                
                # Some cards have set_rarity_code which might be more useful
                if not rarity:
                    rarity = card_set.get('set_rarity_code')
            else:
                set_name = "YuGiOh Generic"
                card_number = str(card.get('id', ''))
                # Use card type/race as rarity substitute
                card_type = card.get('type', '')
                race = card.get('race', '')
                rarity = f"{card_type}" if card_type else "Unknown"
            
            # Get card image - prefer normal resolution
            card_image_url = None
            card_images = card.get('card_images', [])
            if card_images and len(card_images) > 0:
                # Try different image sizes, prefer higher quality
                first_image = card_images[0]
                card_image_url = (
                    first_image.get('image_url') or 
                    first_image.get('image_url_small') or 
                    first_image.get('image_url_cropped')
                )
            
            return self.format_card_data(
                set_name=set_name,
                card_name=card_name,
                rarity=rarity,
                card_number=card_number,
                card_image_url=card_image_url
            )
            
        except Exception as e:
            logger.error(f"Error formatting API card: {e}")
            return None