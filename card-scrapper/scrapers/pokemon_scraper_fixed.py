from scrapers.base_scraper import BaseScraper
import logging
import re
from typing import List, Dict, Any
from tqdm import tqdm
import time

logger = logging.getLogger(__name__)


class PokemonScraperFixed(BaseScraper):
    def __init__(self):
        super().__init__("Pokemon TCG")
        self.base_url = "https://limitlesstcg.com"
        self.cards_url = f"{self.base_url}/cards"
        
    def scrape(self) -> List[Dict[str, Any]]:
        logger.info(f"Starting {self.game_name} scraper (Fixed)...")
        all_cards = []
        
        try:
            # Get all sets from the main page
            all_cards = self.scrape_all_sets()
            
            logger.info(f"Total Pokemon cards scraped: {len(all_cards)}")
            return all_cards
            
        except Exception as e:
            logger.error(f"Error in Pokemon scraper: {e}")
            return all_cards
    
    def scrape_all_sets(self) -> List[Dict[str, Any]]:
        cards = []
        try:
            logger.info("Fetching Pokemon sets...")
            
            # Get the main cards page
            html = self.fetch_page(self.cards_url)
            if not html:
                logger.error("Failed to fetch cards page")
                return []
            
            soup = self.parse_html(html)
            
            # Extract sets information
            sets_info = self.extract_sets_info(soup)
            
            logger.info(f"Found {len(sets_info)} Pokemon sets")
            
            # Process all sets for complete database scraping
            logger.info(f"Production mode: Processing all {len(sets_info)} sets for complete database")
            
            # Process each set
            for set_info in tqdm(sets_info, desc="Scraping Pokemon sets"):
                set_cards = self.scrape_individual_set(set_info)
                cards.extend(set_cards)
                time.sleep(1)  # Be respectful to the server
            
            return cards
            
        except Exception as e:
            logger.error(f"Error scraping all sets: {e}")
            return cards
    
    def extract_sets_info(self, soup) -> List[Dict[str, Any]]:
        """Extract set information from main page"""
        sets_info = []
        
        try:
            # Look for links to individual sets
            links = soup.find_all('a', href=True)
            
            for link in links:
                href = link.get('href', '')
                if '/cards/' in href and len(href.split('/')) == 3:
                    set_code = href.split('/')[-1]
                    
                    # Skip if not a proper set code (should be 2-4 uppercase letters)
                    if not set_code or not set_code.isupper() or len(set_code) > 5:
                        continue
                    
                    # Get set name and try to extract year from surrounding context
                    set_name, year = self.extract_set_name_and_year(link)
                    
                    sets_info.append({
                        'code': set_code,
                        'name': set_name or f"Pokemon Set {set_code}",
                        'year': year,
                        'url': f"{self.base_url}{href}"
                    })
            
            # Remove duplicates
            seen_codes = set()
            unique_sets = []
            for set_info in sets_info:
                if set_info['code'] not in seen_codes:
                    seen_codes.add(set_info['code'])
                    unique_sets.append(set_info)
            
            return unique_sets  # Process all sets for complete database
            
        except Exception as e:
            logger.error(f"Error extracting sets info: {e}")
            return []
    
    def extract_set_name_and_year(self, link) -> tuple:
        """Extract set name and year from link context"""
        try:
            # Try to get text from the link itself
            link_text = link.get_text(strip=True)
            
            # Get context from parent elements
            context_text = ""
            parent = link.parent
            if parent:
                context_text = parent.get_text()
            
            # Extract year from context using various patterns
            year = "Unknown"
            year_patterns = [
                r'\b(20\d{2})\b',  # 2024, 2023, etc.
                r"'(\d{2})\b",     # '24, '23, etc.
                r'\b(\d{2})/\d{2}/(\d{2,4})\b'  # date format
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
            
            return link_text, year
            
        except Exception as e:
            logger.error(f"Error extracting set name and year: {e}")
            return "", "Unknown"
    
    def scrape_individual_set(self, set_info: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Scrape all cards from an individual set"""
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
            
            # Find all Pokemon card images
            card_images = self.find_pokemon_card_images(soup, set_code)
            
            for img in card_images:
                card_data = self.extract_card_from_image(img, set_name, set_code, year)
                if card_data:
                    cards.append(card_data)
            
            logger.info(f"Extracted {len(cards)} cards from {set_name}")
            return cards
            
        except Exception as e:
            logger.error(f"Error scraping set {set_info.get('name', 'Unknown')}: {e}")
            return cards
    
    def find_pokemon_card_images(self, soup, set_code: str):
        """Find all Pokemon card images on the page"""
        card_images = []
        
        # Look for images with Pokemon card patterns
        all_images = soup.find_all('img', src=True)
        
        for img in all_images:
            src = img.get('src', '')
            if self.is_pokemon_card_image(src, set_code):
                card_images.append(img)
        
        return card_images
    
    def is_pokemon_card_image(self, src: str, set_code: str) -> bool:
        """Check if image source is a Pokemon card from this set"""
        if not src:
            return False
        
        src_lower = src.lower()
        set_code_lower = set_code.lower()
        
        # Check for Pokemon card indicators
        indicators = [
            f'{set_code_lower}_',  # Set code in URL
            'limitlesstcg',
            'digitalocean',
            '_en_',
            '_sm.png'
        ]
        
        # Must have set code and at least one other indicator
        has_set_code = f'{set_code_lower}_' in src_lower
        has_indicator = any(indicator in src_lower for indicator in indicators[1:])
        
        return has_set_code and has_indicator
    
    def extract_card_from_image(self, img, set_name: str, set_code: str, year: str) -> Dict[str, Any]:
        """Extract card information from image element"""
        try:
            src = img.get('src', '')
            alt = img.get('alt', '')
            
            # Extract card number from URL using fixed regex
            card_number = self.extract_card_number_fixed(src, set_code)
            
            # Extract rarity from URL
            rarity = self.extract_rarity_from_url(src)
            
            # Try to get card name from alt text
            card_name = self.clean_card_name(alt) if alt else f"Pokemon Card #{card_number}"
            
            # Create enhanced set name with year
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
    
    def extract_card_number_fixed(self, url: str, set_code: str) -> str:
        """Fixed card number extraction"""
        if not url:
            return None
        
        # Pattern for: BLK_001_R_EN_SM.png
        pattern = rf'{set_code}_(\d{{3}})_'
        match = re.search(pattern, url, re.IGNORECASE)
        
        if match:
            return match.group(1)
        
        # Fallback patterns
        fallback_patterns = [
            r'_(\d{3})_[A-Z]+_[A-Z]+\.png',  # _001_R_EN.png
            r'/(\d{3})_',  # /001_
            r'_(\d{3})\.',  # _001.
        ]
        
        for pattern in fallback_patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        
        return None
    
    def extract_rarity_from_url(self, url: str) -> str:
        """Extract rarity from URL"""
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
            '_SAR_': 'Special Art Rare'
        }
        
        for pattern, rarity in rarity_mapping.items():
            if pattern in url:
                return rarity
        
        return "Rare"  # Default rarity
    
    def clean_card_name(self, name: str) -> str:
        """Clean up card names"""
        if not name:
            return name
        
        # Remove common prefixes/suffixes
        name = re.sub(r'^(Card image of|Image of)\s+', '', name, flags=re.IGNORECASE)
        name = re.sub(r'\s+(card|image)$', '', name, flags=re.IGNORECASE)
        
        return name.strip()