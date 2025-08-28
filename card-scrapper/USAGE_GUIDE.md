# Trading Card Scraper - Usage Guide

## Quick Start (SQLite - No Setup Required)

Since PostgreSQL installation can be complex, use the SQLite version for immediate usage:

### 1. Run the scraper:
```bash
# Scrape all games (may take a long time)
python main_sqlite.py

# Scrape specific games (recommended)
python main_sqlite.py --games mtg yugioh

# Available games: pokemon, yugioh, mtg, lorcana, onepiece
```

### 2. Check your database:
```bash
python check_db.py
```

## What You Get

The scraper creates a SQLite database file `trading_cards.db` with all scraped cards containing:

- **Card Game**: Pokemon TCG, YuGiOh, Magic The Gathering, Disney Lorcana, One Piece TCG
- **Set Name**: The expansion/set the card belongs to
- **Card Name**: Full card name
- **Rarity**: Card rarity (Common, Rare, Mythic, etc.)
- **Card Number**: Collector/card number
- **Card Image URL**: Direct link to card image

## Example Results

After running `python main_sqlite.py --games mtg`, you'll see:

```
Total cards in database: 526

Cards by game:
  Magic The Gathering: 526 cards

Sample cards:
  Avatar Aang // Aang, Master of Elements | Avatar: The Last Airbender | Mythic | #363
  Yue, the Moon Spirit | Avatar: The Last Airbender | Rare | #338
  Anti-Venom, Horrifying Healer | Marvel's Spider-Man | Mythic | #1
```

## Performance Notes

- **MTG**: Uses official Scryfall API (fast, reliable)
- **YuGiOh**: Uses YGOProDeck API (fast when available)
- **Pokemon/Lorcana/One Piece**: Web scraping (slower, rate-limited)

## For PostgreSQL Users

If you have PostgreSQL installed:

1. Create database: `CREATE DATABASE trading_cards_db;`
2. Update `.env` file with your credentials
3. Run: `python main.py --games mtg`

## Database Schema

```sql
CREATE TABLE trading_cards (
    id INTEGER PRIMARY KEY,
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
```

## Next Steps

1. **Integrate with your grading site**: Connect to the SQLite database
2. **Query cards**: Use SQL to search by game, set, name, etc.
3. **Scale up**: Run full scraping for complete database
4. **Schedule updates**: Set up periodic scraping for new cards

The system is production-ready and designed for a card grading reference database!