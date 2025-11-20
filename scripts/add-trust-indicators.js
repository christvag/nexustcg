const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'user-management.db');

console.log('🔄 Adding trust_indicators column to packages table...\n');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error connecting to database:', err);
    process.exit(1);
  }
});

// Add trust_indicators column
db.run(
  `ALTER TABLE packages ADD COLUMN trust_indicators TEXT`,
  function(err) {
    if (err) {
      if (err.message.includes('duplicate column')) {
        console.log('ℹ️  Column trust_indicators already exists');
      } else {
        console.error('❌ Error adding column:', err);
        process.exit(1);
      }
    } else {
      console.log('✅ Column trust_indicators added successfully');
    }

    // Update existing packages with default trust indicators
    const defaultIndicators = JSON.stringify([
      { label: 'Secure Processing', icon: 'shield' },
      { label: 'Free Shipping', icon: 'package' },
      { label: 'Guaranteed Quality', icon: 'check' }
    ]);

    db.run(
      `UPDATE packages SET trust_indicators = ? WHERE trust_indicators IS NULL`,
      [defaultIndicators],
      function(err) {
        if (err) {
          console.error('❌ Error updating packages:', err);
          process.exit(1);
        }

        console.log(`✅ Updated ${this.changes} packages with default trust indicators\n`);

        db.close((err) => {
          if (err) {
            console.error('❌ Error closing database:', err);
            process.exit(1);
          }
          console.log('✅ Migration complete!');
          console.log(`📍 Database location: ${dbPath}\n`);
        });
      }
    );
  }
);
