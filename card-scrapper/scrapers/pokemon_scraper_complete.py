from scrapers.base_scraper import BaseScraper
import logging
import re
from typing import List, Dict, Any
from tqdm import tqdm
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service

logger = logging.getLogger(__name__)


class PokemonScraperComplete(BaseScraper):
    def __init__(self):
        super().__init__("Pokemon TCG")
        self.base_url = "https://limitlesstcg.com"
        self.cards_url = f"{self.base_url}/cards"
        self.driver = None
        
    def setup_driver(self):
        """Setup Chrome webdriver with options"""
        try:
            chrome_options = Options()
            chrome_options.add_argument("--headless")  # Run in background
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--disable-gpu")
            chrome_options.add_argument("--window-size=1920,1080")
            
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
            self.driver.implicitly_wait(10)
            
            logger.info("Chrome WebDriver setup successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to setup WebDriver: {e}")
            return False
    
    def cleanup_driver(self):
        """Clean up the webdriver"""
        if self.driver:
            self.driver.quit()
            self.driver = None
    
    def scrape(self) -> List[Dict[str, Any]]:
        logger.info(f"Starting {self.game_name} scraper (Complete Individual Card Processing)...")
        all_cards = []
        
        try:
            # Setup selenium driver
            if not self.setup_driver():
                logger.error("Failed to setup WebDriver, falling back to basic scraping")
                return self.scrape_fallback()
            
            # Get all sets and process each one completely
            all_cards = self.scrape_all_sets_complete()
            
            logger.info(f"Total Pokemon cards scraped: {len(all_cards)}")
            return all_cards
            
        except Exception as e:
            logger.error(f"Error in Pokemon scraper: {e}")
            return all_cards
        finally:
            self.cleanup_driver()
    
    def scrape_all_sets_complete(self) -> List[Dict[str, Any]]:
        cards = []
        try:
            logger.info("Fetching all Pokemon sets for complete processing...")
            
            # Get the main cards page
            self.driver.get(self.cards_url)
            time.sleep(2)
            
            # Extract all set links
            set_links = self.extract_all_set_links()
            
            logger.info(f"Found {len(set_links)} Pokemon sets")
            
            # For demo, limit to first 2 sets. Remove this in production.
            set_links = set_links[:2]
            logger.info(f"Demo mode: Processing first {len(set_links)} sets completely")
            
            # Process each set completely
            for set_info in tqdm(set_links, desc="Processing Pokemon sets"):
                set_cards = self.scrape_complete_set(set_info)
                cards.extend(set_cards)
                time.sleep(1)  # Be respectful
            
            return cards
            
        except Exception as e:
            logger.error(f"Error in complete set scraping: {e}")
            return cards
    
    def extract_all_set_links(self) -> List[Dict[str, Any]]:
        """Extract all set information from the main page"""
        sets_info = []
        
        try:
            # Look for all links to individual sets
            set_links = self.driver.find_elements(By.XPATH, "//a[contains(@href, '/cards/') and string-length(substring-after(@href, '/cards/')) <= 5]")
            
            for link in set_links:
                try:
                    href = link.get_attribute('href')
                    if not href or '/cards/' not in href:
                        continue
                    
                    set_code = href.split('/cards/')[-1]
                    if not set_code or len(set_code) > 5:
                        continue
                    
                    # Get set name from link text or nearby elements
                    set_name = link.text.strip()
                    if not set_name:
                        set_name = f"Pokemon Set {set_code}"
                    
                    # Try to extract year from nearby text
                    year = self.extract_year_from_context(link)
                    
                    sets_info.append({
                        'code': set_code,
                        'name': set_name,
                        'year': year,
                        'url': href
                    })
                    
                except Exception as e:
                    logger.warning(f"Error processing set link: {e}")
                    continue
            
            # Remove duplicates
            seen_codes = set()
            unique_sets = []
            for set_info in sets_info:
                if set_info['code'] not in seen_codes:
                    seen_codes.add(set_info['code'])
                    unique_sets.append(set_info)
            
            return unique_sets
            
        except Exception as e:
            logger.error(f"Error extracting set links: {e}")
            return []
    
    def extract_year_from_context(self, link_element) -> str:
        """Extract year from element context"""
        try:
            # Get parent element and search for year patterns
            parent = link_element.find_element(By.XPATH, "./..")
            context_text = parent.text
            
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
    
    def scrape_complete_set(self, set_info: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Completely scrape a set by visiting each individual card page"""
        cards = []
        
        try:
            set_code = set_info['code']
            set_name = set_info['name']
            year = set_info['year']
            set_url = set_info['url']
            
            logger.info(f"Complete scraping of set: {set_name} ({set_code}, {year})")
            
            # Navigate to the set page
            self.driver.get(set_url)
            time.sleep(2)
            
            # Find all individual card links
            card_links = self.get_all_card_links_in_set(set_code)
            
            logger.info(f"Found {len(card_links)} individual cards in {set_name}")
            
            # Visit each individual card page
            for card_url in tqdm(card_links, desc=f"Scraping {set_name} cards"):
                card_data = self.scrape_individual_card_page(card_url, set_name, set_code, year)
                if card_data:
                    cards.append(card_data)
                time.sleep(0.5)  # Be respectful to the server
            
            logger.info(f"Successfully scraped {len(cards)} cards from {set_name}")
            return cards
            
        except Exception as e:
            logger.error(f"Error in complete set scraping for {set_info.get('name', 'Unknown')}: {e}")
            return cards
    
    def get_all_card_links_in_set(self, set_code: str) -> List[str]:
        """Get all individual card page links from a set page"""
        card_links = []
        
        try:
            # Look for clickable card images or links
            card_elements = self.driver.find_elements(By.XPATH, f"//a[contains(@href, '/cards/{set_code}/')]")
            
            for element in card_elements:
                try:
                    href = element.get_attribute('href')
                    if href and f'/cards/{set_code}/' in href:
                        card_links.append(href)
                except:
                    continue
            
            # Remove duplicates while preserving order
            unique_links = []
            seen = set()
            for link in card_links:
                if link not in seen:
                    seen.add(link)
                    unique_links.append(link)
            
            return unique_links
            
        except Exception as e:
            logger.error(f"Error getting card links for set {set_code}: {e}")
            return []
    
    def scrape_individual_card_page(self, card_url: str, set_name: str, set_code: str, year: str) -> Dict[str, Any]:
        """Scrape detailed information from an individual card page"""
        try:
            # Navigate to the individual card page
            self.driver.get(card_url)
            time.sleep(1)
            
            # Extract card information from the detailed page
            card_info = self.extract_card_details_from_page(set_name, set_code, year)
            
            return card_info
            
        except Exception as e:
            logger.error(f"Error scraping individual card page {card_url}: {e}")
            return None
    
    def extract_card_details_from_page(self, set_name: str, set_code: str, year: str) -> Dict[str, Any]:
        """Extract detailed card information from the current page"""
        try:
            # Extract card name
            card_name = "Unknown"
            try:
                name_element = self.driver.find_element(By.XPATH, "//h1 | //h2 | //*[contains(@class, 'card-name')] | //*[contains(@class, 'name')]")
                card_name = name_element.text.strip()
            except:
                # Try alternative selectors
                try:
                    name_element = self.driver.find_element(By.XPATH, "//*[contains(text(), '#')]")
                    text = name_element.text
                    # Extract name before the #
                    if '#' in text:
                        card_name = text.split('#')[0].strip()
                except:
                    pass
            
            # Extract card number
            card_number = None
            try:
                # Look for text containing #
                number_elements = self.driver.find_elements(By.XPATH, "//*[contains(text(), '#')]")
                for element in number_elements:
                    text = element.text
                    number_match = re.search(r'#(\d+)', text)
                    if number_match:
                        card_number = number_match.group(1).zfill(3)
                        break
            except:
                pass
            
            # Extract rarity
            rarity = "Unknown"
            try:
                # Look for rarity indicators
                rarity_elements = self.driver.find_elements(By.XPATH, "//*[contains(text(), 'Common') or contains(text(), 'Uncommon') or contains(text(), 'Rare') or contains(text(), 'Secret')]")
                for element in rarity_elements:
                    text = element.text.strip()
                    if any(r in text for r in ['Common', 'Uncommon', 'Rare', 'Secret', 'Ultra', 'Hyper']):
                        rarity = text
                        break
            except:
                pass
            
            # Extract card image URL
            card_image_url = None
            try:
                img_element = self.driver.find_element(By.XPATH, "//img[contains(@src, 'limitlesstcg') or contains(@src, 'digitalocean')]")
                card_image_url = img_element.get_attribute('src')
            except:
                pass
            
            # Extract additional details like type, HP, etc.
            card_type = self.extract_card_type()
            hp = self.extract_hp()
            
            # Enhance rarity with additional info
            if card_type and rarity != "Unknown":
                rarity = f"{rarity} | {card_type}"
            if hp:
                rarity = f"{rarity} | HP: {hp}"
            
            # Create enhanced set name with year
            enhanced_set_name = f"{set_name} ({year})" if year != "Unknown" else set_name
            
            # Only return if we have essential information
            if card_name == "Unknown" and not card_number:
                return None
            
            return self.format_card_data(
                set_name=enhanced_set_name,
                card_name=self.clean_text(card_name),
                rarity=rarity,
                card_number=card_number,
                card_image_url=card_image_url
            )
            
        except Exception as e:
            logger.error(f"Error extracting card details: {e}")
            return None
    
    def extract_card_type(self) -> str:
        """Extract Pokemon card type (Grass, Fire, etc.)"""
        try:
            type_elements = self.driver.find_elements(By.XPATH, "//*[contains(text(), 'Grass') or contains(text(), 'Fire') or contains(text(), 'Water') or contains(text(), 'Lightning') or contains(text(), 'Psychic') or contains(text(), 'Fighting') or contains(text(), 'Darkness') or contains(text(), 'Metal') or contains(text(), 'Fairy') or contains(text(), 'Dragon') or contains(text(), 'Colorless')]")
            for element in type_elements:
                text = element.text.strip()
                types = ['Grass', 'Fire', 'Water', 'Lightning', 'Psychic', 'Fighting', 'Darkness', 'Metal', 'Fairy', 'Dragon', 'Colorless']
                for pokemon_type in types:
                    if pokemon_type in text:
                        return pokemon_type
            return None
        except:
            return None
    
    def extract_hp(self) -> str:
        """Extract Pokemon HP value"""
        try:
            hp_elements = self.driver.find_elements(By.XPATH, "//*[contains(text(), 'HP')]")
            for element in hp_elements:
                text = element.text
                hp_match = re.search(r'HP:?\s*(\d+)', text)
                if hp_match:
                    return hp_match.group(1)
            return None
        except:
            return None
    
    def scrape_fallback(self) -> List[Dict[str, Any]]:
        """Fallback scraping method without Selenium"""
        logger.info("Using fallback scraping method...")
        # Implement basic scraping as fallback
        return []