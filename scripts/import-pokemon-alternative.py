#!/usr/bin/env python3
"""
Alternative import script that can work with either Docker PostgreSQL or local PostgreSQL.
It can also export to SQL file for manual import.
"""

import sqlite3
import sys
from datetime import datetime
import json

# SQLite database path
SQLITE_DB = r"C:\Users\eneat\nexus-tcgrading\card-scrapper\pokemon_cards_complete.db"
OUTPUT_SQL = r"C:\Users\eneat\nexus-tcgrading\gradingsiteproject\database\pokemon_cards_import.sql"

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
    
    print(f"[OK] Fetched {len(rows)} Pokemon cards from SQLite")
    return rows

def escape_sql_string(value):
    """Escape single quotes for SQL"""
    if value is None:
        return 'NULL'
    return "'" + str(value).replace("'", "''") + "'"

def generate_sql_file(cards):
    """Generate SQL file for manual import"""
    with open(OUTPUT_SQL, 'w', encoding='utf-8') as f:
        # Write header
        f.write("-- Pokemon Cards Import Script\n")
        f.write(f"-- Generated: {datetime.now()}\n")
        f.write(f"-- Total cards: {len(cards)}\n\n")
        
        # Create table if not exists
        f.write("""-- Create table structure
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_card_game ON trading_cards(card_game);
CREATE INDEX IF NOT EXISTS idx_card_name ON trading_cards(card_name);
CREATE INDEX IF NOT EXISTS idx_set_name ON trading_cards(set_name);

-- Clear existing Pokemon cards
DELETE FROM trading_cards WHERE card_game = 'Pokemon';

-- Insert Pokemon cards
""")
        
        # Generate INSERT statements
        for i, card in enumerate(cards):
            values = []
            values.append(escape_sql_string(card['card_game'] or 'Pokemon'))
            values.append(escape_sql_string(card['set_name']))
            values.append(escape_sql_string(card['card_name']))
            values.append(escape_sql_string(card['card_number']))
            values.append(escape_sql_string(card['rarity']))
            values.append(escape_sql_string(card['card_type']))
            values.append(str(card['hp']) if card['hp'] is not None else 'NULL')
            values.append(escape_sql_string(card['attacks']))
            values.append(escape_sql_string(card['weakness']))
            values.append(escape_sql_string(card['resistance']))
            values.append(str(card['retreat_cost']) if card['retreat_cost'] is not None else 'NULL')
            values.append(escape_sql_string(card['illustrator']))
            values.append(escape_sql_string(card['print_versions']))
            values.append(escape_sql_string(card['card_image_url']))
            values.append(escape_sql_string(card['source_url']))
            values.append(escape_sql_string(card['created_at'] or datetime.now().isoformat()))
            values.append(escape_sql_string(card['updated_at'] or datetime.now().isoformat()))
            
            insert_stmt = f"INSERT INTO trading_cards (card_game, set_name, card_name, card_number, rarity, card_type, hp, attacks, weakness, resistance, retreat_cost, illustrator, print_versions, card_image_url, source_url, created_at, updated_at) VALUES ({', '.join(values)});\n"
            f.write(insert_stmt)
            
            if (i + 1) % 100 == 0:
                f.write(f"-- Progress: {i + 1}/{len(cards)} cards\n")
        
        # Write footer
        f.write(f"\n-- Import completed: {len(cards)} cards\n")
        f.write("-- Verify import:\n")
        f.write("SELECT COUNT(*) FROM trading_cards WHERE card_game = 'Pokemon';\n")
        f.write("SELECT card_name, set_name, card_number FROM trading_cards WHERE card_game = 'Pokemon' LIMIT 10;\n")
    
    print(f"[OK] SQL file generated: {OUTPUT_SQL}")

def export_to_json(cards):
    """Export cards to JSON for backup"""
    json_file = r"C:\Users\eneat\nexus-tcgrading\gradingsiteproject\database\pokemon_cards_backup.json"
    
    # Convert Row objects to dictionaries
    cards_list = []
    for card in cards:
        card_dict = dict(card)
        # Convert datetime objects to strings
        if card_dict.get('created_at'):
            card_dict['created_at'] = str(card_dict['created_at'])
        if card_dict.get('updated_at'):
            card_dict['updated_at'] = str(card_dict['updated_at'])
        cards_list.append(card_dict)
    
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(cards_list, f, indent=2, ensure_ascii=False)
    
    print(f"[OK] JSON backup created: {json_file}")

def main():
    try:
        print("Pokemon Cards Export Tool")
        print("=" * 50)
        print(f"Source: {SQLITE_DB}\n")
        
        # Fetch data from SQLite
        cards = fetch_sqlite_data()
        
        # Generate SQL file
        generate_sql_file(cards)
        
        # Export to JSON as backup
        export_to_json(cards)
        
        print("\n[SUCCESS] Export completed successfully!")
        print("\nNext steps:")
        print("1. Start Docker Desktop if not running")
        print("2. Run: cd gradingsiteproject && docker-compose up -d postgres")
        print("3. Wait for PostgreSQL to start (about 30 seconds)")
        print("4. Import the SQL file using one of these methods:")
        print("   a. docker exec -i <container_name> psql -U postgres -d tcg_grading < database/pokemon_cards_import.sql")
        print("   b. Use a PostgreSQL client to run the SQL file")
        print("\nThe SQL file is located at:")
        print(f"   {OUTPUT_SQL}")
        
    except sqlite3.Error as e:
        print(f"[ERROR] SQLite error: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"[ERROR] Unexpected error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()