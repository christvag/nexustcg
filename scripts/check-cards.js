const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database', 'graded-cards.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Error connecting to database:', err);
    process.exit(1);
  }
  console.log('✅ Connected to database');
});

db.all('SELECT * FROM population_report_cards ORDER BY id', [], (err, rows) => {
  if (err) {
    console.error('❌ Error querying database:', err);
    process.exit(1);
  }

  console.log(`\n📊 Total Cards: ${rows.length}\n`);

  if (rows.length > 0) {
    rows.forEach((row, index) => {
      console.log(`${index + 1}. [${row.card_id}] ${row.card_name} - ${row.card_game} - Grade ${row.card_grade}`);
    });
  } else {
    console.log('⚠️  No cards found in database');
  }

  db.close();
});
