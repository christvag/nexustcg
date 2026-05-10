#!/usr/bin/env node
/**
 * Idempotent database seed.
 *
 * Safe to run on every install / build:
 *  - Creates user-management.db and graded-cards.db with their schemas (CREATE TABLE IF NOT EXISTS)
 *  - Seeds the default admin account ONLY if no admin exists
 *  - Seeds default packages ONLY if the table is empty
 *
 * Used as `postinstall` to guarantee fresh checkouts have a working DB,
 * and as `db:seed` for manual execution.
 */

const path = require('path')
const fs = require('fs')

// Resolve native modules without crashing if they aren't built yet (e.g. during the very first install pass).
let Database, bcrypt
try {
  Database = require('better-sqlite3')
  bcrypt = require('bcryptjs')
} catch (err) {
  console.warn('[db-seed] Native modules not ready yet — skipping (will run again on next invocation).')
  console.warn('[db-seed] Cause:', err.message)
  process.exit(0)
}

const DB_DIR = path.join(__dirname, '..', 'database')
const USER_DB = path.join(DB_DIR, 'user-management.db')
const CARDS_DB = path.join(DB_DIR, 'graded-cards.db')
const USER_SCHEMA = path.join(DB_DIR, 'user-management-schema.sql')
const CARDS_SCHEMA = path.join(DB_DIR, 'graded-cards-schema.sql')

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true })
}

function applySchema(dbPath, schemaPath) {
  const db = new Database(dbPath)
  try {
    db.pragma('foreign_keys = ON')
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8')
      db.exec(schema)
    }
    return db
  } catch (err) {
    db.close()
    throw err
  }
}

function maybeRunV2DropMigration() {
  // Pre-existing DBs from the V2 era still have packages_v2 tables. Detect and run the
  // one-shot migration BEFORE applying the new schema so we don't end up with both sets.
  if (!fs.existsSync(USER_DB)) return
  let needs = false
  const probe = new Database(USER_DB, { readonly: true })
  try {
    needs = !!probe.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='packages_v2'").get()
  } finally {
    probe.close()
  }
  if (needs) {
    console.log('[db-seed] Detected legacy packages_v2 tables — running migration first…')
    require('./migrate-drop-v2-suffix.js')
  }
}

function seedUserDb() {
  if (!fs.existsSync(USER_SCHEMA)) {
    console.log('[db-seed] user-management-schema.sql not present yet — skipping (postinstall will run again later).')
    return
  }
  const db = applySchema(USER_DB, USER_SCHEMA)
  try {
    // Admin user
    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@tcgrading.com'
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin123'
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail)
    if (!existing) {
      const hash = bcrypt.hashSync(adminPassword, 12)
      db.prepare(`
        INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified)
        VALUES (?, ?, 'Admin', 'User', 'admin', 1, 1)
      `).run(adminEmail, hash)
      console.log(`[db-seed] Seeded admin user: ${adminEmail}`)
    } else {
      console.log(`[db-seed] Admin user already present (id=${existing.id})`)
    }

    // Default packages V2 (only if empty)
    try {
      const pkgCount = db.prepare('SELECT COUNT(*) AS c FROM packages').get()
      if (pkgCount && pkgCount.c === 0) {
        const insert = db.prepare(`
          INSERT INTO packages (name, slug, price, cta_text, cta_url, description, is_featured, is_active, display_order)
          VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
        `)
        const seed = [
          ['Authentication', 'authentication', 10, 'Get Started', '/packages-v2/authentication', 'Verify card authenticity', 0, 1],
          ['Bulk Grading', 'bulk-grading', 12, 'Get Started', '/packages-v2/bulk-grading', 'Best for 50+ cards', 0, 2],
          ['Standard', 'standard', 15, 'Get Started', '/packages-v2/standard', 'Standard grading service', 1, 3],
          ['Express', 'express', 20, 'Get Started', '/packages-v2/express', 'Priority turnaround', 0, 4],
        ]
        const tx = db.transaction((rows) => { for (const r of rows) insert.run(...r) })
        tx(seed)
        console.log('[db-seed] Seeded default packages (4 rows)')
      }
    } catch (err) {
      // packages table may not exist in older schemas — non-fatal
      console.log('[db-seed] Skipped packages seed:', err.message)
    }
  } finally {
    db.close()
  }
}

function seedCardsDb() {
  // graded-cards.db is created on demand by lib/population-report-database.ts.
  // Apply its schema here so a fresh checkout has the table immediately.
  const db = new Database(CARDS_DB)
  try {
    db.pragma('foreign_keys = ON')
    if (fs.existsSync(CARDS_SCHEMA)) {
      try {
        const schema = fs.readFileSync(CARDS_SCHEMA, 'utf8')
        db.exec(schema)
      } catch (err) {
        // Tolerate older schema files that reference tables/views we no longer use
        console.log('[db-seed] graded-cards-schema.sql skipped:', err.message)
      }
    }
    db.exec(`
      CREATE TABLE IF NOT EXISTS population_report_cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        card_id TEXT NOT NULL UNIQUE,
        card_game TEXT NOT NULL,
        card_name TEXT NOT NULL,
        card_grade TEXT NOT NULL,
        grade_name TEXT,
        year_card TEXT,
        set_name TEXT NOT NULL,
        edition TEXT,
        rarity TEXT NOT NULL,
        card_number TEXT,
        card_info TEXT,
        card_owner TEXT,
        date_graded TEXT NOT NULL,
        front_image TEXT,
        back_image TEXT,
        is_featured INTEGER DEFAULT 0,
        language TEXT DEFAULT 'English',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    const count = db.prepare('SELECT COUNT(*) AS c FROM population_report_cards').get()
    console.log(`[db-seed] population_report_cards rows: ${count.c}`)

    // One-shot: trim leading/trailing whitespace from existing rows so URLs that include
    // these values (?card=Charizard%20Japanese%20) don't carry stray spaces. Idempotent —
    // running twice yields no further changes.
    const trimResult = db.prepare(`
      UPDATE population_report_cards
      SET card_name = TRIM(card_name),
          set_name = TRIM(set_name),
          card_owner = TRIM(card_owner),
          edition = TRIM(edition),
          card_number = TRIM(card_number)
      WHERE card_name <> TRIM(card_name)
         OR set_name <> TRIM(set_name)
         OR card_owner <> TRIM(card_owner)
         OR edition <> TRIM(edition)
         OR card_number <> TRIM(card_number)
    `).run()
    if (trimResult.changes > 0) {
      console.log(`[db-seed] Trimmed whitespace on ${trimResult.changes} card row(s)`)
    }
  } finally {
    db.close()
  }
}

try {
  maybeRunV2DropMigration()
  seedUserDb()
  seedCardsDb()
  console.log('[db-seed] ✓ Done')
} catch (err) {
  console.error('[db-seed] FAILED:', err.message)
  // Don't fail the install — DB seed errors shouldn't break dependency installation in CI.
  process.exit(0)
}
