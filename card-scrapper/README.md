# Trading Card Game Scraper

A comprehensive Python-based web scraping system that collects trading card information from multiple popular TCG websites and stores them in a PostgreSQL database. This system serves as a reference database for trading card game grading sites.

## Supported Trading Card Games

1. **Pokémon TCG** - Data from limitlesstcg.com
2. **YuGiOh** - Data from ygoprodeck.com (using their API)
3. **Magic The Gathering** - Data from scryfall.com (using their API)
4. **Disney Lorcana** - Data from lorcania.com
5. **One Piece TCG** - Data from onepiece.limitlesstcg.com

## Features

- **Comprehensive Data Collection**: Scrapes card game, set name, card name, rarity/printing, card number, and card image URLs
- **Duplicate Prevention**: Ensures unique cards in the database using composite keys
- **Robust Error Handling**: Implements retry logic and graceful error recovery
- **Rate Limiting**: Respects server resources with configurable delays
- **API Integration**: Uses official APIs where available for better reliability
- **Modular Architecture**: Easy to extend with new card games
- **Detailed Logging**: Comprehensive logging for monitoring and debugging

## Installation

### Prerequisites

- Python 3.8 or higher
- PostgreSQL 12 or higher
- pip package manager

### Setup Steps

1. **Clone the repository**:
```bash
git clone <repository-url>
cd card-scrapper
```

2. **Create a virtual environment**:
```bash
python -m venv venv

# On Windows
venv\Scripts\activate

# On Unix/MacOS
source venv/bin/activate
```

3. **Install dependencies**:
```bash
pip install -r requirements.txt
```

4. **Set up PostgreSQL database**:
```sql
CREATE DATABASE trading_cards_db;
```

5. **Configure environment variables**:
```bash
cp .env.example .env
# Edit .env file with your database credentials
```

6. **Initialize the database**:
```bash
# The database tables will be created automatically when you run the scraper
```

## Usage

### Run all scrapers:
```bash
python main.py
```

### Run specific game scrapers:
```bash
python main.py --games pokemon yugioh
```

### Available games:
- `pokemon` - Pokémon TCG
- `yugioh` - YuGiOh
- `mtg` - Magic The Gathering
- `lorcana` - Disney Lorcana
- `onepiece` - One Piece TCG

### Test mode (limited scraping):
```bash
python main.py --test
```

## Database Schema

The system uses a single unified table for all trading cards:

```sql
trading_cards
├── id (SERIAL PRIMARY KEY)
├── card_game (VARCHAR(50))
├── set_name (VARCHAR(255))
├── card_name (VARCHAR(255))
├── rarity (VARCHAR(100))
├── card_number (VARCHAR(50))
├── card_image_url (TEXT)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

**Unique constraint**: (card_game, set_name, card_number)

## Project Structure

```
card-scrapper/
├── database/
│   ├── __init__.py
│   ├── db_manager.py       # Database operations
│   └── schema.sql          # Database schema
├── scrapers/
│   ├── __init__.py
│   ├── base_scraper.py     # Base scraper class
│   ├── pokemon_scraper.py  # Pokémon TCG scraper
│   ├── yugioh_scraper.py   # YuGiOh scraper
│   ├── mtg_scraper.py      # MTG scraper
│   ├── lorcana_scraper.py  # Lorcana scraper
│   └── onepiece_scraper.py # One Piece scraper
├── main.py                  # Main orchestrator
├── requirements.txt         # Python dependencies
├── .env.example            # Environment variables template
├── .gitignore
└── README.md
```

## Configuration

Edit the `.env` file to configure:

- **Database settings**: Host, port, database name, user, password
- **Scraping settings**: Request delays, timeouts, retry attempts

## Logging

The system creates detailed logs with timestamps:
- Console output for real-time monitoring
- Log files: `scraper_YYYYMMDD_HHMMSS.log`

## Error Handling

- **Retry mechanism**: Automatic retry with exponential backoff
- **Graceful degradation**: Falls back to web scraping if APIs fail
- **Transaction safety**: Database operations use transactions
- **Rate limiting**: Configurable delays between requests

## Performance Considerations

- **Batch processing**: Cards are processed in batches for efficiency
- **API preference**: Uses official APIs when available
- **Connection pooling**: Reuses database connections
- **Progress tracking**: Real-time progress bars for long operations

## Extending the System

To add a new card game:

1. Create a new scraper in `scrapers/` extending `BaseScraper`
2. Implement the `scrape()` method
3. Register the scraper in `scrapers/__init__.py`
4. Add to the orchestrator in `main.py`

## Troubleshooting

### Common Issues:

1. **Database connection failed**:
   - Check PostgreSQL is running
   - Verify credentials in `.env`
   - Ensure database exists

2. **Scraping returns no data**:
   - Check internet connection
   - Verify website structure hasn't changed
   - Check logs for specific errors

3. **Rate limiting errors**:
   - Increase delay in `.env`
   - Run scrapers sequentially instead of parallel

## Legal Notice

This tool is for educational and reference purposes. Please respect:
- Website terms of service
- API rate limits
- Copyright and intellectual property rights
- Use official APIs when available

## License

This project is provided as-is for educational purposes.

## Support

For issues or questions, please check the logs first, then create an issue in the repository.