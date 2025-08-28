from scrapers.base_scraper import BaseScraper
import logging
import json
from typing import List, Dict, Any
from tqdm import tqdm
import time

logger = logging.getLogger(__name__)


class LorcanaScraper(BaseScraper):
    def __init__(self):
        super().__init__("Disney Lorcana")
        self.base_url = "https://lorcania.com"
        self.cards_url = f"{self.base_url}/cards"
        
    def scrape(self) -> List[Dict[str, Any]]:
        logger.info(f"Starting {self.game_name} scraper...")
        all_cards = []
        
        try:
            # First approach: Try to get all cards from the main cards page
            all_cards = self.scrape_all_cards()
            
            if not all_cards:
                # Fallback: Try to scrape by sets
                all_cards = self.scrape_by_sets()
            
            logger.info(f"Total Disney Lorcana cards scraped: {len(all_cards)}")
            return all_cards
            
        except Exception as e:
            logger.error(f"Error in Lorcana scraper: {e}")
            return all_cards
    
    def scrape_all_cards(self) -> List[Dict[str, Any]]:
        cards = []
        try:
            logger.info("Attempting to scrape all Lorcana cards from main page...")
            
            # Lorcania might paginate or load cards dynamically
            page = 1
            max_pages = 50
            
            while page <= max_pages:
                url = f"{self.cards_url}?page={page}"
                html = self.fetch_page(url)
                
                if not html:
                    break
                
                soup = self.parse_html(html)
                page_cards = self.extract_cards_from_page(soup)
                
                if not page_cards:
                    # Try without pagination
                    if page == 1:
                        url = self.cards_url
                        html = self.fetch_page(url)
                        if html:
                            soup = self.parse_html(html)
                            page_cards = self.extract_cards_from_page(soup)
                    
                    if not page_cards:
                        break
                
                cards.extend(page_cards)
                logger.info(f"Scraped page {page}, total cards: {len(cards)}")
                
                # Check if there's a next page
                if not self.has_next_page(soup):
                    break
                
                page += 1
                time.sleep(1)
            
            return cards
            
        except Exception as e:
            logger.error(f"Error scraping all cards: {e}")
            return cards
    
    def scrape_by_sets(self) -> List[Dict[str, Any]]:
        cards = []
        try:
            logger.info("Attempting to scrape Lorcana cards by sets...")
            
            # Known Lorcana sets (as of 2024)
            known_sets = [
                "The First Chapter",
                "Rise of the Floodborn",
                "Into the Inklands",
                "Ursula's Return",
                "Shimmering Skies"
            ]
            
            for set_name in tqdm(known_sets, desc="Scraping Lorcana sets"):
                set_cards = self.scrape_set(set_name)
                cards.extend(set_cards)
                logger.info(f"Scraped {len(set_cards)} cards from {set_name}")
            
            return cards
            
        except Exception as e:
            logger.error(f"Error scraping by sets: {e}")
            return cards
    
    def scrape_set(self, set_name: str) -> List[Dict[str, Any]]:
        cards = []
        try:
            # Try different URL patterns for sets
            set_slug = set_name.lower().replace(' ', '-').replace("'", "")
            possible_urls = [
                f"{self.base_url}/cards?set={set_slug}",
                f"{self.base_url}/sets/{set_slug}",
                f"{self.base_url}/cards/{set_slug}"
            ]
            
            for url in possible_urls:
                html = self.fetch_page(url)
                if html:
                    soup = self.parse_html(html)
                    cards = self.extract_cards_from_page(soup, set_name)
                    if cards:
                        break
            
            return cards
            
        except Exception as e:
            logger.error(f"Error scraping set {set_name}: {e}")
            return cards
    
    def extract_cards_from_page(self, soup, set_name: str = None) -> List[Dict[str, Any]]:
        cards = []
        try:
            # Look for card containers - try multiple possible selectors
            card_selectors = [
                ('div', 'card-item'),
                ('article', 'card'),
                ('div', 'card'),
                ('div', 'card-container'),
                ('li', 'card-list-item'),
                ('div', 'grid-item')
            ]
            
            card_elements = []
            for tag, class_name in card_selectors:
                card_elements = soup.find_all(tag, class_=class_name)
                if card_elements:
                    break
            
            # If no cards found with classes, try data attributes
            if not card_elements:
                card_elements = soup.find_all('div', {'data-card': True}) or \
                              soup.find_all('a', {'data-card-name': True})
            
            for card_elem in card_elements:
                card_data = self.extract_lorcana_card(card_elem, set_name)
                if card_data:
                    cards.append(card_data)
            
            # If still no cards, try table format
            if not cards:
                cards = self.extract_cards_from_table(soup, set_name)
            
            return cards
            
        except Exception as e:
            logger.error(f"Error extracting cards from page: {e}")
            return cards
    
    def extract_lorcana_card(self, card_elem, set_name: str = None) -> Dict[str, Any]:
        try:
            # Extract card name
            name_selectors = ['card-name', 'name', 'title', 'card-title']
            card_name = None
            for selector in name_selectors:
                name_elem = card_elem.find(class_=selector)
                if name_elem:
                    card_name = name_elem.get_text(strip=True)
                    break
            
            if not card_name:
                # Try finding in links or headers
                name_elem = card_elem.find(['h3', 'h4', 'h5', 'a'])
                if name_elem:
                    card_name = name_elem.get_text(strip=True)
            
            if not card_name:
                return None
            
            # Extract set name if not provided
            if not set_name:
                set_elem = card_elem.find(class_=['set-name', 'card-set', 'set'])
                set_name = set_elem.get_text(strip=True) if set_elem else "Lorcana Set"
            
            # Extract card number
            number_selectors = ['card-number', 'number', 'collector-number', 'card-id']
            card_number = None
            for selector in number_selectors:
                number_elem = card_elem.find(class_=selector)
                if number_elem:
                    card_number = number_elem.get_text(strip=True)
                    break
            
            # Extract rarity
            rarity_selectors = ['rarity', 'card-rarity', 'card-rare']
            rarity = None
            for selector in rarity_selectors:
                rarity_elem = card_elem.find(class_=selector)
                if rarity_elem:
                    rarity = rarity_elem.get_text(strip=True)
                    break
            
            # Extract image URL
            img_elem = card_elem.find('img')
            card_image = None
            if img_elem:
                card_image = img_elem.get('src') or img_elem.get('data-src') or img_elem.get('data-lazy-src')
                if card_image:
                    # Handle relative URLs
                    if not card_image.startswith('http'):
                        if card_image.startswith('//'):
                            card_image = f"https:{card_image}"
                        else:
                            card_image = f"{self.base_url}{card_image}"
            
            return self.format_card_data(
                set_name=set_name,
                card_name=card_name,
                rarity=rarity,
                card_number=card_number,
                card_image_url=card_image
            )
            
        except Exception as e:
            logger.error(f"Error extracting Lorcana card: {e}")
            return None
    
    def extract_cards_from_table(self, soup, set_name: str = None) -> List[Dict[str, Any]]:
        cards = []
        try:
            tables = soup.find_all('table')
            for table in tables:
                rows = table.find_all('tr')[1:]  # Skip header
                for row in rows:
                    cells = row.find_all(['td', 'th'])
                    if len(cells) >= 2:
                        # Common format: Number, Name, Type, Cost, Rarity
                        card_number = cells[0].get_text(strip=True) if len(cells) > 0 else None
                        card_name = cells[1].get_text(strip=True) if len(cells) > 1 else None
                        
                        # Rarity might be in different positions
                        rarity = None
                        for i in range(2, len(cells)):
                            cell_text = cells[i].get_text(strip=True).lower()
                            if any(r in cell_text for r in ['common', 'uncommon', 'rare', 'super', 'legendary', 'enchanted']):
                                rarity = cells[i].get_text(strip=True)
                                break
                        
                        # Look for image
                        img_elem = row.find('img')
                        card_image = None
                        if img_elem:
                            card_image = img_elem.get('src') or img_elem.get('data-src')
                            if card_image and not card_image.startswith('http'):
                                card_image = f"{self.base_url}{card_image}"
                        
                        if card_name:
                            card_data = self.format_card_data(
                                set_name=set_name or "Lorcana Set",
                                card_name=card_name,
                                rarity=rarity,
                                card_number=card_number,
                                card_image_url=card_image
                            )
                            if card_data:
                                cards.append(card_data)
            
            return cards
            
        except Exception as e:
            logger.error(f"Error extracting cards from table: {e}")
            return cards
    
    def has_next_page(self, soup) -> bool:
        try:
            # Look for pagination indicators
            next_indicators = [
                soup.find('a', {'class': 'next'}),
                soup.find('a', text='Next'),
                soup.find('button', text='Next'),
                soup.find('a', {'aria-label': 'Next'}),
                soup.find('li', {'class': 'next'})
            ]
            
            for indicator in next_indicators:
                if indicator and not indicator.get('disabled'):
                    return True
            
            return False
            
        except:
            return False