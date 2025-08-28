from scrapers.base_scraper import BaseScraper
import logging
import json
from typing import List, Dict, Any
from tqdm import tqdm
import time

logger = logging.getLogger(__name__)


class MTGScraper(BaseScraper):
    def __init__(self):
        super().__init__("Magic The Gathering")
        self.base_url = "https://scryfall.com"
        self.api_base = "https://api.scryfall.com"
        
    def scrape(self) -> List[Dict[str, Any]]:
        logger.info(f"Starting {self.game_name} scraper...")
        all_cards = []
        
        try:
            # Scryfall has an excellent API
            all_cards = self.scrape_via_api()
            
            logger.info(f"Total MTG cards scraped: {len(all_cards)}")
            return all_cards
            
        except Exception as e:
            logger.error(f"Error in MTG scraper: {e}")
            return all_cards
    
    def scrape_via_api(self) -> List[Dict[str, Any]]:
        cards = []
        try:
            logger.info("Fetching MTG sets from Scryfall API...")
            
            # First, get all sets
            sets_url = f"{self.api_base}/sets"
            sets_response = self.fetch_page(sets_url, use_cloudscraper=False)
            
            if not sets_response:
                logger.error("Failed to fetch MTG sets")
                return cards
            
            sets_data = json.loads(sets_response)
            sets_list = sets_data.get('data', [])
            
            logger.info(f"Found {len(sets_list)} MTG sets")
            
            # Filter to get only main sets (exclude tokens, promos, etc.)
            main_sets = [s for s in sets_list if s.get('set_type') in [
                'core', 'expansion', 'masters', 'draft_innovation', 
                'commander', 'planechase', 'archenemy', 'from_the_vault',
                'premium_deck', 'duel_deck', 'starter'
            ]]
            
            logger.info(f"Processing {len(main_sets)} main MTG sets")
            
            # Limit to recent sets to avoid overwhelming the system
            main_sets = sorted(main_sets, key=lambda x: x.get('released_at', ''), reverse=True)[:5]  # Reduced for demo
            
            for set_data in tqdm(main_sets, desc="Scraping MTG sets"):
                set_cards = self.scrape_set_cards(set_data)
                cards.extend(set_cards)
                time.sleep(0.1)  # Respect API rate limits
            
            return cards
            
        except Exception as e:
            logger.error(f"Error fetching from Scryfall API: {e}")
            return cards
    
    def scrape_set_cards(self, set_data: Dict) -> List[Dict[str, Any]]:
        cards = []
        try:
            set_code = set_data.get('code')
            set_name = set_data.get('name')
            
            if not set_code or not set_name:
                return cards
            
            # Use Scryfall's search API to get cards from this set
            search_url = f"{self.api_base}/cards/search"
            params = f"?q=set:{set_code}&unique=prints"
            
            has_more = True
            next_page = f"{search_url}{params}"
            
            while has_more and next_page:
                response_text = self.fetch_page(next_page, use_cloudscraper=False)
                if not response_text:
                    break
                
                data = json.loads(response_text)
                cards_data = data.get('data', [])
                
                for card in cards_data:
                    card_formatted = self.format_mtg_card(card, set_name)
                    if card_formatted:
                        cards.append(card_formatted)
                
                # Check if there are more pages
                has_more = data.get('has_more', False)
                next_page = data.get('next_page')
                
                if has_more and next_page:
                    time.sleep(0.1)  # Rate limiting
            
            logger.info(f"Scraped {len(cards)} cards from {set_name}")
            return cards
            
        except Exception as e:
            logger.error(f"Error scraping MTG set {set_data.get('name')}: {e}")
            return cards
    
    def format_mtg_card(self, card: Dict, set_name: str) -> Dict[str, Any]:
        try:
            card_name = card.get('name')
            if not card_name:
                return None
            
            # Get collector number
            card_number = card.get('collector_number')
            
            # Get rarity
            rarity = card.get('rarity', '').title()
            
            # Get card image (prefer normal image)
            card_image_url = None
            image_uris = card.get('image_uris', {})
            if image_uris:
                card_image_url = image_uris.get('normal') or image_uris.get('large') or image_uris.get('small')
            elif card.get('card_faces'):
                # For double-faced cards, use the first face's image
                faces = card.get('card_faces', [])
                if faces and len(faces) > 0:
                    face_images = faces[0].get('image_uris', {})
                    card_image_url = face_images.get('normal') or face_images.get('large')
            
            return self.format_card_data(
                set_name=set_name,
                card_name=card_name,
                rarity=rarity,
                card_number=card_number,
                card_image_url=card_image_url
            )
            
        except Exception as e:
            logger.error(f"Error formatting MTG card: {e}")
            return None