import sqlite3
import os
from typing import Optional, Dict, List, Any
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SQLiteManager:
    def __init__(self, db_path: str = "trading_cards.db"):
        self.db_path = db_path
        self.connection = None
        self.cursor = None
        
    def connect(self):
        try:
            self.connection = sqlite3.connect(self.db_path)
            self.connection.row_factory = sqlite3.Row  # Enable dict-like access
            self.cursor = self.connection.cursor()
            logger.info(f"Successfully connected to SQLite database: {self.db_path}")
            return True
        except Exception as e:
            logger.error(f"Error connecting to SQLite database: {e}")
            return False
    
    def disconnect(self):
        if self.cursor:
            self.cursor.close()
        if self.connection:
            self.connection.close()
        logger.info("Disconnected from SQLite database")
    
    def create_tables(self):
        try:
            schema_sql = """
            CREATE TABLE IF NOT EXISTS trading_cards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                card_game VARCHAR(50) NOT NULL,
                set_name VARCHAR(255) NOT NULL,
                card_name VARCHAR(255) NOT NULL,
                rarity VARCHAR(100),
                card_number VARCHAR(50),
                card_image_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(card_game, set_name, card_number)
            );

            CREATE INDEX IF NOT EXISTS idx_card_game ON trading_cards(card_game);
            CREATE INDEX IF NOT EXISTS idx_set_name ON trading_cards(set_name);
            CREATE INDEX IF NOT EXISTS idx_card_name ON trading_cards(card_name);
            CREATE INDEX IF NOT EXISTS idx_card_number ON trading_cards(card_number);
            CREATE INDEX IF NOT EXISTS idx_rarity ON trading_cards(rarity);
            """
            
            self.cursor.executescript(schema_sql)
            self.connection.commit()
            logger.info("SQLite database tables created successfully")
            return True
        except Exception as e:
            logger.error(f"Error creating tables: {e}")
            return False
    
    def insert_card(self, card_data: Dict[str, Any]) -> bool:
        try:
            insert_query = """
                INSERT OR REPLACE INTO trading_cards (
                    card_game, set_name, card_name, 
                    rarity, card_number, card_image_url,
                    updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
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
                query = "SELECT COUNT(*) as count FROM trading_cards WHERE card_game = ?"
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
                    WHERE card_game = ? AND set_name = ? AND card_number = ?
                )
            """
            self.cursor.execute(query, (card_game, set_name, card_number))
            result = self.cursor.fetchone()
            return bool(result[0]) if result else False
            
        except Exception as e:
            logger.error(f"Error checking if card exists: {e}")
            return False