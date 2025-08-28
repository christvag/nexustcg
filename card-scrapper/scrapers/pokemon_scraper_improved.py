from scrapers.base_scraper import BaseScraper
import logging
import json
import re
from typing import List, Dict, Any
from tqdm import tqdm
from urllib.parse import urljoin

logger = logging.getLogger(__name__)


class PokemonScraperImproved(BaseScraper):
    def __init__(self):
        super().__init__("Pokemon TCG")
        self.base_url = "https://limitlesstcg.com"
        self.cards_url = f"{self.base_url}/cards"
        
    def scrape(self) -> List[Dict[str, Any]]:
        logger.info(f"Starting improved {self.game_name} scraper...")
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
            logger.error(f"Error in improved Pokemon scraper: {e}")
            return all_cards
    
    def extract_set_links(self, soup) -> List[tuple]:
        """Extract set links from the main cards page"""
        set_links = []
        try:
            # Look for links that go to card sets
            links = soup.find_all('a', href=True)
            for link in links:
                href = link.get('href', '')
                # Match pattern like /cards/SET_CODE
                if re.match(r'^/cards/[A-Z0-9]+$', href):
                    set_name = link.get_text(strip=True)
                    if set_name:
                        full_url = f"{self.base_url}{href}"
                        set_links.append((set_name, full_url))
            
            # Remove duplicates while preserving order
            seen = set()
            unique_links = []
            for item in set_links:
                if item[1] not in seen:
                    seen.add(item[1])
                    unique_links.append(item)
            
            return unique_links[:20]  # Limit to first 20 sets for testing
            
        except Exception as e:
            logger.error(f"Error extracting set links: {e}")
            return []
    
    def scrape_set(self, set_name: str, set_url: str) -> List[Dict[str, Any]]:
        """Scrape all cards from a specific set"""
        cards = []
        try:
            html = self.fetch_page(set_url)
            if not html:
                return cards
            
            soup = self.parse_html(html)
            
            # Find individual card links in the set
            card_links = self.extract_card_links(soup, set_url)
            logger.info(f"Found {len(card_links)} cards in {set_name}")
            
            # Scrape each individual card
            for card_number, card_url in tqdm(card_links, desc=f"Scraping {set_name} cards", leave=False):
                card_data = self.scrape_individual_card(card_url, set_name, card_number)
                if card_data:
                    cards.append(card_data)
            
            return cards
            
        except Exception as e:
            logger.error(f"Error scraping set {set_name}: {e}")
            return cards
    
    def extract_card_links(self, soup, set_url: str) -> List[tuple]:
        """Extract individual card links from a set page"""
        card_links = []
        try:
            # Look for links that go to individual cards (pattern: /cards/SET/NUMBER)
            links = soup.find_all('a', href=True)
            set_code = set_url.split('/')[-1]  # Extract set code from URL
            
            for link in links:
                href = link.get('href', '')
                # Match pattern like /cards/BLK/1, /cards/BLK/2, etc.
                if re.match(rf'^/cards/{set_code}/\d+$', href):
                    card_number = href.split('/')[-1]
                    full_url = f"{self.base_url}{href}"
                    card_links.append((card_number, full_url))
            
            # Sort by card number
            card_links.sort(key=lambda x: int(x[0]))
            
            return card_links
            
        except Exception as e:
            logger.error(f"Error extracting card links: {e}")
            return []
    
    def scrape_individual_card(self, card_url: str, set_name: str, card_number: str) -> Dict[str, Any]:
        """Scrape detailed information from an individual card page"""
        try:
            html = self.fetch_page(card_url)
            if not html:
                return None
            
            soup = self.parse_html(html)
            
            # Extract card name - try multiple selectors
            card_name = self.extract_card_name(soup)
            if not card_name:
                logger.warning(f"Could not extract card name from {card_url}")
                return None
            
            # Extract print versions
            print_versions = self.extract_print_versions(soup)
            
            # Extract rarity
            rarity = self.extract_rarity(soup)
            
            # Extract additional card data
            card_type = self.extract_card_type(soup)
            hp = self.extract_hp(soup)
            attacks = self.extract_attacks(soup)
            weakness = self.extract_weakness(soup)
            resistance = self.extract_resistance(soup)
            retreat_cost = self.extract_retreat_cost(soup)
            illustrator = self.extract_illustrator(soup)
            
            # Extract card image
            card_image_url = self.extract_card_image(soup)
            
            card_data = {
                'card_game': self.game_name,
                'set_name': self.clean_text(set_name),
                'card_name': self.clean_text(card_name),
                'card_number': card_number,
                'rarity': self.clean_text(rarity) if rarity else None,
                'card_type': self.clean_text(card_type) if card_type else None,
                'hp': hp,
                'attacks': attacks,
                'weakness': self.clean_text(weakness) if weakness else None,
                'resistance': self.clean_text(resistance) if resistance else None,
                'retreat_cost': retreat_cost,
                'illustrator': self.clean_text(illustrator) if illustrator else None,
                'print_versions': print_versions,
                'card_image_url': card_image_url.strip() if card_image_url else None,
                'source_url': card_url
            }
            
            if self.validate_card_data_enhanced(card_data):
                return card_data
            return None
            
        except Exception as e:
            logger.error(f"Error scraping individual card {card_url}: {e}")
            return None
    
    def extract_card_name(self, soup) -> str:
        """Extract card name using multiple possible selectors"""
        # Try the specific selector mentioned by user first
        selectors = [
            'h1',
            '.card-title',
            '.card-text-title',
            'section.card-page-main .card-profile .card-details .card-details-main .card-text p.card-text-title span',
            '.card-name',
            'h2'
        ]
        
        for selector in selectors:
            try:
                element = soup.select_one(selector)
                if element:
                    text = element.get_text(strip=True)
                    if text and len(text) > 1:  # Ensure it's not just a single character
                        # Clean up the card name - remove extra type/HP info if it's all in one element
                        # Split on common delimiters and take the first part as the card name
                        name_parts = text.split('-')
                        if len(name_parts) > 1:
                            return name_parts[0].strip()
                        return text
            except:
                continue
        
        return None
    
    def extract_print_versions(self, soup) -> List[str]:
        """Extract print versions from the card-print-version table"""
        versions = []
        try:
            # Look for print version sections
            print_sections = soup.find_all(['div', 'section'], class_=['card-prints', 'int-prints', 'jp-prints'])
            
            for section in print_sections:
                # Look for tables with print information
                tables = section.find_all('table')
                for table in tables:
                    rows = table.find_all('tr')
                    for row in rows:
                        cells = row.find_all(['td', 'th'])
                        if cells:
                            version_text = ' '.join([cell.get_text(strip=True) for cell in cells])
                            if version_text and version_text not in versions:
                                versions.append(version_text)
                
                # Also check for direct text content
                version_links = section.find_all('a')
                for link in version_links:
                    version_text = link.get_text(strip=True)
                    if version_text and version_text not in versions:
                        versions.append(version_text)
        
        except Exception as e:
            logger.error(f"Error extracting print versions: {e}")
        
        return versions
    
    def extract_rarity(self, soup) -> str:
        """Extract card rarity"""
        try:
            # Look for rarity information in various locations
            rarity_selectors = [
                '.rarity',
                '.card-rarity',
                'section.card-page-main .card-prints',
            ]
            
            for selector in rarity_selectors:
                element = soup.select_one(selector)
                if element:
                    text = element.get_text(strip=True)
                    # Look for common rarity terms
                    rarity_terms = ['Common', 'Uncommon', 'Rare', 'Ultra Rare', 'Secret Rare', 'Holo Rare']
                    for term in rarity_terms:
                        if term.lower() in text.lower():
                            return term
            
            # Try to find rarity in the overall text
            page_text = soup.get_text()
            rarity_terms = ['Common', 'Uncommon', 'Rare', 'Ultra Rare', 'Secret Rare', 'Holo Rare']
            for term in rarity_terms:
                if term in page_text:
                    return term
                    
        except Exception as e:
            logger.error(f"Error extracting rarity: {e}")
        
        return None
    
    def extract_card_type(self, soup) -> str:
        """Extract Pokemon type and category (Basic, Stage 1, etc.)"""
        try:
            # Look for type information
            type_text = soup.get_text()
            
            # Pokemon types
            types = ['Grass', 'Fire', 'Water', 'Lightning', 'Psychic', 'Fighting', 'Darkness', 'Metal', 'Fairy', 'Dragon', 'Colorless']
            for poke_type in types:
                if poke_type in type_text:
                    # Also check for stage
                    if 'Basic' in type_text:
                        return f"{poke_type} (Basic)"
                    elif 'Stage 1' in type_text:
                        return f"{poke_type} (Stage 1)"
                    elif 'Stage 2' in type_text:
                        return f"{poke_type} (Stage 2)"
                    else:
                        return poke_type
        except Exception as e:
            logger.error(f"Error extracting card type: {e}")
        
        return None
    
    def extract_hp(self, soup) -> int:
        """Extract Pokemon HP"""
        try:
            text = soup.get_text()
            # Look for HP pattern like "HP 70" or "70 HP"
            import re
            hp_match = re.search(r'HP\s*(\d+)|(\d+)\s*HP', text)
            if hp_match:
                return int(hp_match.group(1) or hp_match.group(2))
        except Exception as e:
            logger.error(f"Error extracting HP: {e}")
        
        return None
    
    def extract_attacks(self, soup) -> List[Dict[str, Any]]:
        """Extract attack information"""
        attacks = []
        try:
            text = soup.get_text()
            # This is a simplified extraction - would need more sophisticated parsing for full attack details
            # Look for common attack patterns
            lines = text.split('\n')
            for line in lines:
                if any(keyword in line.lower() for keyword in ['damage', 'attack', 'tackle', 'whip']):
                    if re.search(r'\d+', line):  # Contains numbers (likely damage)
                        attacks.append({'name': line.strip(), 'details': line.strip()})
        except Exception as e:
            logger.error(f"Error extracting attacks: {e}")
        
        return attacks
    
    def extract_weakness(self, soup) -> str:
        """Extract weakness information"""
        try:
            text = soup.get_text()
            if 'Weakness:' in text:
                # Extract text after "Weakness:"
                weakness_start = text.find('Weakness:') + len('Weakness:')
                weakness_text = text[weakness_start:weakness_start+50].split('\n')[0].strip()
                return weakness_text
        except Exception as e:
            logger.error(f"Error extracting weakness: {e}")
        
        return None
    
    def extract_resistance(self, soup) -> str:
        """Extract resistance information"""
        try:
            text = soup.get_text()
            if 'Resistance:' in text:
                resistance_start = text.find('Resistance:') + len('Resistance:')
                resistance_text = text[resistance_start:resistance_start+50].split('\n')[0].strip()
                return resistance_text
        except Exception as e:
            logger.error(f"Error extracting resistance: {e}")
        
        return None
    
    def extract_retreat_cost(self, soup) -> int:
        """Extract retreat cost"""
        try:
            text = soup.get_text()
            if 'Retreat Cost:' in text:
                retreat_start = text.find('Retreat Cost:') + len('Retreat Cost:')
                retreat_text = text[retreat_start:retreat_start+20]
                # Look for numbers
                import re
                cost_match = re.search(r'(\d+)', retreat_text)
                if cost_match:
                    return int(cost_match.group(1))
        except Exception as e:
            logger.error(f"Error extracting retreat cost: {e}")
        
        return None
    
    def extract_illustrator(self, soup) -> str:
        """Extract illustrator information"""
        try:
            text = soup.get_text()
            if 'Illustrator:' in text:
                illus_start = text.find('Illustrator:') + len('Illustrator:')
                illustrator = text[illus_start:illus_start+100].split('\n')[0].strip()
                return illustrator
        except Exception as e:
            logger.error(f"Error extracting illustrator: {e}")
        
        return None
    
    def extract_card_image(self, soup) -> str:
        """Extract card image URL"""
        try:
            # Look for card images
            img_tags = soup.find_all('img')
            for img in img_tags:
                src = img.get('src', '')
                if src and ('card' in src.lower() or 'pokemon' in src.lower()):
                    if not src.startswith('http'):
                        src = urljoin(self.base_url, src)
                    return src
        except Exception as e:
            logger.error(f"Error extracting card image: {e}")
        
        return None
    
    def validate_card_data_enhanced(self, card: Dict[str, Any]) -> bool:
        """Enhanced validation for card data"""
        required_fields = ['card_game', 'set_name', 'card_name', 'card_number']
        for field in required_fields:
            if not card.get(field):
                logger.warning(f"Missing required field {field} in card data")
                return False
        return True