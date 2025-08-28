#!/usr/bin/env python3
"""
Fix Pokemon cards in FINAL_TRADING_CARDS_DATABASE.db by removing incorrect ones
and importing correct data from pokemon_cards_complete.db
"""

import sqlite3
import sys
from datetime import datetime

# Database paths
FINAL_DB = r"C:\Users\eneat\nexus-tcgrading\gradingsiteproject\database\FINAL_TRADING_CARDS_DATABASE.db"
POKEMON_DB = r"C:\Users\eneat\nexus-tcgrading\gradingsiteproject\database\pokemon_cards_complete.db"

def backup_database():
    """Create a backup of the FINAL database before making changes"""
    import shutil
    backup_path = FINAL_DB + '.backup.' + datetime.now().strftime('%Y%m%d_%H%M%S')
    shutil.copy2(FINAL_DB, backup_path)
    print(f"[BACKUP] Created backup: {backup_path}")
    return backup_path

def delete_incorrect_pokemon(conn):
    """Delete all incorrect Pokemon cards from FINAL database"""
    cursor = conn.cursor()
    
    # Count Pokemon cards before deletion
    cursor.execute('SELECT COUNT(*) FROM trading_cards WHERE card_game LIKE "%Pokemon%"')
    before_count = cursor.fetchone()[0]
    print(f"[DELETE] Found {before_count} Pokemon cards to delete")
    
    # Delete all Pokemon cards
    cursor.execute('DELETE FROM trading_cards WHERE card_game LIKE "%Pokemon%"')
    deleted_count = cursor.rowcount
    
    conn.commit()
    print(f"[DELETE] Deleted {deleted_count} incorrect Pokemon cards")
    
    return deleted_count

def fetch_correct_pokemon_data():
    """Fetch correct Pokemon data from pokemon_cards_complete.db"""
    conn = sqlite3.connect(POKEMON_DB)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT 
            card_game,
            set_name,
            card_name,
            card_number,
            rarity,
            card_image_url,
            created_at,
            updated_at
        FROM trading_cards_enhanced
        ORDER BY set_name, CAST(card_number AS INTEGER), card_name
    """)
    
    rows = cursor.fetchall()
    conn.close()
    
    print(f"[FETCH] Retrieved {len(rows)} correct Pokemon cards")
    return rows

def insert_correct_pokemon(conn, pokemon_cards):
    """Insert correct Pokemon cards into FINAL database"""
    cursor = conn.cursor()
    
    # Prepare insert query (matching FINAL_TRADING_CARDS_DATABASE structure)
    insert_query = """
        INSERT INTO trading_cards (
            card_game, set_name, card_name, rarity, card_number,
            card_image_url, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """
    
    # Convert data to match FINAL database structure
    data_tuples = []
    for card in pokemon_cards:
        data_tuples.append((
            'Pokemon',  # Standardize game name
            card['set_name'],
            card['card_name'],
            card['rarity'],
            card['card_number'],
            card['card_image_url'],
            card['created_at'] or datetime.now().isoformat(),
            card['updated_at'] or datetime.now().isoformat()
        ))
    
    # Batch insert
    cursor.executemany(insert_query, data_tuples)
    conn.commit()
    
    inserted_count = cursor.rowcount
    print(f"[INSERT] Inserted {inserted_count} correct Pokemon cards")
    
    return inserted_count

def verify_migration(conn):
    """Verify the migration was successful"""
    cursor = conn.cursor()
    
    # Count Pokemon cards
    cursor.execute('SELECT COUNT(*) FROM trading_cards WHERE card_game = "Pokemon"')
    total_count = cursor.fetchone()[0]
    
    # Check sample data
    cursor.execute("""
        SELECT card_name, set_name, card_number 
        FROM trading_cards 
        WHERE card_game = "Pokemon" 
        ORDER BY set_name, CAST(card_number AS INTEGER)
        LIMIT 10
    """)
    samples = cursor.fetchall()
    
    print(f"[VERIFY] Total Pokemon cards: {total_count}")
    print("[VERIFY] Sample correct cards:")
    for card in samples:
        print(f"  - {card[0]} from {card[1]} #{card[2]}")
    
    # Check for any remaining incorrect cards
    cursor.execute('SELECT COUNT(*) FROM trading_cards WHERE card_name LIKE "Pokemon Card #%"')
    incorrect_remaining = cursor.fetchone()[0]
    
    if incorrect_remaining > 0:
        print(f"[WARNING] {incorrect_remaining} incorrect cards still remain!")
        return False
    else:
        print("[VERIFY] No incorrect Pokemon cards found - migration successful!")
        return True

def main():
    try:
        print("Pokemon Cards Migration Tool")
        print("=" * 50)
        print(f"Source: {POKEMON_DB}")
        print(f"Target: {FINAL_DB}\n")
        
        # Create backup
        backup_path = backup_database()
        
        # Connect to FINAL database
        conn = sqlite3.connect(FINAL_DB)
        
        # Step 1: Delete incorrect Pokemon cards
        deleted_count = delete_incorrect_pokemon(conn)
        
        # Step 2: Fetch correct Pokemon data
        pokemon_cards = fetch_correct_pokemon_data()
        
        # Step 3: Insert correct Pokemon cards
        inserted_count = insert_correct_pokemon(conn, pokemon_cards)
        
        # Step 4: Verify migration
        success = verify_migration(conn)
        
        # Close connection
        conn.close()
        
        print(f"\n[SUCCESS] Migration completed!")
        print(f"  - Deleted: {deleted_count} incorrect cards")
        print(f"  - Inserted: {inserted_count} correct cards")
        print(f"  - Backup: {backup_path}")
        
        if not success:
            print(f"\n[WARNING] Migration may have issues - check the verification output above")
            sys.exit(1)
        
    except sqlite3.Error as e:
        print(f"[ERROR] SQLite error: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"[ERROR] Unexpected error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()