import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv
from typing import Optional, Dict, List, Any
import logging

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DatabaseManager:
    def __init__(self):
        self.connection = None
        self.cursor = None
        
    def connect(self):
        try:
            self.connection = psycopg2.connect(
                host=os.getenv('DB_HOST', 'localhost'),
                port=os.getenv('DB_PORT', '5432'),
                database=os.getenv('DB_NAME', 'trading_cards_db'),
                user=os.getenv('DB_USER', 'postgres'),
                password=os.getenv('DB_PASSWORD', '')
            )
            self.cursor = self.connection.cursor(cursor_factory=RealDictCursor)
            logger.info("Successfully connected to PostgreSQL database")
            return True
        except Exception as e:
            logger.error(f"Error connecting to database: {e}")
            return False
    
    def disconnect(self):
        if self.cursor:
            self.cursor.close()
        if self.connection:
            self.connection.close()
        logger.info("Disconnected from database")
    
    def create_tables(self):
        try:
            with open('database/schema.sql', 'r') as f:
                schema_sql = f.read()
            self.cursor.execute(schema_sql)
            self.connection.commit()
            logger.info("Database tables created successfully")
            return True
        except Exception as e:
            logger.error(f"Error creating tables: {e}")
            self.connection.rollback()
            return False
    
    def insert_card(self, card_data: Dict[str, Any]) -> bool:
        try:
            insert_query = """
                INSERT INTO trading_cards (
                    card_game, set_name, card_name, 
                    rarity, card_number, card_image_url
                ) VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (card_game, set_name, card_number) 
                DO UPDATE SET
                    card_name = EXCLUDED.card_name,
                    rarity = EXCLUDED.rarity,
                    card_image_url = EXCLUDED.card_image_url,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING id;
            """
            
            self.cursor.execute(insert_query, (
                card_data.get('card_game'),
                card_data.get('set_name'),
                card_data.get('card_name'),
                card_data.get('rarity'),
                card_data.get('card_number'),
                card_data.get('card_image_url')
            ))
            
            self.connection.commit()
            return True
            
        except Exception as e:
            logger.error(f"Error inserting card: {e}")
            self.connection.rollback()
            return False
    
    def bulk_insert_cards(self, cards_data: List[Dict[str, Any]]) -> int:
        inserted_count = 0
        for card in cards_data:
            if self.insert_card(card):
                inserted_count += 1
        
        logger.info(f"Inserted/Updated {inserted_count} cards")
        return inserted_count
    
    def get_card_count(self, card_game: Optional[str] = None) -> int:
        try:
            if card_game:
                query = "SELECT COUNT(*) as count FROM trading_cards WHERE card_game = %s"
                self.cursor.execute(query, (card_game,))
            else:
                query = "SELECT COUNT(*) as count FROM trading_cards"
                self.cursor.execute(query)
            
            result = self.cursor.fetchone()
            return result['count'] if result else 0
            
        except Exception as e:
            logger.error(f"Error getting card count: {e}")
            return 0
    
    def card_exists(self, card_game: str, set_name: str, card_number: str) -> bool:
        try:
            query = """
                SELECT EXISTS(
                    SELECT 1 FROM trading_cards 
                    WHERE card_game = %s AND set_name = %s AND card_number = %s
                )
            """
            self.cursor.execute(query, (card_game, set_name, card_number))
            result = self.cursor.fetchone()
            return result['exists'] if result else False
            
        except Exception as e:
            logger.error(f"Error checking if card exists: {e}")
            return False