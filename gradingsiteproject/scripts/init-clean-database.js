const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const fs = require('fs')

const dbPath = path.join(__dirname, '..', 'database', 'user-management.db')
const schemaPath = path.join(__dirname, '..', 'database', 'user-management-schema.sql')

console.log('Initializing clean user management database...')

// Ensure database directory exists
const dbDir = path.dirname(dbPath)
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

// Create/connect to database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message)
    process.exit(1)
  }
  console.log('Connected to SQLite database')
})

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON')

// Read and execute schema
const schema = fs.readFileSync(schemaPath, 'utf8')

db.exec(schema, (err) => {
  if (err) {
    console.error('Error executing schema:', err.message)
    process.exit(1)
  }
  
  console.log('Clean database schema created successfully')
  console.log('Database is ready for use - no sample data included')
  
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message)
    } else {
      console.log('Database connection closed')
      console.log('✓ Clean database initialization complete!')
    }
  })
})