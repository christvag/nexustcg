const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(process.cwd(), 'database', 'user-management.db')
const db = new Database(dbPath)

console.log('🔄 Adding username field to users table...')

try {
  // Check if username column exists
  const tableInfo = db.pragma('table_info(users)')
  const hasUsername = tableInfo.some(col => col.name === 'username')

  if (hasUsername) {
    console.log('✅ Username column already exists')
  } else {
    // Add username column (without UNIQUE constraint initially)
    db.exec(`
      ALTER TABLE users ADD COLUMN username TEXT;
    `)
    console.log('✅ Username column added successfully')

    // Create unique index for username
    db.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);
    `)
    console.log('✅ Username unique index created')
  }

  db.close()
  console.log('✅ Migration completed successfully')
} catch (error) {
  console.error('❌ Error during migration:', error)
  db.close()
  process.exit(1)
}
