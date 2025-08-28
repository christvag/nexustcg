from scrapers.base_scraper import BaseScraper
import logging
from typing import List, Dict, Any
from tqdm import tqdm

logger = logging.getLogger(__name__)


class OnePieceScraper(BaseScraper):
    def __init__(self):
        super().__init__("One Piece TCG")
        self.base_url = "https://onepiece.limitlesstcg.com"
        self.cards_url = f"{self.base_url}/cards"
        
    def scrape(self) -> List[Dict[str, Any]]:
        logger.info(f"Starting {self.game_name} scraper...")
        all_cards = []
        
        try:
            # Similar structure to Pokemon scraper since it's the same site
            html = self.fetch_page(self.cards_url)
            if not html:
                logger.error("Failed to fetch One Piece cards page")
                return []
            
            soup = self.parse_html(html)
            
            # Find all set links
            set_links = self.extract_set_links(soup)
            logger.info(f"Found {len(set_links)} One Piece sets to scrape")
            
            # Scrape each set
            for set_name, set_url in tqdm(set_links, desc="Scraping One Piece sets"):
                cards = self.scrape_set(set_name, set_url)
                all_cards.extend(cards)
                logger.info(f"Scraped {len(cards)} cards from {set_name}")
            
            logger.info(f"Total One Piece cards scraped: {len(all_cards)}")
            return all_cards
            
        except Exception as e:
            logger.error(f"Error in One Piece scraper: {e}")
            return all_cards
    
    def extract_set_links(self, soup) -> List[tuple]:
        set_links = []
        try:
            # Look for set sections or links to sets
            # Try different selectors that might contain set links
            possible_selectors = [
                ('div', 'set-list'),
                ('div', 'sets'),
                ('ul', 'sets-list'),
                ('div', 'content')
            ]
            
            set_containers = []
            for tag, class_name in possible_selectors:
                set_containers = soup.find_all(tag, class_=class_name)
                if set_containers:
                    break
            
            # If no containers found, look for all links that might be sets
            if not set_containers:
                set_containers = [soup]
            
            for container in set_containers:
                links = container.find_all('a', href=True)
                for link in links:
                    href = link.get('href', '')
                    # Filter for One Piece set links
                    if '/cards/' in href and href != '/cards':
                        set_name = link.get_text(strip=True)
                        if set_name:
                            full_url = f"{self.base_url}{href}" if not href.startswith('http') else href
                            set_links.append((set_name, full_url))
            
            # Remove duplicates while preserving order
            seen = set()
            unique_links = []
            for item in set_links:
                if item[1] not in seen:
                    seen.add(item[1])
                    unique_links.append(item)
            
            return unique_links[:30]  # Limit to first 30 sets
            
        except Exception as e:
            logger.error(f"Error extracting One Piece set links: {e}")
            return []
    
    def scrape_set(self, set_name: str, set_url: str) -> List[Dict[str, Any]]:
        cards = []
        try:
            html = self.fetch_page(set_url)
            if not html:
                return cards
            
            soup = self.parse_html(html)
            
            # Look for card containers
            card_selectors = [
                ('div', 'card-item'),
                ('div', 'card'),
                ('article', 'card'),
                ('li', 'card-list-item'),
                ('div', 'card-container')
            ]
            
            card_elements = []
            for tag, class_name in card_selectors:
                card_elements = soup.find_all(tag, class_=class_name)
                if card_elements:
                    break
            
            for card_elem in card_elements:
                card_data = self.extract_card_from_element(card_elem, set_name)
                if card_data:
                    cards.append(card_data)
            
            # If no cards found with div, try table format
            if not cards:
                cards = self.extract_cards_from_table(soup, set_name)
            
            return cards
            
        except Exception as e:
            logger.error(f"Error scraping One Piece set {set_name}: {e}")
            return cards
    
    def extract_card_from_element(self, card_elem, set_name: str) -> Dict[str, Any]:
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
                # Try headers and links
                name_elem = card_elem.find(['h3', 'h4', 'h5', 'a'])
                if name_elem:
                    card_name = name_elem.get_text(strip=True)
            
            if not card_name:
                return None
            
            # Extract card number
            number_selectors = ['card-number', 'number', 'id', 'card-id']
            card_number = None
            for selector in number_selectors:
                number_elem = card_elem.find(class_=selector)
                if number_elem:
                    card_number = number_elem.get_text(strip=True)
                    break
            
            # Extract rarity
            rarity_selectors = ['rarity', 'card-rarity', 'rare']
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
            logger.error(f"Error extracting One Piece card from element: {e}")
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
                        # Common format: Number, Name, Color, Type, Cost, Power, Rarity
                        card_number = cells[0].get_text(strip=True) if len(cells) > 0 else None
                        card_name = cells[1].get_text(strip=True) if len(cells) > 1 else None
                        
                        # Rarity might be in different positions (often last or second-to-last)
                        rarity = None
                        if len(cells) > 5:
                            # Try common positions for rarity
                            for idx in [-1, -2, 5, 6]:
                                if 0 <= idx < len(cells):
                                    potential_rarity = cells[idx].get_text(strip=True)
                                    if any(r in potential_rarity.upper() for r in ['C', 'UC', 'R', 'SR', 'SEC', 'L', 'P']):
                                        rarity = potential_rarity
                                        break
                        
                        # Try to find image
                        img_elem = row.find('img')
                        card_image = None
                        if img_elem:
                            card_image = img_elem.get('src') or img_elem.get('data-src')
                            if card_image and not card_image.startswith('http'):
                                if card_image.startswith('//'):
                                    card_image = f"https:{card_image}"
                                else:
                                    card_image = f"{self.base_url}{card_image}"
                        
                        if card_name:
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
            logger.error(f"Error extracting One Piece cards from table: {e}")
            return cards