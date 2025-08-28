from scrapers.base_scraper import BaseScraper
import logging
import json
import requests
from typing import List, Dict, Any
from tqdm import tqdm
import time

logger = logging.getLogger(__name__)


class MTGScraperComplete(BaseScraper):
    def __init__(self):
        super().__init__("Magic The Gathering")
        self.base_url = "https://scryfall.com"
        self.api_base = "https://api.scryfall.com"
        
    def scrape(self) -> List[Dict[str, Any]]:
        logger.info(f"Starting {self.game_name} scraper (Complete Database)...")
        all_cards = []
        
        try:
            # Use comprehensive API approach to get ALL sets and cards
            all_cards = self.scrape_complete_database()
            
            logger.info(f"Total MTG cards scraped: {len(all_cards)}")
            return all_cards
            
        except Exception as e:
            logger.error(f"Error in MTG scraper: {e}")
            return all_cards
    
    def scrape_complete_database(self) -> List[Dict[str, Any]]:
        cards = []
        try:
            logger.info("Fetching ALL MTG sets from Scryfall API...")
            
            # Get ALL sets from API
            sets_url = f"{self.api_base}/sets"
            sets_response = self.fetch_page(sets_url, use_cloudscraper=False)
            
            if not sets_response:
                logger.error("Failed to fetch MTG sets from API")
                return cards
            
            sets_data = json.loads(sets_response)
            all_sets = sets_data.get('data', [])
            
            logger.info(f"Found {len(all_sets)} total MTG sets")
            
            # Filter for main sets (but include more types than before)
            relevant_set_types = [
                'core', 'expansion', 'masters', 'draft_innovation', 
                'commander', 'planechase', 'archenemy', 'from_the_vault',
                'premium_deck', 'duel_deck', 'starter', 'funny',
                'memorabilia', 'treasure_chest', 'spellbook',
                'arsenal', 'box', 'promo', 'token'
            ]
            
            main_sets = [s for s in all_sets if s.get('set_type') in relevant_set_types]
            
            logger.info(f"Processing {len(main_sets)} relevant MTG sets")
            
            # Sort by release date (newest first) and limit for demo
            main_sets = sorted(main_sets, key=lambda x: x.get('released_at', ''), reverse=True)
            
            # For demo, process first 20 sets. Remove this limit in production.
            main_sets = main_sets[:20]
            logger.info(f"Demo mode: Processing first {len(main_sets)} sets")
            
            for set_data in tqdm(main_sets, desc="Scraping MTG sets"):
                set_cards = self.scrape_complete_set(set_data)
                cards.extend(set_cards)
                time.sleep(0.1)  # Respect API rate limits
            
            return cards
            
        except Exception as e:
            logger.error(f"Error scraping complete database: {e}")
            return cards
    
    def scrape_complete_set(self, set_data: Dict) -> List[Dict[str, Any]]:
        """Scrape ALL cards from a set using Scryfall API"""
        cards = []
        try:
            set_code = set_data.get('code')
            set_name = set_data.get('name')
            
            if not set_code or not set_name:
                return cards
            
            # Use Scryfall's search API to get ALL cards from this set
            search_url = f"{self.api_base}/cards/search"
            
            has_more = True
            next_page = f"{search_url}?q=set:{set_code}&unique=prints"
            
            while has_more and next_page:
                response_text = self.fetch_page(next_page, use_cloudscraper=False)
                if not response_text:
                    break
                
                data = json.loads(response_text)
                cards_data = data.get('data', [])
                
                for card in cards_data:
                    card_formatted = self.format_complete_mtg_card(card, set_name)
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
    
    def format_complete_mtg_card(self, card: Dict, set_name: str) -> Dict[str, Any]:
        """Format MTG card with complete information"""
        try:
            card_name = card.get('name')
            if not card_name:
                return None
            
            # Get collector number (this is the official card number in the set)
            card_number = card.get('collector_number')
            
            # Get rarity
            rarity = card.get('rarity', '').title()
            
            # Get the best quality card image available
            card_image_url = None
            image_uris = card.get('image_uris', {})
            if image_uris:
                # Prefer higher quality images
                card_image_url = (
                    image_uris.get('png') or 
                    image_uris.get('border_crop') or
                    image_uris.get('normal') or 
                    image_uris.get('large') or 
                    image_uris.get('small')
                )
            elif card.get('card_faces'):
                # For double-faced cards, use the first face's image
                faces = card.get('card_faces', [])
                if faces and len(faces) > 0:
                    face_images = faces[0].get('image_uris', {})
                    card_image_url = (
                        face_images.get('png') or
                        face_images.get('border_crop') or
                        face_images.get('normal') or 
                        face_images.get('large')
                    )
            
            # Get additional useful information
            mana_cost = card.get('mana_cost', '')
            card_type = card.get('type_line', '')
            
            # Include mana cost and type in rarity for better filtering
            if mana_cost or card_type:
                rarity_info = [rarity]
                if mana_cost:
                    rarity_info.append(f"Cost: {mana_cost}")
                if card_type:
                    # Get just the main type (before the first dash)
                    main_type = card_type.split('—')[0].strip()
                    rarity_info.append(main_type)
                rarity = " | ".join(rarity_info)
            
            return self.format_card_data(
                set_name=set_name,
                card_name=card_name,
                rarity=rarity,
                card_number=card_number,
                card_image_url=card_image_url
            )
            
        except Exception as e:
            logger.error(f"Error formatting complete MTG card: {e}")
            return None