#!/usr/bin/env node

/**
 * Reset Admin Password Script
 * Usage: node scripts/reset-admin-password.js <new-password>
 * Example: node scripts/reset-admin-password.js MyNewPassword123
 */

const sqlite3 = require('sqlite3').verbose()
const bcrypt = require('bcrypt')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'database', 'user-management.db')

const newPassword = process.argv[2]

if (!newPassword) {
  console.error('Usage: node scripts/reset-admin-password.js <new-password>')
  console.error('Example: node scripts/reset-admin-password.js MyNewPassword123')
  process.exit(1)
}

if (newPassword.length < 6) {
  console.error('Password must be at least 6 characters')
  process.exit(1)
}

console.log('Resetting admin password...')
console.log('Database:', dbPath)

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message)
    process.exit(1)
  }
})

// Hash the new password
const saltRounds = 12
bcrypt.hash(newPassword, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error hashing password:', err.message)
    db.close()
    process.exit(1)
  }

  console.log('Generated new password hash')

  // Update admin user password
  db.run(
    `UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE email = 'admin@tcgrading.com'`,
    [hash],
    function(err) {
      if (err) {
        console.error('Error updating password:', err.message)
        db.close()
        process.exit(1)
      }

      if (this.changes === 0) {
        console.error('Admin user not found! Make sure to run setup-database.js first.')
        db.close()
        process.exit(1)
      }

      console.log('')
      console.log('='.repeat(50))
      console.log('Admin password reset successfully!')
      console.log('='.repeat(50))
      console.log('')
      console.log('Login credentials:')
      console.log('  Email: admin@tcgrading.com')
      console.log('  Password: ' + newPassword)
      console.log('')
      console.log('IMPORTANT: Clear your browser cookies/localStorage')
      console.log('and log in again with the new password.')
      console.log('')

      db.close()
    }
  )
})
