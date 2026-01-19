#!/usr/bin/env node

/**
 * Migration script for Global Settings
 * Creates global_settings table and seeds default values
 * Run: node scripts/migrate-global-settings.js
 */

const sqlite3 = require('sqlite3').verbose()
const path = require('path')

const dbPath = path.join(__dirname, '..', 'database', 'user-management.db')

console.log('='.repeat(60))
console.log('Global Settings Migration')
console.log('='.repeat(60))
console.log('')
console.log('Database:', dbPath)

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message)
    process.exit(1)
  }
  console.log('Connected to SQLite database')
})

// Create table
const createTable = `
CREATE TABLE IF NOT EXISTS global_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type TEXT DEFAULT 'string',
    category TEXT DEFAULT 'general',
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_global_settings_key ON global_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_global_settings_category ON global_settings(category);
`

console.log('')
console.log('Step 1: Creating table...')

db.exec(createTable, (err) => {
  if (err) {
    console.error('Error creating table:', err.message)
    process.exit(1)
  }
  console.log('Table created successfully')
  seedData()
})

function seedData() {
  console.log('')
  console.log('Step 2: Seeding default settings...')

  const settings = [
    // General settings
    { key: 'site_name', value: 'Nexus TCGrading', type: 'string', category: 'general', description: 'Site name displayed across the platform' },
    { key: 'site_description', value: 'Professional card grading and authentication services', type: 'string', category: 'general', description: 'Site description for SEO' },
    { key: 'support_email', value: 'support@nexusgrading.com', type: 'string', category: 'general', description: 'Support email address' },
    { key: 'default_language', value: 'en', type: 'string', category: 'general', description: 'Default site language' },
    { key: 'timezone', value: 'UTC', type: 'string', category: 'general', description: 'Default timezone' },

    // Currency settings
    { key: 'currency_code', value: 'GBP', type: 'string', category: 'currency', description: 'Default currency code' },
    { key: 'currency_symbol', value: '£', type: 'string', category: 'currency', description: 'Currency symbol to display' },
    { key: 'currency_position', value: 'before', type: 'string', category: 'currency', description: 'Position of currency symbol (before/after)' },

    // Registration settings
    { key: 'allow_registration', value: 'true', type: 'boolean', category: 'registration', description: 'Allow new user registrations' },
    { key: 'require_email_verification', value: 'true', type: 'boolean', category: 'registration', description: 'Require email verification for new users' },
    { key: 'maintenance_mode', value: 'false', type: 'boolean', category: 'system', description: 'Enable maintenance mode' }
  ]

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO global_settings (setting_key, setting_value, setting_type, category, description)
    VALUES (?, ?, ?, ?, ?)
  `)

  settings.forEach(setting => {
    stmt.run(setting.key, setting.value, setting.type, setting.category, setting.description)
  })

  stmt.finalize()
  console.log(`  - Inserted ${settings.length} default settings`)

  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message)
    } else {
      console.log('')
      console.log('='.repeat(60))
      console.log('Migration complete!')
      console.log('='.repeat(60))
    }
  })
}
