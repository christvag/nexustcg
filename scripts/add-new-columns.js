const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DATABASE_PATH = path.join(process.cwd(), 'database', 'graded-cards.db');

const db = new sqlite3.Database(DATABASE_PATH, (err) => {
  if (err) {
    console.error('❌ Error connecting to database:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to database');
});

// Add new columns if they don't exist
db.serialize(() => {
  // Check if columns exist
  db.all("PRAGMA table_info(population_report_cards)", (err, columns) => {
    if (err) {
      console.error('❌ Error checking table info:', err.message);
      db.close();
      return;
    }

    const columnNames = columns.map(col => col.name);

    // Add grade_name if it doesn't exist
    if (!columnNames.includes('grade_name')) {
      db.run("ALTER TABLE population_report_cards ADD COLUMN grade_name TEXT", (err) => {
        if (err) {
          console.error('❌ Error adding grade_name column:', err.message);
        } else {
          console.log('✅ Added grade_name column');
        }
      });
    } else {
      console.log('ℹ️  grade_name column already exists');
    }

    // Add year_card if it doesn't exist
    if (!columnNames.includes('year_card')) {
      db.run("ALTER TABLE population_report_cards ADD COLUMN year_card TEXT", (err) => {
        if (err) {
          console.error('❌ Error adding year_card column:', err.message);
        } else {
          console.log('✅ Added year_card column');
        }
      });
    } else {
      console.log('ℹ️  year_card column already exists');
    }

    // Close connection after a delay to allow async operations to complete
    setTimeout(() => {
      db.close((err) => {
        if (err) {
          console.error('❌ Error closing database:', err.message);
        } else {
          console.log('✅ Database connection closed');
        }
      });
    }, 1000);
  });
});
