from scrapers.base_scraper import BaseScraper
import logging
import json
import requests
from typing import List, Dict, Any
from tqdm import tqdm
import time
import re

logger = logging.getLogger(__name__)


class MTGScraperImproved(BaseScraper):
    def __init__(self):
        super().__init__("Magic The Gathering")
        self.base_url = "https://scryfall.com"
        self.api_base = "https://api.scryfall.com"
        self.sets_url = f"{self.base_url}/sets"
        
    def scrape(self) -> List[Dict[str, Any]]:
        logger.info(f"Starting {self.game_name} scraper (Complete Sets)...")
        all_cards = []
        
        try:
            # Get all sets from the main sets page
            all_cards = self.scrape_all_sets()
            
            logger.info(f"Total MTG cards scraped: {len(all_cards)}")
            return all_cards
            
        except Exception as e:
            logger.error(f"Error in MTG scraper: {e}")
            return all_cards
    
    def scrape_all_sets(self) -> List[Dict[str, Any]]:
        cards = []
        try:
            logger.info("Fetching MTG sets from main sets page...")
            
            # First get all sets from the main page
            html = self.fetch_page(self.sets_url)
            if not html:
                logger.error("Failed to fetch sets page")
                return []
            
            soup = self.parse_html(html)
            set_links = self.extract_set_links(soup)
            
            logger.info(f"Found {len(set_links)} MTG sets")
            
            # Limit sets for demo (remove this in production)
            set_links = set_links[:10]  # Process first 10 sets
            logger.info(f"Processing first {len(set_links)} sets for demo")
            
            # Process each set
            for set_code, set_name, set_url in tqdm(set_links, desc="Scraping MTG sets"):
                set_cards = self.scrape_set_page(set_code, set_name, set_url)
                cards.extend(set_cards)
                time.sleep(0.5)  # Be respectful to the server
            
            return cards
            
        except Exception as e:
            logger.error(f"Error scraping all sets: {e}")
            return cards
    
    def extract_set_links(self, soup) -> List[tuple]:
        """Extract set codes, names, and URLs from the main sets page"""
        set_links = []
        try:
            # Look for set links in the table
            # Sets page typically has a table or list of sets with links
            links = soup.find_all('a', href=True)
            
            for link in links:
                href = link.get('href', '')
                # Look for set URLs like /sets/otj
                if href.startswith('/sets/') and len(href.split('/')) == 3:
                    set_code = href.split('/')[-1]
                    set_name = link.get_text(strip=True)
                    
                    # Skip empty names or codes
                    if set_code and set_name and len(set_code) <= 5:
                        full_url = f"{self.base_url}{href}"
                        set_links.append((set_code, set_name, full_url))
            
            # Remove duplicates while preserving order
            seen = set()
            unique_links = []
            for item in set_links:
                if item[0] not in seen:
                    seen.add(item[0])
                    unique_links.append(item)
            
            return unique_links
            
        except Exception as e:
            logger.error(f"Error extracting set links: {e}")
            return []
    
    def scrape_set_page(self, set_code: str, set_name: str, set_url: str) -> List[Dict[str, Any]]:
        """Scrape all cards from an individual set page"""
        cards = []
        try:
            logger.info(f"Scraping set: {set_name} ({set_code})")
            
            html = self.fetch_page(set_url)
            if not html:
                return cards
            
            soup = self.parse_html(html)
            
            # Extract cards from the page
            card_elements = self.extract_card_elements(soup)
            
            for card_elem in card_elements:
                card_data = self.extract_card_info(card_elem, set_name)
                if card_data:
                    cards.append(card_data)
            
            logger.info(f"Extracted {len(cards)} cards from {set_name}")
            return cards
            
        except Exception as e:
            logger.error(f"Error scraping set {set_name}: {e}")
            return cards
    
    def extract_card_elements(self, soup):
        """Extract card elements from the set page"""
        # Look for card containers in the Scryfall layout
        card_selectors = [
            'img[alt]',  # Card images with alt text
            '.card',
            '.card-grid-item',
            '[data-card-name]'
        ]
        
        card_elements = []
        for selector in card_selectors:
            elements = soup.select(selector)
            if elements:
                card_elements = elements
                break
        
        # If we found images, filter for card images
        if card_elements and card_elements[0].name == 'img':
            # Filter out non-card images
            card_elements = [
                img for img in card_elements 
                if img.get('alt') and 
                not any(skip in img.get('src', '').lower() for skip in ['logo', 'icon', 'symbol'])
            ]
        
        return card_elements
    
    def extract_card_info(self, card_elem, set_name: str) -> Dict[str, Any]:
        """Extract card information from a card element"""
        try:
            if card_elem.name == 'img':
                # Extract from image element
                card_name = card_elem.get('alt', '')
                card_image_url = card_elem.get('src', '')
                
                # Try to get card number from nearby elements or image URL
                card_number = self.extract_card_number_from_image_url(card_image_url)
                
                # Determine rarity (this might need adjustment based on Scryfall's layout)
                rarity = self.determine_rarity_from_context(card_elem)
                
            else:
                # Extract from other element types
                card_name = card_elem.get('data-card-name') or card_elem.get_text(strip=True)
                
                # Look for image within the element
                img_elem = card_elem.find('img')
                card_image_url = img_elem.get('src', '') if img_elem else None
                
                card_number = self.extract_card_number_from_context(card_elem)
                rarity = self.determine_rarity_from_context(card_elem)
            
            if not card_name:
                return None
            
            # Clean up the card name
            card_name = self.clean_card_name(card_name)
            
            return self.format_card_data(
                set_name=set_name,
                card_name=card_name,
                rarity=rarity,
                card_number=card_number,
                card_image_url=card_image_url
            )
            
        except Exception as e:
            logger.error(f"Error extracting card info: {e}")
            return None
    
    def extract_card_number_from_image_url(self, image_url: str) -> str:
        """Try to extract card number from Scryfall image URL"""
        if not image_url:
            return None
        
        # Scryfall URLs often contain card IDs
        # Example: https://cards.scryfall.io/normal/front/d/0/d0467b6f.jpg
        match = re.search(r'/([a-f0-9-]+)\.jpg', image_url)
        if match:
            return match.group(1)[:8]  # Use first 8 characters as card number
        
        return None
    
    def extract_card_number_from_context(self, card_elem) -> str:
        """Try to extract card number from element context"""
        # Look for number patterns in text or attributes
        text = card_elem.get_text() if hasattr(card_elem, 'get_text') else str(card_elem)
        
        # Look for patterns like "#123" or "123/456"
        number_match = re.search(r'#?(\d+)(?:/\d+)?', text)
        if number_match:
            return number_match.group(1)
        
        return None
    
    def determine_rarity_from_context(self, card_elem) -> str:
        """Try to determine rarity from element context"""
        # This is challenging without knowing Scryfall's exact layout
        # Default to "Unknown" and let the API-based approach handle it
        return "Unknown"
    
    def clean_card_name(self, name: str) -> str:
        """Clean up card names extracted from alt text or other sources"""
        if not name:
            return name
        
        # Remove common prefixes/suffixes from alt text
        name = re.sub(r'^(Card image of|Image of)\s+', '', name, flags=re.IGNORECASE)
        name = re.sub(r'\s+(card|image)$', '', name, flags=re.IGNORECASE)
        
        return name.strip()