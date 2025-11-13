#!/usr/bin/env python3
"""
Import Pokemon cards from SQLite database to PostgreSQL
"""

import sqlite3
import psycopg2
from psycopg2.extras import execute_batch
import sys
from datetime import datetime

# SQLite database path
SQLITE_DB = r"C:\Users\eneat\nexus-tcgrading\card-scrapper\pokemon_cards_complete.db"

# PostgreSQL connection parameters
PG_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'tcg_grading',
    'user': 'postgres',
    'password': 'password'
}

def create_postgres_table(pg_conn):
    """Create the trading_cards table in PostgreSQL if it doesn't exist"""
    with pg_conn.cursor() as cursor:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS trading_cards (
                id SERIAL PRIMARY KEY,
                card_game VARCHAR(50),
                set_name VARCHAR(255),
                card_name VARCHAR(255),
                card_number VARCHAR(50),
                rarity VARCHAR(100),
                card_type VARCHAR(100),
                hp INTEGER,
                attacks TEXT,
                weakness VARCHAR(100),
                resistance VARCHAR(100),
                retreat_cost INTEGER,
                illustrator VARCHAR(255),
                print_versions TEXT,
                card_image_url TEXT,
                source_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # Create indexes for better query performance
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_card_game ON trading_cards(card_game);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_card_name ON trading_cards(card_name);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_set_name ON trading_cards(set_name);")
        
        pg_conn.commit()
        print("✓ PostgreSQL table structure created/verified")

def fetch_sqlite_data():
    """Fetch all Pokemon cards from SQLite database"""
    sqlite_conn = sqlite3.connect(SQLITE_DB)
    sqlite_conn.row_factory = sqlite3.Row
    cursor = sqlite_conn.cursor()
    
    cursor.execute("""
        SELECT 
            card_game,
            set_name,
            card_name,
            card_number,
            rarity,
            card_type,
            hp,
            attacks,
            weakness,
            resistance,
            retreat_cost,
            illustrator,
            print_versions,
            card_image_url,
            source_url,
            created_at,
            updated_at
        FROM trading_cards_enhanced
    """)
    
    rows = cursor.fetchall()
    sqlite_conn.close()
    
    print(f"✓ Fetched {len(rows)} Pokemon cards from SQLite")
    return rows

def import_to_postgres(pg_conn, cards):
    """Import cards to PostgreSQL database"""
    with pg_conn.cursor() as cursor:
        # First, clear existing Pokemon cards if any
        cursor.execute("DELETE FROM trading_cards WHERE card_game = 'Pokemon';")
        deleted_count = cursor.rowcount
        if deleted_count > 0:
            print(f"✓ Cleared {deleted_count} existing Pokemon cards from PostgreSQL")
        
        # Prepare insert query
        insert_query = """
            INSERT INTO trading_cards (
                card_game, set_name, card_name, card_number, rarity,
                card_type, hp, attacks, weakness, resistance,
                retreat_cost, illustrator, print_versions,
                card_image_url, source_url, created_at, updated_at
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s
            )
        """
        
        # Convert SQLite rows to tuples for PostgreSQL
        data_tuples = []
        for card in cards:
            data_tuples.append((
                card['card_game'] or 'Pokemon',
                card['set_name'],
                card['card_name'],
                card['card_number'],
                card['rarity'],
                card['card_type'],
                card['hp'],
                card['attacks'],
                card['weakness'],
                card['resistance'],
                card['retreat_cost'],
                card['illustrator'],
                card['print_versions'],
                card['card_image_url'],
                card['source_url'],
                card['created_at'] or datetime.now(),
                card['updated_at'] or datetime.now()
            ))
        
        # Batch insert for better performance
        execute_batch(cursor, insert_query, data_tuples, page_size=100)
        pg_conn.commit()
        
        # Verify import
        cursor.execute("SELECT COUNT(*) FROM trading_cards WHERE card_game = 'Pokemon';")
        count = cursor.fetchone()[0]
        print(f"✓ Successfully imported {count} Pokemon cards to PostgreSQL")
        
        # Show sample data
        cursor.execute("""
            SELECT card_name, set_name, card_number 
            FROM trading_cards 
            WHERE card_game = 'Pokemon' 
            LIMIT 5;
        """)
        print("\n✓ Sample imported cards:")
        for row in cursor.fetchall():
            print(f"  - {row[0]} from {row[1]} #{row[2]}")

def main():
    try:
        print("Starting Pokemon cards import from SQLite to PostgreSQL...")
        print(f"Source: {SQLITE_DB}")
        print(f"Target: PostgreSQL ({PG_CONFIG['host']}:{PG_CONFIG['port']}/{PG_CONFIG['database']})\n")
        
        # Connect to PostgreSQL
        print("Connecting to PostgreSQL...")
        pg_conn = psycopg2.connect(**PG_CONFIG)
        print("✓ Connected to PostgreSQL")
        
        # Create table structure
        create_postgres_table(pg_conn)
        
        # Fetch data from SQLite
        cards = fetch_sqlite_data()
        
        # Import to PostgreSQL
        import_to_postgres(pg_conn, cards)
        
        # Close connection
        pg_conn.close()
        
        print("\n✅ Import completed successfully!")
        
    except sqlite3.Error as e:
        print(f"❌ SQLite error: {e}", file=sys.stderr)
        sys.exit(1)
    except psycopg2.Error as e:
        print(f"❌ PostgreSQL error: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()