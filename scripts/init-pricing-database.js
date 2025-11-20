const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'database', 'pricing-packages.db');
const schemaPath = path.join(__dirname, '..', 'database', 'pricing-packages-schema.sql');

// Create database directory if it doesn't exist
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Read the schema file
const schema = fs.readFileSync(schemaPath, 'utf8');

// Create and initialize the database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to the pricing packages SQLite database.');
});

// Execute the schema
db.exec(schema, (err) => {
  if (err) {
    console.error('❌ Error creating schema:', err.message);
    db.close();
    process.exit(1);
  }

  console.log('✅ Pricing packages database schema created successfully!');
  console.log('✅ Default pricing packages inserted');

  // Close the database
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
      process.exit(1);
    }
    console.log('✅ Database connection closed.');
    console.log('\n📦 Pricing database initialized at:', dbPath);
  });
});
