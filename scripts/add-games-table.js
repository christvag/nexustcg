const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'database', 'graded-cards.db');

console.log('📦 Adding games table to graded-cards.db...');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Error connecting to database:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to database');
});

// Create games table
const createGamesTableSQL = `
  CREATE TABLE IF NOT EXISTS card_games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_name TEXT UNIQUE NOT NULL,
    logo_path TEXT,
    is_active INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;

// Create index
const createIndexSQL = `
  CREATE INDEX IF NOT EXISTS idx_card_games_active ON card_games(is_active);
`;

// Create trigger for updated_at
const createTriggerSQL = `
  CREATE TRIGGER IF NOT EXISTS update_card_games_updated_at
    AFTER UPDATE ON card_games
    FOR EACH ROW
  BEGIN
    UPDATE card_games SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;
`;

// Insert default games
const insertDefaultGamesSQL = `
  INSERT OR IGNORE INTO card_games (game_name, is_active, display_order)
  VALUES
    ('Pokemon', 1, 1),
    ('Yu-Gi-Oh!', 1, 2),
    ('MTG', 1, 3),
    ('One Piece', 1, 4);
`;

// Migrate data from JSON file if exists
function migrateFromJSON() {
  const jsonPath = path.join(__dirname, '..', 'data', 'population-report-settings.json');

  if (fs.existsSync(jsonPath)) {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    if (data.gameLogos) {
      console.log('📝 Migrating game logos from JSON...');

      Object.entries(data.gameLogos).forEach(([gameName, logoPath]) => {
        db.run(
          'UPDATE card_games SET logo_path = ? WHERE game_name = ?',
          [logoPath, gameName],
          (err) => {
            if (err) {
              console.error(`❌ Error updating logo for ${gameName}:`, err.message);
            } else {
              console.log(`✅ Updated logo for ${gameName}: ${logoPath}`);
            }
          }
        );
      });
    }

    // Add any additional games from JSON that aren't in defaults
    if (data.cardGames) {
      data.cardGames.forEach((gameName, index) => {
        if (!['Pokemon', 'Yu-Gi-Oh!', 'MTG', 'One Piece'].includes(gameName)) {
          const isActive = data.selectedGames?.includes(gameName) ? 1 : 0;
          const logoPath = data.gameLogos?.[gameName] || null;

          db.run(
            'INSERT OR IGNORE INTO card_games (game_name, logo_path, is_active, display_order) VALUES (?, ?, ?, ?)',
            [gameName, logoPath, isActive, index + 5],
            (err) => {
              if (err) {
                console.error(`❌ Error adding game ${gameName}:`, err.message);
              } else {
                console.log(`✅ Added custom game: ${gameName}`);
              }
            }
          );
        }
      });
    }
  }
}

// Execute schema changes
db.serialize(() => {
  db.run(createGamesTableSQL, (err) => {
    if (err) {
      console.error('❌ Error creating table:', err.message);
      process.exit(1);
    }
    console.log('✅ Games table created');
  });

  db.run(createIndexSQL, (err) => {
    if (err) {
      console.error('❌ Error creating index:', err.message);
    } else {
      console.log('✅ Index created');
    }
  });

  db.run(createTriggerSQL, (err) => {
    if (err) {
      console.error('❌ Error creating trigger:', err.message);
    } else {
      console.log('✅ Trigger created');
    }
  });

  db.run(insertDefaultGamesSQL, (err) => {
    if (err) {
      console.error('❌ Error inserting default games:', err.message);
    } else {
      console.log('✅ Default games inserted');
    }
  });

  // Migrate data after a short delay to ensure table is created
  setTimeout(() => {
    migrateFromJSON();

    // Close database after all operations
    setTimeout(() => {
      db.close((err) => {
        if (err) {
          console.error('❌ Error closing database:', err.message);
        } else {
          console.log('✅ Database migration complete!');
        }
      });
    }, 500);
  }, 100);
});
