#!/usr/bin/env python3

"""
Database Consolidation Script
Consolidates all test databases into one final comprehensive database
"""

from database.sqlite_manager import SQLiteManager
import logging
import os
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

def check_database(db_path):
    """Check database contents and return card counts by game"""
    if not os.path.exists(db_path):
        return None
    
    try:
        db = SQLiteManager(db_path)
        if not db.connect():
            return None
        
        # Get total cards
        db.cursor.execute("SELECT COUNT(*) FROM trading_cards")
        total_cards = db.cursor.fetchone()[0]
        
        # Get cards by game
        db.cursor.execute("SELECT card_game, COUNT(*) as count FROM trading_cards GROUP BY card_game ORDER BY count DESC")
        games_data = db.cursor.fetchall()
        
        db.disconnect()
        
        return {
            'total_cards': total_cards,
            'games': {row['card_game']: row['count'] for row in games_data}
        }
        
    except Exception as e:
        logger.error(f"Error checking {db_path}: {e}")
        return None

def main():
    start_time = datetime.now()
    logger.info("=" * 60)
    logger.info("DATABASE CONSOLIDATION - FINAL UNIFIED DATABASE")
    logger.info("=" * 60)
    
    # List of databases to check
    databases = [
        'trading_cards.db',
        'yugioh_complete.db', 
        'yugioh_cards.db',
        'mtg_complete.db',
        'pokemon_complete.db',
        'pokemon_direct.db', 
        'pokemon_enhanced.db',
        'pokemon_fixed.db',
        'pokemon_full.db',
        'test_cards.db'
    ]
    
    logger.info("Analyzing existing databases...")
    
    # Check each database
    db_analysis = {}
    total_unique_cards = 0
    
    for db_name in databases:
        if os.path.exists(db_name):
            logger.info(f"\nChecking {db_name}...")
            analysis = check_database(db_name)
            if analysis:
                db_analysis[db_name] = analysis
                logger.info(f"  Total cards: {analysis['total_cards']:,}")
                for game, count in analysis['games'].items():
                    logger.info(f"    {game}: {count:,} cards")
            else:
                logger.warning(f"  Could not analyze {db_name}")
        else:
            logger.info(f"  {db_name} - Not found")
    
    # Determine best source databases
    logger.info("\n" + "=" * 60)
    logger.info("SELECTING BEST SOURCE DATABASES")
    logger.info("=" * 60)
    
    best_sources = {}
    
    # Find best Pokemon database
    pokemon_dbs = {name: data for name, data in db_analysis.items() if any('Pokemon' in str(games) for games in data['games'].keys())}
    if pokemon_dbs:
        best_pokemon = max(pokemon_dbs.items(), key=lambda x: x[1]['games'].get('Pokemon TCG', 0))
        best_sources['Pokemon TCG'] = best_pokemon[0]
        logger.info(f"Best Pokemon database: {best_pokemon[0]} ({best_pokemon[1]['games'].get('Pokemon TCG', 0):,} cards)")
    
    # Find best YuGiOh database  
    yugioh_dbs = {name: data for name, data in db_analysis.items() if any('Yu-Gi-Oh' in str(games) for games in data['games'].keys())}
    if yugioh_dbs:
        best_yugioh = max(yugioh_dbs.items(), key=lambda x: x[1]['games'].get('Yu-Gi-Oh', 0))
        best_sources['Yu-Gi-Oh'] = best_yugioh[0]
        logger.info(f"Best YuGiOh database: {best_yugioh[0]} ({best_yugioh[1]['games'].get('Yu-Gi-Oh', 0):,} cards)")
    
    # Find best MTG database
    mtg_dbs = {name: data for name, data in db_analysis.items() if any('Magic' in str(games) for games in data['games'].keys())}
    if mtg_dbs:
        best_mtg = max(mtg_dbs.items(), key=lambda x: x[1]['games'].get('Magic The Gathering', 0))
        best_sources['Magic The Gathering'] = best_mtg[0]
        logger.info(f"Best MTG database: {best_mtg[0]} ({best_mtg[1]['games'].get('Magic The Gathering', 0):,} cards)")
    
    # Create final consolidated database
    logger.info("\n" + "=" * 60)
    logger.info("CREATING FINAL CONSOLIDATED DATABASE")
    logger.info("=" * 60)
    
    final_db_name = "FINAL_TRADING_CARDS_DATABASE.db"
    
    # Remove existing final database if it exists
    if os.path.exists(final_db_name):
        os.remove(final_db_name)
        logger.info(f"Removed existing {final_db_name}")
    
    # Initialize final database
    final_db = SQLiteManager(final_db_name)
    if not final_db.connect():
        logger.error("Failed to create final database")
        return
    
    if not final_db.create_tables():
        logger.error("Failed to create tables in final database")
        return
    
    logger.info(f"Created final database: {final_db_name}")
    
    # Consolidate data from best sources
    total_final_cards = 0
    
    for game_name, source_db in best_sources.items():
        logger.info(f"\nConsolidating {game_name} from {source_db}...")
        
        # Connect to source database
        source = SQLiteManager(source_db)
        if not source.connect():
            logger.error(f"Failed to connect to {source_db}")
            continue
        
        # Get all cards for this game
        source.cursor.execute("SELECT * FROM trading_cards WHERE card_game = ?", (game_name,))
        cards = source.cursor.fetchall()
        
        # Convert to list of dictionaries
        card_list = []
        for card in cards:
            card_list.append({
                'card_game': card['card_game'],
                'set_name': card['set_name'],
                'card_name': card['card_name'],
                'rarity': card['rarity'],
                'card_number': card['card_number'],
                'card_image_url': card['card_image_url']
            })
        
        # Bulk insert into final database
        inserted = final_db.bulk_insert_cards(card_list)
        total_final_cards += inserted
        
        logger.info(f"  Inserted {inserted:,} {game_name} cards")
        
        source.disconnect()
    
    # Get final statistics
    logger.info("\n" + "=" * 60)
    logger.info("FINAL DATABASE STATISTICS")
    logger.info("=" * 60)
    
    final_db.cursor.execute("SELECT card_game, COUNT(*) as count FROM trading_cards GROUP BY card_game ORDER BY count DESC")
    final_games = final_db.cursor.fetchall()
    
    logger.info(f"Final database: {final_db_name}")
    logger.info(f"Total cards: {total_final_cards:,}")
    logger.info("Cards by game:")
    for row in final_games:
        logger.info(f"  {row['card_game']}: {row['count']:,} cards")
    
    # Get set statistics
    logger.info("\nTop 10 sets by card count:")
    final_db.cursor.execute("SELECT set_name, card_game, COUNT(*) as count FROM trading_cards GROUP BY set_name, card_game ORDER BY count DESC LIMIT 10")
    top_sets = final_db.cursor.fetchall()
    for row in top_sets:
        logger.info(f"  {row['set_name']} ({row['card_game']}): {row['count']} cards")
    
    final_db.disconnect()
    
    # Clean up old databases
    logger.info("\n" + "=" * 60)
    logger.info("CLEANING UP OLD DATABASES")
    logger.info("=" * 60)
    
    cleanup_dbs = [db for db in databases if db != final_db_name and os.path.exists(db)]
    
    logger.info(f"Moving {len(cleanup_dbs)} old databases to 'old_databases/' folder...")
    
    # Create old_databases directory
    old_db_dir = "old_databases"
    if not os.path.exists(old_db_dir):
        os.makedirs(old_db_dir)
    
    # Move old databases
    for db_name in cleanup_dbs:
        old_path = db_name
        new_path = os.path.join(old_db_dir, db_name)
        try:
            os.rename(old_path, new_path)
            logger.info(f"  Moved {db_name} to {new_path}")
        except Exception as e:
            logger.error(f"  Failed to move {db_name}: {e}")
    
    # Summary
    duration = datetime.now() - start_time
    logger.info("\n" + "=" * 60)
    logger.info("DATABASE CONSOLIDATION COMPLETED")
    logger.info("=" * 60)
    logger.info(f"Duration: {duration}")
    logger.info(f"Final database: {final_db_name}")
    logger.info(f"Total cards consolidated: {total_final_cards:,}")
    logger.info(f"Old databases moved to: {old_db_dir}/")
    logger.info("=" * 60)

if __name__ == "__main__":
    main()