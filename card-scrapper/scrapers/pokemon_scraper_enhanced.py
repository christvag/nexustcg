from scrapers.base_scraper import BaseScraper
import logging
import re
import json
from typing import List, Dict, Any
from tqdm import tqdm
import time
from datetime import datetime

logger = logging.getLogger(__name__)


class PokemonScraperEnhanced(BaseScraper):
    def __init__(self):
        super().__init__("Pokemon TCG")
        self.base_url = "https://limitlesstcg.com"
        self.cards_url = f"{self.base_url}/cards"
        
    def scrape(self) -> List[Dict[str, Any]]:
        logger.info(f"Starting {self.game_name} scraper (Enhanced Set-by-Set)...")
        all_cards = []
        
        try:
            # Get all sets from the main page with improved extraction
            all_cards = self.scrape_all_sets_enhanced()
            
            logger.info(f"Total Pokemon cards scraped: {len(all_cards)}")
            return all_cards
            
        except Exception as e:
            logger.error(f"Error in Pokemon scraper: {e}")
            return all_cards
    
    def scrape_all_sets_enhanced(self) -> List[Dict[str, Any]]:
        cards = []
        try:
            logger.info("Fetching Pokemon sets with enhanced extraction...")
            
            # Get the main cards page
            html = self.fetch_page(self.cards_url)
            if not html:
                logger.error("Failed to fetch cards page")
                return []
            
            soup = self.parse_html(html)
            
            # Enhanced set extraction
            sets_info = self.extract_sets_with_years(soup)
            
            logger.info(f"Found {len(sets_info)} Pokemon sets with years")
            
            # For demo, limit to first 5 sets. Remove this in production.
            sets_info = sets_info[:5]
            logger.info(f"Demo mode: Processing first {len(sets_info)} sets")
            
            # Process each set with enhanced card extraction
            for set_info in tqdm(sets_info, desc="Scraping Pokemon sets"):
                set_cards = self.scrape_set_enhanced(set_info)
                cards.extend(set_cards)
                time.sleep(1)  # Be respectful to the server
            
            return cards
            
        except Exception as e:
            logger.error(f"Error in enhanced scraping: {e}")
            return cards
    
    def extract_sets_with_years(self, soup) -> List[Dict[str, Any]]:
        """Enhanced extraction of sets with proper year parsing"""
        sets_info = []
        
        try:
            # Look for the data in script tags or JSON
            scripts = soup.find_all('script')
            for script in scripts:
                if script.string and ('sets' in script.string or 'cards' in script.string):
                    try:
                        # Try to extract JSON data
                        json_match = re.search(r'(\{.*"sets".*\})', script.string, re.DOTALL)
                        if json_match:
                            data = json.loads(json_match.group(1))
                            if 'sets' in data:
                                for set_data in data['sets']:
                                    set_info = self.parse_set_from_json(set_data)
                                    if set_info:
                                        sets_info.append(set_info)
                                return sets_info
                    except:
                        continue
            
            # Fallback to HTML parsing
            sets_info = self.extract_sets_from_html(soup)
            return sets_info
            
        except Exception as e:
            logger.error(f"Error extracting sets with years: {e}")
            return []
    
    def parse_set_from_json(self, set_data: Dict) -> Dict[str, Any]:
        """Parse set information from JSON data"""
        try:
            code = set_data.get('code', '')
            name = set_data.get('name', '')
            release_date = set_data.get('release_date', '')
            
            # Extract year from release date
            year = "Unknown"
            if release_date:
                year_match = re.search(r'\b(20\d{2})\b', release_date)
                if year_match:
                    year = year_match.group(1)
            
            return {
                'code': code,
                'name': name,
                'year': year,
                'url': f"{self.base_url}/cards/{code}",
                'cards_count': set_data.get('cards_count', 0)
            }
        except:
            return None
    
    def extract_sets_from_html(self, soup) -> List[Dict[str, Any]]:
        """Fallback HTML extraction with improved year parsing"""
        sets_info = []
        
        try:
            # Look for links to individual sets
            links = soup.find_all('a', href=True)
            
            for link in links:
                href = link.get('href', '')
                if '/cards/' in href and len(href.split('/')) == 3:
                    set_code = href.split('/')[-1]
                    
                    # Skip if not a proper set code
                    if not set_code or len(set_code) > 5:
                        continue
                    
                    # Get set name and year from context
                    set_info = self.extract_set_info_from_link(link, set_code)
                    if set_info:
                        sets_info.append(set_info)
            
            return sets_info[:50]  # Limit to first 50 sets
            
        except Exception as e:
            logger.error(f"Error in HTML extraction: {e}")
            return []
    
    def extract_set_info_from_link(self, link, set_code: str) -> Dict[str, Any]:
        """Extract set info from a link element and its context"""
        try:
            # Get text content around the link
            link_text = link.get_text(strip=True)
            
            # Look in parent elements for more context
            parent = link.parent
            context_text = ""
            
            if parent:
                # Get all text from parent
                all_text = parent.get_text()
                context_text = all_text
            
            # Try to extract year from context
            year = "Unknown"
            year_patterns = [
                r'\b(20\d{2})\b',  # 2024, 2023, etc.
                r"'(\d{2})\b",     # '24, '23, etc.
            ]
            
            for pattern in year_patterns:
                year_match = re.search(pattern, context_text)
                if year_match:
                    year_str = year_match.group(1)
                    if len(year_str) == 2:
                        year = f"20{year_str}"
                    else:
                        year = year_str
                    break
            
            # Try to extract set name
            set_name = link_text if link_text else f"Pokemon Set {set_code}"
            
            return {
                'code': set_code,
                'name': set_name,
                'year': year,
                'url': f"{self.base_url}/cards/{set_code}",
                'cards_count': 0
            }
            
        except Exception as e:
            logger.error(f"Error extracting set info from link: {e}")
            return None
    
    def scrape_set_enhanced(self, set_info: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Enhanced scraping of individual sets"""
        cards = []
        
        try:
            set_code = set_info['code']
            set_name = set_info['name']
            year = set_info['year']
            set_url = set_info['url']
            
            logger.info(f"Scraping set: {set_name} ({set_code}, {year})")
            
            html = self.fetch_page(set_url)
            if not html:
                logger.warning(f"Failed to fetch set page for {set_name}")
                return cards
            
            soup = self.parse_html(html)
            
            # Enhanced card extraction
            cards = self.extract_cards_enhanced(soup, set_name, set_code, year)
            
            logger.info(f"Extracted {len(cards)} cards from {set_name}")
            return cards
            
        except Exception as e:
            logger.error(f"Error scraping set {set_info.get('name', 'Unknown')}: {e}")
            return cards
    
    def extract_cards_enhanced(self, soup, set_name: str, set_code: str, year: str) -> List[Dict[str, Any]]:
        """Enhanced card extraction with better name resolution"""
        cards = []
        
        try:
            # Look for card data in JSON or structured format
            cards_data = self.extract_cards_from_json(soup)
            if cards_data:
                for card_data in cards_data:
                    card = self.format_card_from_json(card_data, set_name, set_code, year)
                    if card:
                        cards.append(card)
                return cards
            
            # Fallback to image-based extraction
            card_images = soup.find_all('img')
            
            for img in card_images:
                src = img.get('src', '')
                if self.is_pokemon_card_image(src):
                    card = self.extract_card_from_image(img, set_name, set_code, year)
                    if card:
                        cards.append(card)
            
            return cards
            
        except Exception as e:
            logger.error(f"Error in enhanced card extraction: {e}")
            return cards
    
    def extract_cards_from_json(self, soup):
        """Try to extract card data from JSON in the page"""
        try:
            scripts = soup.find_all('script')
            for script in scripts:
                if script.string:
                    # Look for card data patterns
                    if 'cards' in script.string and '{' in script.string:
                        # Try to find JSON arrays or objects
                        json_patterns = [
                            r'cards["\']?\s*:\s*(\[.*?\])',
                            r'cardData["\']?\s*:\s*(\[.*?\])',
                            r'(\[.*?"name".*?\])',
                        ]
                        
                        for pattern in json_patterns:
                            match = re.search(pattern, script.string, re.DOTALL)
                            if match:
                                try:
                                    data = json.loads(match.group(1))
                                    if isinstance(data, list) and len(data) > 0:
                                        return data
                                except:
                                    continue
            
            return None
            
        except Exception as e:
            logger.error(f"Error extracting JSON card data: {e}")
            return None
    
    def format_card_from_json(self, card_data: Dict, set_name: str, set_code: str, year: str) -> Dict[str, Any]:
        """Format card from JSON data"""
        try:
            card_name = card_data.get('name', '')
            card_number = str(card_data.get('number', ''))
            rarity = card_data.get('rarity', 'Unknown')
            image_url = card_data.get('image', '')
            
            if not card_name:
                return None
            
            enhanced_set_name = f"{set_name} ({year})" if year != "Unknown" else set_name
            
            return self.format_card_data(
                set_name=enhanced_set_name,
                card_name=self.clean_text(card_name),
                rarity=rarity,
                card_number=card_number.zfill(3) if card_number else None,
                card_image_url=image_url if image_url else None
            )
            
        except Exception as e:
            logger.error(f"Error formatting card from JSON: {e}")
            return None
    
    def is_pokemon_card_image(self, src: str) -> bool:
        """Check if URL is a Pokemon card image"""
        if not src:
            return False
        
        src = src.lower()
        indicators = [
            'limitlesstcg', '_en_', '_r_', '_sm.png', 
            'pokemon', '/cards/', 'digitalocean'
        ]
        
        return any(indicator in src for indicator in indicators)
    
    def extract_card_from_image(self, img, set_name: str, set_code: str, year: str) -> Dict[str, Any]:
        """Extract card information from image element"""
        try:
            src = img.get('src', '')
            alt = img.get('alt', '')
            
            # Extract card number from URL
            card_number = self.extract_card_number_from_url(src)
            
            # Extract rarity from URL
            rarity = self.extract_rarity_from_url(src)
            
            # Try to get card name from alt text or nearby elements
            card_name = alt if alt else f"{set_code} Card #{card_number}"
            
            # Clean up card name
            card_name = self.clean_pokemon_card_name(card_name)
            
            enhanced_set_name = f"{set_name} ({year})" if year != "Unknown" else set_name
            
            return self.format_card_data(
                set_name=enhanced_set_name,
                card_name=self.clean_text(card_name),
                rarity=rarity,
                card_number=card_number,
                card_image_url=src
            )
            
        except Exception as e:
            logger.error(f"Error extracting card from image: {e}")
            return None
    
    def extract_card_number_from_url(self, url: str) -> str:
        """Enhanced card number extraction"""
        if not url:
            return None
        
        # More comprehensive patterns
        patterns = [
            r'_(\d{3})_[A-Z]+_[A-Z]+\.png',  # _001_R_EN.png
            r'/(\d{3})_',  # /001_
            r'_(\d{3})\.',  # _001.
            r'(\d{3})\.png',  # 001.png
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        
        return None
    
    def extract_rarity_from_url(self, url: str) -> str:
        """Enhanced rarity extraction"""
        if not url:
            return "Unknown"
        
        rarity_mapping = {
            '_C_': 'Common',
            '_U_': 'Uncommon', 
            '_R_': 'Rare',
            '_RR_': 'Double Rare',
            '_RRR_': 'Triple Rare',
            '_SR_': 'Secret Rare',
            '_HR_': 'Hyper Rare',
            '_UR_': 'Ultra Rare',
            '_PR_': 'Promo',
            '_AR_': 'Art Rare',
            '_SAR_': 'Special Art Rare',
            '_CHR_': 'Character Rare',
            '_CSR_': 'Character Super Rare'
        }
        
        for pattern, rarity in rarity_mapping.items():
            if pattern in url:
                return rarity
        
        return "Rare"  # Default to Rare for Pokemon cards
    
    def clean_pokemon_card_name(self, name: str) -> str:
        """Clean up Pokemon card names"""
        if not name:
            return name
        
        # Remove common prefixes/suffixes
        name = re.sub(r'^(Card image of|Image of)\s+', '', name, flags=re.IGNORECASE)
        name = re.sub(r'\s+(card|image)$', '', name, flags=re.IGNORECASE)
        
        # Remove set codes from names
        name = re.sub(r'\b[A-Z]{2,4}\b', '', name)
        
        return name.strip()