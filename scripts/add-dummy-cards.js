const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database', 'graded-cards.db');

// Dummy card data based on main-db.csv format
const dummyCards = [
  {
    card_id: '00000674',
    card_game: 'Yu-Gi-Oh!',
    card_name: 'APPLIANCER SOCKETROLL',
    card_grade: '9',
    set_name: 'BOL - ARMAGEDDON',
    edition: 'BLAR-EN035',
    rarity: 'ULTRA RARE',
    card_info: '',
    card_owner: 'Owner 6',
    date_graded: '2024-08-27'
  },
  {
    card_id: '00000675',
    card_game: 'Pokemon',
    card_name: 'PIKACHU VMAX',
    card_grade: '10',
    set_name: 'Vivid Voltage',
    edition: '1st Edition',
    rarity: 'SECRET RARE',
    card_info: 'Pristine condition',
    card_owner: 'John Smith',
    date_graded: '2024-09-15'
  },
  {
    card_id: '00000676',
    card_game: 'MTG',
    card_name: 'BLACK LOTUS',
    card_grade: '8',
    set_name: 'Alpha',
    edition: 'Limited Edition',
    rarity: 'RARE',
    card_info: 'Power Nine card',
    card_owner: 'Sarah Johnson',
    date_graded: '2024-08-10'
  },
  {
    card_id: '00000677',
    card_game: 'Pokemon',
    card_name: 'CHARIZARD',
    card_grade: '9',
    set_name: 'Base Set',
    edition: '1st Edition',
    rarity: 'HOLO RARE',
    card_info: 'Classic card',
    card_owner: 'Mike Davis',
    date_graded: '2024-09-01'
  },
  {
    card_id: '00000678',
    card_game: 'Yu-Gi-Oh!',
    card_name: 'BLUE-EYES WHITE DRAGON',
    card_grade: '10',
    set_name: 'Legend of Blue Eyes',
    edition: 'LOB-001',
    rarity: 'ULTRA RARE',
    card_info: 'Perfect centering',
    card_owner: 'Emily Chen',
    date_graded: '2024-09-10'
  },
  {
    card_id: '00000679',
    card_game: 'One Piece',
    card_name: 'MONKEY D. LUFFY',
    card_grade: '9',
    set_name: 'Romance Dawn',
    edition: 'OP01-001',
    rarity: 'LEADER',
    card_info: 'Gear Fifth artwork',
    card_owner: 'Tom Wilson',
    date_graded: '2024-09-20'
  },
  {
    card_id: '00000680',
    card_game: 'Pokemon',
    card_name: 'MEW EX',
    card_grade: '8',
    set_name: 'Holon Phantoms',
    edition: '',
    rarity: 'ULTRA RARE',
    card_info: 'Light wear on edges',
    card_owner: 'Lisa Anderson',
    date_graded: '2024-08-25'
  },
  {
    card_id: '00000681',
    card_game: 'MTG',
    card_name: 'MOX SAPPHIRE',
    card_grade: '7',
    set_name: 'Beta',
    edition: 'Limited Edition',
    rarity: 'RARE',
    card_info: 'Power Nine',
    card_owner: 'David Brown',
    date_graded: '2024-09-05'
  },
  {
    card_id: '00000682',
    card_game: 'Yu-Gi-Oh!',
    card_name: 'DARK MAGICIAN',
    card_grade: '10',
    set_name: 'Dark Duel Stories',
    edition: 'DDS-002',
    rarity: 'SECRET RARE',
    card_info: 'Gem mint condition',
    card_owner: 'Rachel Green',
    date_graded: '2024-09-12'
  },
  {
    card_id: '00000683',
    card_game: 'One Piece',
    card_name: 'RORONOA ZORO',
    card_grade: '9',
    set_name: 'Romance Dawn',
    edition: 'OP01-025',
    rarity: 'SUPER RARE',
    card_info: 'Three sword style',
    card_owner: 'Chris Martinez',
    date_graded: '2024-09-18'
  }
];

async function addDummyCards() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('❌ Error connecting to database:', err);
        reject(err);
        return;
      }
      console.log('✅ Connected to database');
    });

    // Create table if not exists
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS population_report_cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        card_id TEXT NOT NULL UNIQUE,
        card_game TEXT NOT NULL,
        card_name TEXT NOT NULL,
        card_grade TEXT NOT NULL,
        set_name TEXT NOT NULL,
        edition TEXT,
        rarity TEXT NOT NULL,
        card_info TEXT,
        card_owner TEXT NOT NULL,
        date_graded TEXT NOT NULL,
        front_image TEXT,
        back_image TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    db.run(createTableSQL, (err) => {
      if (err) {
        console.error('❌ Error creating table:', err);
        reject(err);
        return;
      }
      console.log('✅ Table ready');

      // Insert dummy cards
      const insertSQL = `
        INSERT OR REPLACE INTO population_report_cards (
          card_id, card_game, card_name, card_grade, set_name,
          edition, rarity, card_info, card_owner, date_graded,
          front_image, back_image
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', '')
      `;

      let completed = 0;
      const total = dummyCards.length;

      dummyCards.forEach((card, index) => {
        db.run(insertSQL, [
          card.card_id,
          card.card_game,
          card.card_name,
          card.card_grade,
          card.set_name,
          card.edition,
          card.rarity,
          card.card_info,
          card.card_owner,
          card.date_graded
        ], (err) => {
          if (err) {
            console.error(`❌ Error inserting card ${card.card_id}:`, err.message);
          } else {
            console.log(`✅ Added card: ${card.card_id} - ${card.card_name}`);
          }

          completed++;
          if (completed === total) {
            console.log(`\n✅ Successfully added ${total} dummy cards!`);
            db.close((err) => {
              if (err) {
                console.error('❌ Error closing database:', err);
                reject(err);
              } else {
                console.log('✅ Database connection closed');
                resolve();
              }
            });
          }
        });
      });
    });
  });
}

// Run the script
addDummyCards().catch((err) => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});
