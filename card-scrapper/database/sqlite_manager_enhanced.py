import sqlite3
import os
import json
from typing import Optional, Dict, List, Any
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SQLiteManagerEnhanced:
    def __init__(self, db_path: str = "trading_cards_enhanced.db"):
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
            CREATE TABLE IF NOT EXISTS trading_cards_enhanced (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                card_game VARCHAR(50) NOT NULL,
                set_name VARCHAR(255) NOT NULL,
                card_name VARCHAR(255) NOT NULL,
                card_number VARCHAR(50),
                rarity VARCHAR(100),
                card_type VARCHAR(100),
                hp INTEGER,
                attacks TEXT,  -- JSON string for attack data
                weakness VARCHAR(100),
                resistance VARCHAR(100),
                retreat_cost INTEGER,
                illustrator VARCHAR(255),
                print_versions TEXT,  -- JSON string for print versions
                card_image_url TEXT,
                source_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(card_game, set_name, card_number)
            );

            CREATE INDEX IF NOT EXISTS idx_card_game ON trading_cards_enhanced(card_game);
            CREATE INDEX IF NOT EXISTS idx_set_name ON trading_cards_enhanced(set_name);
            CREATE INDEX IF NOT EXISTS idx_card_name ON trading_cards_enhanced(card_name);
            CREATE INDEX IF NOT EXISTS idx_card_number ON trading_cards_enhanced(card_number);
            CREATE INDEX IF NOT EXISTS idx_rarity ON trading_cards_enhanced(rarity);
            CREATE INDEX IF NOT EXISTS idx_card_type ON trading_cards_enhanced(card_type);
            """
            
            self.cursor.executescript(schema_sql)
            self.connection.commit()
            logger.info("Enhanced SQLite database tables created successfully")
            return True
        except Exception as e:
            logger.error(f"Error creating tables: {e}")
            return False
    
    def insert_card(self, card_data: Dict[str, Any]) -> bool:
        try:
            insert_query = """
                INSERT OR REPLACE INTO trading_cards_enhanced (
                    card_game, set_name, card_name, card_number,
                    rarity, card_type, hp, attacks, weakness,
                    resistance, retreat_cost, illustrator, print_versions,
                    card_image_url, source_url, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            """
            
            # Convert complex data to JSON strings
            attacks_json = json.dumps(card_data.get('attacks', [])) if card_data.get('attacks') else None
            print_versions_json = json.dumps(card_data.get('print_versions', [])) if card_data.get('print_versions') else None
            
            self.cursor.execute(insert_query, (
                card_data.get('card_game'),
                card_data.get('set_name'),
                card_data.get('card_name'),
                card_data.get('card_number'),
                card_data.get('rarity'),
                card_data.get('card_type'),
                card_data.get('hp'),
                attacks_json,
                card_data.get('weakness'),
                card_data.get('resistance'),
                card_data.get('retreat_cost'),
                card_data.get('illustrator'),
                print_versions_json,
                card_data.get('card_image_url'),
                card_data.get('source_url')
            ))
            
            self.connection.commit()
            return True
            
        except Exception as e:
            logger.error(f"Error inserting card: {e}")
            logger.error(f"Card data: {card_data}")
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
                query = "SELECT COUNT(*) as count FROM trading_cards_enhanced WHERE card_game = ?"
                self.cursor.execute(query, (card_game,))
            else:
                query = "SELECT COUNT(*) as count FROM trading_cards_enhanced"
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
                    SELECT 1 FROM trading_cards_enhanced 
                    WHERE card_game = ? AND set_name = ? AND card_number = ?
                )
            """
            self.cursor.execute(query, (card_game, set_name, card_number))
            result = self.cursor.fetchone()
            return bool(result[0]) if result else False
            
        except Exception as e:
            logger.error(f"Error checking if card exists: {e}")
            return False
    
    def get_cards_by_set(self, card_game: str, set_name: str) -> List[Dict]:
        try:
            query = """
                SELECT * FROM trading_cards_enhanced 
                WHERE card_game = ? AND set_name = ?
                ORDER BY CAST(card_number AS INTEGER)
            """
            self.cursor.execute(query, (card_game, set_name))
            rows = self.cursor.fetchall()
            
            # Convert rows to dictionaries and parse JSON fields
            cards = []
            for row in rows:
                card = dict(row)
                # Parse JSON fields back to Python objects
                if card['attacks']:
                    try:
                        card['attacks'] = json.loads(card['attacks'])
                    except:
                        card['attacks'] = []
                        
                if card['print_versions']:
                    try:
                        card['print_versions'] = json.loads(card['print_versions'])
                    except:
                        card['print_versions'] = []
                        
                cards.append(card)
            
            return cards
            
        except Exception as e:
            logger.error(f"Error getting cards by set: {e}")
            return []
    
    def get_all_sets(self, card_game: str) -> List[str]:
        try:
            query = """
                SELECT DISTINCT set_name FROM trading_cards_enhanced 
                WHERE card_game = ?
                ORDER BY set_name
            """
            self.cursor.execute(query, (card_game,))
            rows = self.cursor.fetchall()
            return [row['set_name'] for row in rows]
            
        except Exception as e:
            logger.error(f"Error getting all sets: {e}")
            return []
    
    def export_to_json(self, output_file: str, card_game: Optional[str] = None):
        try:
            if card_game:
                query = "SELECT * FROM trading_cards_enhanced WHERE card_game = ?"
                self.cursor.execute(query, (card_game,))
            else:
                query = "SELECT * FROM trading_cards_enhanced"
                self.cursor.execute(query)
            
            rows = self.cursor.fetchall()
            cards = []
            
            for row in rows:
                card = dict(row)
                # Parse JSON fields
                if card['attacks']:
                    try:
                        card['attacks'] = json.loads(card['attacks'])
                    except:
                        card['attacks'] = []
                        
                if card['print_versions']:
                    try:
                        card['print_versions'] = json.loads(card['print_versions'])
                    except:
                        card['print_versions'] = []
                        
                cards.append(card)
            
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(cards, f, indent=2, ensure_ascii=False, default=str)
            
            logger.info(f"Exported {len(cards)} cards to {output_file}")
            return True
            
        except Exception as e:
            logger.error(f"Error exporting to JSON: {e}")
            return False