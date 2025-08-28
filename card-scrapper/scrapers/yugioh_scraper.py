from scrapers.base_scraper import BaseScraper
import logging
import json
from typing import List, Dict, Any
from tqdm import tqdm
import time

logger = logging.getLogger(__name__)


class YuGiOhScraper(BaseScraper):
    def __init__(self):
        super().__init__("YuGiOh")
        self.base_url = "https://ygoprodeck.com"
        self.api_url = "https://db.ygoprodeck.com/api/v7/cardinfo.php"
        self.cards_per_page = 24
        
    def scrape(self) -> List[Dict[str, Any]]:
        logger.info(f"Starting {self.game_name} scraper...")
        all_cards = []
        
        try:
            # YGOProdeck has an API we can use
            all_cards = self.scrape_via_api()
            
            if not all_cards:
                # Fallback to web scraping if API fails
                all_cards = self.scrape_via_web()
            
            logger.info(f"Total YuGiOh cards scraped: {len(all_cards)}")
            return all_cards
            
        except Exception as e:
            logger.error(f"Error in YuGiOh scraper: {e}")
            return all_cards
    
    def scrape_via_api(self) -> List[Dict[str, Any]]:
        cards = []
        try:
            logger.info("Attempting to fetch YuGiOh cards via API...")
            
            # Fetch all cards from API
            response_text = self.fetch_page(self.api_url, use_cloudscraper=False)
            if not response_text:
                return cards
            
            data = json.loads(response_text)
            
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
                    # Card without set information
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
            else:
                set_name = "No Set"
                card_number = str(card.get('id', ''))
                rarity = card.get('race')  # Use card type as rarity if no set
            
            # Get card image
            card_images = card.get('card_images', [])
            card_image_url = None
            if card_images and len(card_images) > 0:
                card_image_url = card_images[0].get('image_url')
            
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
    
    def scrape_via_web(self) -> List[Dict[str, Any]]:
        cards = []
        try:
            logger.info("Falling back to web scraping for YuGiOh cards...")
            
            # Start with the card database page
            base_db_url = "https://ygoprodeck.com/card-database/"
            offset = 0
            max_pages = 100  # Limit to prevent infinite loops
            
            for page in range(max_pages):
                url = f"{base_db_url}?num={self.cards_per_page}&offset={offset}"
                html = self.fetch_page(url)
                
                if not html:
                    break
                
                soup = self.parse_html(html)
                page_cards = self.extract_cards_from_page(soup)
                
                if not page_cards:
                    break
                
                cards.extend(page_cards)
                logger.info(f"Scraped page {page + 1}, total cards: {len(cards)}")
                
                offset += self.cards_per_page
                time.sleep(1)  # Be polite
                
                # Check if there's a next page
                if not self.has_next_page(soup):
                    break
            
            return cards
            
        except Exception as e:
            logger.error(f"Error in web scraping: {e}")
            return cards
    
    def extract_cards_from_page(self, soup) -> List[Dict[str, Any]]:
        cards = []
        try:
            # Look for card containers
            card_elements = soup.find_all('div', class_='card-item') or \
                          soup.find_all('article', class_='card') or \
                          soup.find_all('div', class_='card-list-item')
            
            for card_elem in card_elements:
                card_data = self.extract_card_from_web_element(card_elem)
                if card_data:
                    cards.append(card_data)
            
            return cards
            
        except Exception as e:
            logger.error(f"Error extracting cards from page: {e}")
            return cards
    
    def extract_card_from_web_element(self, card_elem) -> Dict[str, Any]:
        try:
            # Extract card name
            name_elem = card_elem.find(['h3', 'h4', 'a'], class_=['card-name', 'name', 'card-title'])
            if not name_elem:
                name_elem = card_elem.find('a')
            card_name = name_elem.get_text(strip=True) if name_elem else None
            
            if not card_name:
                return None
            
            # Extract set name (might need to navigate to card detail)
            set_elem = card_elem.find(['span', 'div'], class_=['set-name', 'card-set'])
            set_name = set_elem.get_text(strip=True) if set_elem else "YuGiOh Set"
            
            # Extract card number/code
            code_elem = card_elem.find(['span', 'div'], class_=['card-code', 'card-number'])
            card_number = code_elem.get_text(strip=True) if code_elem else None
            
            # Extract rarity
            rarity_elem = card_elem.find(['span', 'div'], class_=['rarity', 'card-rarity'])
            rarity = rarity_elem.get_text(strip=True) if rarity_elem else None
            
            # Extract image URL
            img_elem = card_elem.find('img')
            card_image = None
            if img_elem:
                card_image = img_elem.get('src') or img_elem.get('data-src')
                if card_image and not card_image.startswith('http'):
                    card_image = f"{self.base_url}{card_image}"
            
            return self.format_card_data(
                set_name=set_name,
                card_name=card_name,
                rarity=rarity,
                card_number=card_number,
                card_image_url=card_image
            )
            
        except Exception as e:
            logger.error(f"Error extracting card from web element: {e}")
            return None
    
    def has_next_page(self, soup) -> bool:
        try:
            # Look for pagination elements
            next_button = soup.find('a', {'class': 'next'}) or \
                         soup.find('a', text='Next') or \
                         soup.find('button', text='Next')
            
            return next_button is not None and not next_button.get('disabled')
            
        except:
            return False