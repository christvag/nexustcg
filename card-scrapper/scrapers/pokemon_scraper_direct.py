from scrapers.base_scraper import BaseScraper
import logging
import re
from typing import List, Dict, Any
from tqdm import tqdm
import time

logger = logging.getLogger(__name__)


class PokemonScraperDirect(BaseScraper):
    def __init__(self):
        super().__init__("Pokemon TCG")
        self.base_url = "https://limitlesstcg.com"
        self.cards_url = f"{self.base_url}/cards"
        
    def scrape(self) -> List[Dict[str, Any]]:
        logger.info(f"Starting {self.game_name} scraper (Direct Individual Card Access)...")
        all_cards = []
        
        try:
            # Get all sets and process each one by directly accessing individual cards
            all_cards = self.scrape_all_sets_direct()
            
            logger.info(f"Total Pokemon cards scraped: {len(all_cards)}")
            return all_cards
            
        except Exception as e:
            logger.error(f"Error in Pokemon scraper: {e}")
            return all_cards
    
    def scrape_all_sets_direct(self) -> List[Dict[str, Any]]:
        cards = []
        try:
            logger.info("Getting Pokemon sets for direct individual card processing...")
            
            # Get the main cards page to extract set information
            html = self.fetch_page(self.cards_url)
            if not html:
                logger.error("Failed to fetch main cards page")
                return []
            
            soup = self.parse_html(html)
            sets_info = self.extract_sets_with_card_counts(soup)
            
            logger.info(f"Found {len(sets_info)} Pokemon sets")
            
            # For demo, limit to first 2 sets. Remove this in production.
            sets_info = sets_info[:2]
            logger.info(f"Demo mode: Processing first {len(sets_info)} sets with direct card access")
            
            # Process each set by directly accessing individual cards
            for set_info in tqdm(sets_info, desc="Processing Pokemon sets"):
                set_cards = self.scrape_set_direct(set_info)
                cards.extend(set_cards)
                time.sleep(1)  # Be respectful
            
            return cards
            
        except Exception as e:
            logger.error(f"Error in direct set scraping: {e}")
            return cards
    
    def extract_sets_with_card_counts(self, soup) -> List[Dict[str, Any]]:
        """Extract set information including estimated card counts"""
        sets_info = []
        
        try:
            # Look for set links and try to extract card count information
            links = soup.find_all('a', href=True)
            
            for link in links:
                href = link.get('href', '')
                if '/cards/' in href and len(href.split('/')) == 3:
                    set_code = href.split('/')[-1]
                    
                    # Skip if not a proper set code
                    if not set_code or len(set_code) > 5:
                        continue
                    
                    # Get set name and try to extract additional info
                    set_name = link.get_text(strip=True)
                    if not set_name:
                        set_name = f"Pokemon Set {set_code}"
                    
                    # Try to extract year from context
                    year = self.extract_year_from_link_context(link)
                    
                    # Estimate card count (we'll discover actual count during scraping)
                    estimated_count = self.estimate_card_count_for_set(set_code)
                    
                    sets_info.append({
                        'code': set_code,
                        'name': set_name,
                        'year': year,
                        'url': f"{self.base_url}/cards/{set_code}",
                        'estimated_cards': estimated_count
                    })
            
            # Remove duplicates
            seen_codes = set()
            unique_sets = []
            for set_info in sets_info:
                if set_info['code'] not in seen_codes:
                    seen_codes.add(set_info['code'])
                    unique_sets.append(set_info)
            
            return unique_sets[:30]  # Limit to 30 sets for reasonable processing time
            
        except Exception as e:
            logger.error(f"Error extracting sets with card counts: {e}")
            return []
    
    def extract_year_from_link_context(self, link) -> str:
        """Extract year from link context"""
        try:
            # Get surrounding text
            parent = link.parent if link.parent else link
            context_text = parent.get_text()
            
            # Look for year patterns
            year_patterns = [
                r'\b(20\d{2})\b',  # 2024, 2023, etc.
                r"'(\d{2})\b",     # '24, '23, etc.
            ]
            
            for pattern in year_patterns:
                year_match = re.search(pattern, context_text)
                if year_match:
                    year_str = year_match.group(1)
                    if len(year_str) == 2:
                        return f"20{year_str}"
                    else:
                        return year_str
            
            return "Unknown"
            
        except:
            return "Unknown"
    
    def estimate_card_count_for_set(self, set_code: str) -> int:
        """Estimate card count for a set (we'll adjust during scraping)"""
        # Most modern Pokemon sets have 200-300 cards
        # Older sets might have fewer
        return 250  # Conservative estimate
    
    def scrape_set_direct(self, set_info: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Scrape a set by directly accessing individual card URLs"""
        cards = []
        
        try:
            set_code = set_info['code']
            set_name = set_info['name']
            year = set_info['year']
            estimated_count = set_info['estimated_cards']
            
            logger.info(f"Direct scraping of set: {set_name} ({set_code}, {year})")
            logger.info(f"Estimated cards: {estimated_count}, will discover actual count")
            
            # First, try to get the actual card count from the set page
            actual_count = self.get_actual_card_count(set_code)
            if actual_count:
                estimated_count = actual_count
                logger.info(f"Discovered actual card count: {actual_count}")
            
            # Limit to reasonable number for demo
            max_cards_demo = min(50, estimated_count)  # Demo: max 50 cards per set
            logger.info(f"Demo mode: Processing first {max_cards_demo} cards from {set_name}")
            
            # Try to access individual card pages directly
            for card_num in tqdm(range(1, max_cards_demo + 1), desc=f"Scraping {set_name}"):
                card_url = f"{self.base_url}/cards/{set_code}/{card_num}"
                card_data = self.scrape_individual_card_direct(card_url, set_name, set_code, year, card_num)
                
                if card_data:
                    cards.append(card_data)
                elif card_num > 10:  # If we haven't found cards after 10 tries, the set might be smaller
                    # Try some common high numbers for special cards
                    special_numbers = [100, 150, 200, 250, 300]
                    found_special = False
                    for special_num in special_numbers:
                        if special_num > card_num:
                            special_url = f"{self.base_url}/cards/{set_code}/{special_num}"
                            special_card = self.scrape_individual_card_direct(special_url, set_name, set_code, year, special_num)
                            if special_card:
                                cards.append(special_card)
                                found_special = True
                                break
                    
                    if not found_special and len(cards) == 0:
                        # This set might not have cards or uses a different numbering
                        logger.warning(f"No cards found for set {set_code}, might use different numbering")
                        break
                
                time.sleep(0.3)  # Be respectful to the server
            
            logger.info(f"Successfully scraped {len(cards)} cards from {set_name}")
            return cards
            
        except Exception as e:
            logger.error(f"Error in direct set scraping for {set_info.get('name', 'Unknown')}: {e}")
            return cards
    
    def get_actual_card_count(self, set_code: str) -> int:
        """Try to get actual card count from set page"""
        try:
            set_url = f"{self.base_url}/cards/{set_code}"
            html = self.fetch_page(set_url)
            
            if html:
                # Look for card count indicators in the HTML
                card_count_patterns = [
                    r'(\d+)\s+Cards',  # "279 Cards"
                    r'Cards:\s*(\d+)',  # "Cards: 279"
                    r'Total:\s*(\d+)',  # "Total: 279"
                ]
                
                for pattern in card_count_patterns:
                    match = re.search(pattern, html, re.IGNORECASE)
                    if match:
                        return int(match.group(1))
            
            return None
            
        except Exception as e:
            logger.warning(f"Could not determine card count for {set_code}: {e}")
            return None
    
    def scrape_individual_card_direct(self, card_url: str, set_name: str, set_code: str, year: str, card_num: int) -> Dict[str, Any]:
        """Directly scrape an individual card page"""
        try:
            html = self.fetch_page(card_url)
            if not html:
                return None
            
            soup = self.parse_html(html)
            
            # Check if this is a valid card page (not a 404 or empty)
            if self.is_valid_card_page(soup):
                return self.extract_card_details_from_html(soup, set_name, set_code, year, card_num)
            else:
                return None
                
        except Exception as e:
            logger.debug(f"Error scraping card {card_url}: {e}")
            return None
    
    def is_valid_card_page(self, soup) -> bool:
        """Check if this is a valid card page"""
        # Look for indicators that this is a real card page
        indicators = [
            soup.find('h1'),  # Card name as heading
            soup.find(text=re.compile(r'HP')),  # HP indicator
            soup.find(text=re.compile(r'Common|Uncommon|Rare')),  # Rarity
            soup.find('img', src=re.compile(r'limitlesstcg|digitalocean')),  # Card image
        ]
        
        return any(indicators)
    
    def extract_card_details_from_html(self, soup, set_name: str, set_code: str, year: str, card_num: int) -> Dict[str, Any]:
        """Extract card details from HTML soup"""
        try:
            # Extract card name
            card_name = "Unknown"
            name_selectors = [
                'h1', 'h2', 
                {'class': re.compile(r'card.*name', re.I)},
                {'class': re.compile(r'name', re.I)}
            ]
            
            for selector in name_selectors:
                element = soup.find(selector)
                if element and element.get_text(strip=True):
                    card_name = element.get_text(strip=True)
                    # Clean up name (remove set code, numbers, etc.)
                    card_name = re.sub(r'\b' + set_code + r'\b.*$', '', card_name, flags=re.IGNORECASE).strip()
                    card_name = re.sub(r'#\d+.*$', '', card_name).strip()
                    if card_name:
                        break
            
            # Extract rarity
            rarity = "Unknown"
            rarity_text = soup.get_text()
            rarity_patterns = ['Secret Rare', 'Ultra Rare', 'Hyper Rare', 'Double Rare', 'Rare', 'Uncommon', 'Common']
            for pattern in rarity_patterns:
                if pattern in rarity_text:
                    rarity = pattern
                    break
            
            # Extract additional info (type, HP)
            full_text = soup.get_text()
            pokemon_type = self.extract_pokemon_type_from_text(full_text)
            hp = self.extract_hp_from_text(full_text)
            
            # Enhance rarity with additional info
            if pokemon_type and rarity != "Unknown":
                rarity = f"{rarity} | {pokemon_type}"
            if hp:
                rarity = f"{rarity} | HP: {hp}"
            
            # Find card image
            card_image_url = None
            img_elements = soup.find_all('img', src=True)
            for img in img_elements:
                src = img.get('src', '')
                if any(indicator in src.lower() for indicator in ['limitlesstcg', 'digitalocean', 'tpci']):
                    card_image_url = src
                    break
            
            # Format card number
            card_number = f"{card_num:03d}"  # Zero-padded 3 digit number
            
            # Create enhanced set name with year
            enhanced_set_name = f"{set_name} ({year})" if year != "Unknown" else set_name
            
            return self.format_card_data(
                set_name=enhanced_set_name,
                card_name=self.clean_text(card_name),
                rarity=rarity,
                card_number=card_number,
                card_image_url=card_image_url
            )
            
        except Exception as e:
            logger.error(f"Error extracting card details from HTML: {e}")
            return None
    
    def extract_pokemon_type_from_text(self, text: str) -> str:
        """Extract Pokemon type from text"""
        types = ['Grass', 'Fire', 'Water', 'Lightning', 'Psychic', 'Fighting', 'Darkness', 'Metal', 'Fairy', 'Dragon', 'Colorless']
        for pokemon_type in types:
            if pokemon_type in text:
                return pokemon_type
        return None
    
    def extract_hp_from_text(self, text: str) -> str:
        """Extract HP value from text"""
        hp_match = re.search(r'HP:?\s*(\d+)', text)
        if hp_match:
            return hp_match.group(1)
        return None