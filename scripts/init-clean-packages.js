const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'database', 'user-management.db');
const schemaPath = path.join(__dirname, '..', 'database', 'user-management-schema.sql');

console.log('🔄 Reinitializing user-management.db with clean packages table...\n');

// Read the schema file
const schema = fs.readFileSync(schemaPath, 'utf8');

// Delete existing database to start fresh
if (fs.existsSync(dbPath)) {
  console.log('📁 Removing existing database...');
  fs.unlinkSync(dbPath);
}

// Create new database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error creating database:', err);
    process.exit(1);
  }
  console.log('✅ Database created successfully\n');
});

// Execute schema
db.exec(schema, (err) => {
  if (err) {
    console.error('❌ Error executing schema:', err);
    process.exit(1);
  }
  console.log('✅ Schema executed successfully\n');
  console.log('✅ Packages table created (empty - no seed data)\n');

  closeDatabase();
});

function closeDatabase() {
  db.close((err) => {
    if (err) {
      console.error('❌ Error closing database:', err);
      process.exit(1);
    }
    console.log('✅ Database initialization complete!');
    console.log(`📍 Database location: ${dbPath}\n`);
  });
}
