from scrapers.base_scraper import BaseScraper
import logging
import json
from typing import List, Dict, Any
from tqdm import tqdm

logger = logging.getLogger(__name__)


class PokemonScraper(BaseScraper):
    def __init__(self):
        super().__init__("Pokemon TCG")
        self.base_url = "https://limitlesstcg.com"
        self.cards_url = f"{self.base_url}/cards"
        
    def scrape(self) -> List[Dict[str, Any]]:
        logger.info(f"Starting {self.game_name} scraper...")
        all_cards = []
        
        try:
            # First, get the main cards page
            html = self.fetch_page(self.cards_url)
            if not html:
                logger.error("Failed to fetch Pokemon cards page")
                return []
            
            soup = self.parse_html(html)
            
            # Find all set links
            set_links = self.extract_set_links(soup)
            logger.info(f"Found {len(set_links)} Pokemon sets to scrape")
            
            # Scrape each set
            for set_name, set_url in tqdm(set_links, desc="Scraping Pokemon sets"):
                cards = self.scrape_set(set_name, set_url)
                all_cards.extend(cards)
                logger.info(f"Scraped {len(cards)} cards from {set_name}")
            
            logger.info(f"Total Pokemon cards scraped: {len(all_cards)}")
            return all_cards
            
        except Exception as e:
            logger.error(f"Error in Pokemon scraper: {e}")
            return all_cards
    
    def extract_set_links(self, soup) -> List[tuple]:
        set_links = []
        try:
            # Look for set sections
            set_sections = soup.find_all('div', class_='set-list')
            if not set_sections:
                # Alternative: look for links that lead to sets
                links = soup.find_all('a', href=True)
                for link in links:
                    href = link.get('href', '')
                    if '/cards/' in href and href != '/cards':
                        set_name = link.get_text(strip=True)
                        if set_name:
                            full_url = f"{self.base_url}{href}" if not href.startswith('http') else href
                            set_links.append((set_name, full_url))
            else:
                for section in set_sections:
                    links = section.find_all('a', href=True)
                    for link in links:
                        set_name = link.get_text(strip=True)
                        href = link.get('href', '')
                        if set_name and href:
                            full_url = f"{self.base_url}{href}" if not href.startswith('http') else href
                            set_links.append((set_name, full_url))
            
            # Remove duplicates while preserving order
            seen = set()
            unique_links = []
            for item in set_links:
                if item[1] not in seen:
                    seen.add(item[1])
                    unique_links.append(item)
            
            return unique_links[:50]  # Limit to first 50 sets for initial scraping
            
        except Exception as e:
            logger.error(f"Error extracting set links: {e}")
            return []
    
    def scrape_set(self, set_name: str, set_url: str) -> List[Dict[str, Any]]:
        cards = []
        try:
            html = self.fetch_page(set_url)
            if not html:
                return cards
            
            soup = self.parse_html(html)
            
            # Look for card containers
            card_elements = soup.find_all('div', class_='card-item') or \
                          soup.find_all('div', class_='card') or \
                          soup.find_all('article', class_='card')
            
            for card_elem in card_elements:
                card_data = self.extract_card_from_element(card_elem, set_name)
                if card_data:
                    cards.append(card_data)
            
            # If no cards found with div, try table format
            if not cards:
                cards = self.extract_cards_from_table(soup, set_name)
            
            return cards
            
        except Exception as e:
            logger.error(f"Error scraping set {set_name}: {e}")
            return cards
    
    def extract_card_from_element(self, card_elem, set_name: str) -> Dict[str, Any]:
        try:
            # Extract card name
            name_elem = card_elem.find(['h3', 'h4', 'h5', 'a', 'span'], class_=['card-name', 'name', 'title'])
            if not name_elem:
                name_elem = card_elem.find('a')
            card_name = name_elem.get_text(strip=True) if name_elem else None
            
            if not card_name:
                return None
            
            # Extract card number
            number_elem = card_elem.find(['span', 'div'], class_=['card-number', 'number', 'id'])
            card_number = number_elem.get_text(strip=True) if number_elem else None
            
            # Extract rarity
            rarity_elem = card_elem.find(['span', 'div'], class_=['rarity', 'card-rarity'])
            rarity = rarity_elem.get_text(strip=True) if rarity_elem else None
            
            # Extract image URL
            img_elem = card_elem.find('img')
            if img_elem:
                card_image = img_elem.get('src') or img_elem.get('data-src')
                if card_image and not card_image.startswith('http'):
                    card_image = f"{self.base_url}{card_image}"
            else:
                card_image = None
            
            return self.format_card_data(
                set_name=set_name,
                card_name=card_name,
                rarity=rarity,
                card_number=card_number,
                card_image_url=card_image
            )
            
        except Exception as e:
            logger.error(f"Error extracting card from element: {e}")
            return None
    
    def extract_cards_from_table(self, soup, set_name: str) -> List[Dict[str, Any]]:
        cards = []
        try:
            tables = soup.find_all('table')
            for table in tables:
                rows = table.find_all('tr')[1:]  # Skip header row
                for row in rows:
                    cells = row.find_all(['td', 'th'])
                    if len(cells) >= 2:
                        # Typical format: Number, Name, Type, Rarity, etc.
                        card_number = cells[0].get_text(strip=True)
                        card_name = cells[1].get_text(strip=True)
                        
                        # Try to find rarity (usually in later columns)
                        rarity = None
                        if len(cells) > 3:
                            rarity = cells[3].get_text(strip=True)
                        
                        # Try to find image
                        img_elem = row.find('img')
                        card_image = None
                        if img_elem:
                            card_image = img_elem.get('src') or img_elem.get('data-src')
                            if card_image and not card_image.startswith('http'):
                                card_image = f"{self.base_url}{card_image}"
                        
                        card_data = self.format_card_data(
                            set_name=set_name,
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