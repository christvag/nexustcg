import requests
from bs4 import BeautifulSoup
import time
import logging
from typing import List, Dict, Any, Optional
from tenacity import retry, stop_after_attempt, wait_exponential
import cloudscraper

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class BaseScraper:
    def __init__(self, game_name: str):
        self.game_name = game_name
        self.session = cloudscraper.create_scraper()
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }
        self.cards_data = []
        
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    def fetch_page(self, url: str, use_cloudscraper: bool = True) -> Optional[str]:
        try:
            time.sleep(1)  # Be polite to servers
            
            if use_cloudscraper:
                response = self.session.get(url, headers=self.headers)
            else:
                response = requests.get(url, headers=self.headers, timeout=30)
            
            response.raise_for_status()
            return response.text
            
        except Exception as e:
            logger.error(f"Error fetching {url}: {e}")
            return None
    
    def parse_html(self, html: str) -> BeautifulSoup:
        return BeautifulSoup(html, 'lxml')
    
    def extract_card_data(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        raise NotImplementedError("Each scraper must implement extract_card_data method")
    
    def scrape(self) -> List[Dict[str, Any]]:
        raise NotImplementedError("Each scraper must implement scrape method")
    
    def validate_card_data(self, card: Dict[str, Any]) -> bool:
        required_fields = ['card_game', 'set_name', 'card_name', 'card_number']
        for field in required_fields:
            if not card.get(field):
                logger.warning(f"Missing required field {field} in card data: {card}")
                return False
        return True
    
    def clean_text(self, text: Optional[str]) -> str:
        if not text:
            return ""
        return text.strip().replace('\n', ' ').replace('\t', ' ').replace('  ', ' ')
    
    def format_card_data(self, 
                        set_name: str,
                        card_name: str,
                        rarity: Optional[str],
                        card_number: Optional[str],
                        card_image_url: Optional[str]) -> Dict[str, Any]:
        
        card_data = {
            'card_game': self.game_name,
            'set_name': self.clean_text(set_name),
            'card_name': self.clean_text(card_name),
            'rarity': self.clean_text(rarity) if rarity else None,
            'card_number': self.clean_text(card_number) if card_number else None,
            'card_image_url': card_image_url.strip() if card_image_url else None
        }
        
        if self.validate_card_data(card_data):
            return card_data
        return None