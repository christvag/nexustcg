#!/usr/bin/env node

/**
 * Migration script for Packages V2
 * Creates tables and seeds initial data
 * Run: node scripts/migrate-packages-v2.js
 */

const sqlite3 = require('sqlite3').verbose()
const path = require('path')

const dbPath = path.join(__dirname, '..', 'database', 'user-management.db')

console.log('='.repeat(60))
console.log('Packages V2 Migration')
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

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON')

// Create tables
const createTables = `
-- Packages V2 table (columns in the pricing table)
CREATE TABLE IF NOT EXISTS packages_v2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    price_suffix TEXT DEFAULT '/card',
    cta_text TEXT DEFAULT 'Get Started',
    cta_url TEXT,
    description TEXT,
    long_description TEXT,
    icon_url TEXT,
    image_url TEXT,
    highlight_color TEXT DEFAULT '#d83f0a',
    is_featured BOOLEAN DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Package Features V2 table (rows in the pricing table)
CREATE TABLE IF NOT EXISTS package_features_v2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Package Feature Values V2 table (intersection of packages and features)
CREATE TABLE IF NOT EXISTS package_feature_values_v2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    package_id INTEGER NOT NULL,
    feature_id INTEGER NOT NULL,
    value_type TEXT DEFAULT 'check' CHECK(value_type IN ('check', 'dropdown', 'text')),
    is_checked BOOLEAN DEFAULT 0,
    text_value TEXT,
    dropdown_options TEXT,
    dropdown_selected TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (package_id) REFERENCES packages_v2(id) ON DELETE CASCADE,
    FOREIGN KEY (feature_id) REFERENCES package_features_v2(id) ON DELETE CASCADE,
    UNIQUE(package_id, feature_id)
);

-- Packages V2 Settings table
CREATE TABLE IF NOT EXISTS packages_v2_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_packages_v2_slug ON packages_v2(slug);
CREATE INDEX IF NOT EXISTS idx_packages_v2_active ON packages_v2(is_active);
CREATE INDEX IF NOT EXISTS idx_packages_v2_order ON packages_v2(display_order);
CREATE INDEX IF NOT EXISTS idx_package_features_v2_active ON package_features_v2(is_active);
CREATE INDEX IF NOT EXISTS idx_package_features_v2_order ON package_features_v2(display_order);
CREATE INDEX IF NOT EXISTS idx_package_feature_values_v2_package ON package_feature_values_v2(package_id);
CREATE INDEX IF NOT EXISTS idx_package_feature_values_v2_feature ON package_feature_values_v2(feature_id);
`

console.log('')
console.log('Step 1: Creating tables...')

db.exec(createTables, (err) => {
  if (err) {
    console.error('Error creating tables:', err.message)
    process.exit(1)
  }
  console.log('Tables created successfully')
  seedData()
})

function seedData() {
  console.log('')
  console.log('Step 2: Seeding initial data...')

  db.serialize(() => {
    // Clear existing data
    db.run('DELETE FROM package_feature_values_v2')
    db.run('DELETE FROM package_features_v2')
    db.run('DELETE FROM packages_v2')

    // Insert packages (columns)
    const packages = [
      {
        name: 'Authentication',
        slug: 'authentication',
        price: 10,
        display_order: 1,
        description: 'Verify card authenticity',
        long_description: 'Our Authentication service provides a thorough verification of your trading card\'s authenticity. Our expert graders will examine your card for signs of tampering, reprints, or counterfeits, giving you peace of mind about your collection. Perfect for high-value cards where authenticity is crucial.'
      },
      {
        name: 'Bulk',
        slug: 'bulk',
        price: 15,
        display_order: 2,
        description: 'Cost-efficient bulk grading',
        long_description: 'Our Bulk grading service is designed for collectors with larger collections who want professional grading at an affordable price. Submit multiple cards at once and receive consistent, reliable grading across your entire submission. Ideal for building a graded collection or preparing cards for sale.'
      },
      {
        name: 'Standard',
        slug: 'standard',
        price: 25,
        display_order: 3,
        description: 'Full grading service',
        is_featured: 1,
        long_description: 'Our Standard grading service offers comprehensive card evaluation including centering, corners, edges, and surface analysis. Each card receives a detailed examination by our expert graders and is encapsulated in our premium protective case. This is our most popular service for serious collectors.'
      },
      {
        name: 'Premium',
        slug: 'premium',
        price: 45,
        display_order: 4,
        description: 'Premium grading with subgrades',
        long_description: 'Our Premium grading service provides the most detailed analysis available. In addition to the overall grade, you\'ll receive individual subgrades for centering, corners, edges, and surface. Premium submissions also receive priority processing and our most thorough examination. Perfect for high-value cards destined for sale or display.'
      }
    ]

    const pkgStmt = db.prepare(`
      INSERT INTO packages_v2 (name, slug, price, display_order, description, long_description, is_featured)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    packages.forEach(pkg => {
      pkgStmt.run(pkg.name, pkg.slug, pkg.price, pkg.display_order, pkg.description, pkg.long_description || null, pkg.is_featured || 0)
    })
    pkgStmt.finalize()
    console.log(`  - Inserted ${packages.length} packages`)

    // Insert features (rows)
    const features = [
      { name: 'Ace Features', category: 'features', display_order: 1 },
      { name: 'User Dashboard', category: 'features', display_order: 2 },
      { name: 'Real-Time Submission Tracking', category: 'features', display_order: 3 },
      { name: 'Custom Label Options', category: 'features', display_order: 4 }
    ]

    const featStmt = db.prepare(`
      INSERT INTO package_features_v2 (name, category, display_order)
      VALUES (?, ?, ?)
    `)

    features.forEach(feat => {
      featStmt.run(feat.name, feat.category, feat.display_order)
    })
    featStmt.finalize()
    console.log(`  - Inserted ${features.length} features`)

    // Create feature values for each package-feature combination
    // We'll set all to 'check' type with is_checked = 1 by default for Standard and Premium
    db.all('SELECT id FROM packages_v2 ORDER BY display_order', [], (err, pkgRows) => {
      if (err) {
        console.error('Error fetching packages:', err)
        return
      }

      db.all('SELECT id FROM package_features_v2 ORDER BY display_order', [], (err, featRows) => {
        if (err) {
          console.error('Error fetching features:', err)
          return
        }

        const valueStmt = db.prepare(`
          INSERT INTO package_feature_values_v2 (package_id, feature_id, value_type, is_checked)
          VALUES (?, ?, 'check', ?)
        `)

        let insertCount = 0
        pkgRows.forEach((pkg, pkgIndex) => {
          featRows.forEach((feat) => {
            // Set checked based on package tier (Standard and Premium have all features)
            const isChecked = pkgIndex >= 2 ? 1 : (pkgIndex === 1 ? 1 : 0)
            valueStmt.run(pkg.id, feat.id, isChecked)
            insertCount++
          })
        })
        valueStmt.finalize()
        console.log(`  - Inserted ${insertCount} feature values`)

        // Insert default settings
        const settingsStmt = db.prepare(`
          INSERT OR REPLACE INTO packages_v2_settings (setting_key, setting_value)
          VALUES (?, ?)
        `)
        settingsStmt.run('page_title', 'Choose Your Grading Package')
        settingsStmt.run('page_subtitle', 'Professional TCG card grading services')
        settingsStmt.run('show_comparison', '1')
        settingsStmt.finalize()
        console.log('  - Inserted default settings')

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
      })
    })
  })
}
