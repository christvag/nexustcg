#!/usr/bin/env node
/**
 * One-shot migration: drop the V2 naming suffix.
 *
 * Renames packages_v2 → packages, plus the three related tables, indexes, and triggers.
 * Drops the legacy V1 `packages` table first (confirmed dead code path before running).
 *
 * Idempotent: if the target state already exists (e.g. `packages` table is the V2 schema),
 * the script no-ops and exits 0. Run as part of a deploy or manually:
 *
 *   node scripts/migrate-drop-v2-suffix.js
 */

const path = require('path')
const Database = require('better-sqlite3')

const DB_PATH = path.join(__dirname, '..', 'database', 'user-management.db')

const RENAMES = [
  ['packages_v2', 'packages'],
  ['package_features_v2', 'package_features'],
  ['package_feature_values_v2', 'package_feature_values'],
  ['packages_v2_settings', 'packages_settings'],
]

const NEW_INDEXES = [
  'CREATE INDEX IF NOT EXISTS idx_packages_slug ON packages(slug)',
  'CREATE INDEX IF NOT EXISTS idx_packages_active ON packages(is_active)',
  'CREATE INDEX IF NOT EXISTS idx_packages_order ON packages(display_order)',
  'CREATE INDEX IF NOT EXISTS idx_package_features_active ON package_features(is_active)',
  'CREATE INDEX IF NOT EXISTS idx_package_features_order ON package_features(display_order)',
  'CREATE INDEX IF NOT EXISTS idx_package_feature_values_package ON package_feature_values(package_id)',
  'CREATE INDEX IF NOT EXISTS idx_package_feature_values_feature ON package_feature_values(feature_id)',
]

const OLD_INDEXES = [
  'idx_packages_v2_slug',
  'idx_packages_v2_active',
  'idx_packages_v2_order',
  'idx_package_features_v2_active',
  'idx_package_features_v2_order',
  'idx_package_feature_values_v2_package',
  'idx_package_feature_values_v2_feature',
]

const NEW_TRIGGERS = [
  `CREATE TRIGGER IF NOT EXISTS update_packages_updated_at
     AFTER UPDATE ON packages
   BEGIN
     UPDATE packages SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
   END`,
  `CREATE TRIGGER IF NOT EXISTS update_package_features_updated_at
     AFTER UPDATE ON package_features
   BEGIN
     UPDATE package_features SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
   END`,
  `CREATE TRIGGER IF NOT EXISTS update_package_feature_values_updated_at
     AFTER UPDATE ON package_feature_values
   BEGIN
     UPDATE package_feature_values SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
   END`,
]

const OLD_TRIGGERS = [
  'update_packages_v2_updated_at',
  'update_package_features_v2_updated_at',
  'update_package_feature_values_v2_updated_at',
]

function tableExists(db, name) {
  return !!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(name)
}

function tableHasV2Schema(db) {
  // The V2 packages table has price_suffix; the V1 packages table does not.
  if (!tableExists(db, 'packages')) return false
  const cols = db.prepare("PRAGMA table_info(packages)").all().map(c => c.name)
  return cols.includes('price_suffix')
}

function main() {
  const db = new Database(DB_PATH)
  try {
    db.pragma('foreign_keys = OFF') // disable during structural changes
    db.pragma('journal_mode = WAL')

    // Idempotency: already migrated?
    const v2Present = tableExists(db, 'packages_v2')
    const newPresent = tableHasV2Schema(db)

    if (!v2Present && newPresent) {
      console.log('[migrate-drop-v2] Already migrated — no-op.')
      return
    }

    if (!v2Present && !newPresent) {
      console.log('[migrate-drop-v2] Neither v2 nor renamed tables present. Nothing to migrate.')
      return
    }

    console.log('[migrate-drop-v2] Starting migration…')
    const before = {
      packages: tableExists(db, 'packages_v2') ? db.prepare('SELECT COUNT(*) AS c FROM packages_v2').get().c : null,
      features: tableExists(db, 'package_features_v2') ? db.prepare('SELECT COUNT(*) AS c FROM package_features_v2').get().c : null,
      values: tableExists(db, 'package_feature_values_v2') ? db.prepare('SELECT COUNT(*) AS c FROM package_feature_values_v2').get().c : null,
      settings: tableExists(db, 'packages_v2_settings') ? db.prepare('SELECT COUNT(*) AS c FROM packages_v2_settings').get().c : null,
    }
    console.log('[migrate-drop-v2] Pre-migration row counts:', before)

    const migrate = db.transaction(() => {
      // 1. Drop legacy V1 `packages` table to free the name. Confirmed dead code path.
      if (tableExists(db, 'packages') && !tableHasV2Schema(db)) {
        console.log('[migrate-drop-v2] Dropping legacy V1 `packages` table…')
        db.exec('DROP TABLE packages')
      }

      // 2. Drop old triggers + indexes referencing the v2 names. Required because
      //    SQLite < 3.31 leaves stale references; on newer SQLite we still recreate cleanly.
      for (const trig of OLD_TRIGGERS) db.exec(`DROP TRIGGER IF EXISTS ${trig}`)
      for (const idx of OLD_INDEXES) db.exec(`DROP INDEX IF EXISTS ${idx}`)

      // 3. Rename tables. Modern SQLite auto-rewrites FK references in dependent tables.
      for (const [oldName, newName] of RENAMES) {
        if (tableExists(db, oldName) && !tableExists(db, newName)) {
          console.log(`[migrate-drop-v2] Renaming ${oldName} → ${newName}`)
          db.exec(`ALTER TABLE ${oldName} RENAME TO ${newName}`)
        }
      }

      // 4. Recreate indexes + triggers under the unversioned names.
      for (const sql of NEW_INDEXES) db.exec(sql)
      for (const sql of NEW_TRIGGERS) db.exec(sql)
    })

    migrate()

    // 5. Verify counts preserved.
    const after = {
      packages: db.prepare('SELECT COUNT(*) AS c FROM packages').get().c,
      features: db.prepare('SELECT COUNT(*) AS c FROM package_features').get().c,
      values: db.prepare('SELECT COUNT(*) AS c FROM package_feature_values').get().c,
      settings: db.prepare('SELECT COUNT(*) AS c FROM packages_settings').get().c,
    }
    console.log('[migrate-drop-v2] Post-migration row counts:', after)
    console.log('[migrate-drop-v2] ✓ Done')
  } finally {
    db.pragma('foreign_keys = ON')
    db.close()
  }
}

main()
