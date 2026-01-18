#!/usr/bin/env node

/**
 * Combined Database Setup Script
 * Run this BEFORE starting Docker containers:
 *   node scripts/setup-database.js
 *   docker-compose down && docker-compose up -d --build
 */

const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const fs = require('fs')

const dbPath = path.join(__dirname, '..', 'database', 'user-management.db')
const schemaPath = path.join(__dirname, '..', 'database', 'user-management-schema.sql')

console.log('='.repeat(60))
console.log('TCG Grading Database Setup')
console.log('='.repeat(60))
console.log('')
console.log('Database path:', dbPath)

// Ensure database directory exists
const dbDir = path.dirname(dbPath)
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
  console.log('Created database directory:', dbDir)
}

// Delete existing database to start fresh
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath)
  console.log('Removed existing database')
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
console.log('')
console.log('Step 1: Creating database schema...')
const schema = fs.readFileSync(schemaPath, 'utf8')

db.exec(schema, (err) => {
  if (err) {
    console.error('Error executing schema:', err.message)
    process.exit(1)
  }

  console.log('Schema created successfully')

  // Now seed the data
  console.log('')
  console.log('Step 2: Seeding initial data...')
  seedData()
})

function seedData() {
  // Users data
  const users = [
    {
      id: 1,
      email: 'admin@tcgrading.com',
      password_hash: '$2b$12$Jtqq.n2hXInDyXfhGCbA4ec3F3akgYmENJoqxGLaFCwC3qbqIUYE.',
      first_name: 'Admin',
      last_name: 'User',
      phone: null,
      role: 'admin',
      is_active: 1,
      email_verified: 1
    },
    {
      id: 4,
      email: 'christopher@thevagroup.com',
      password_hash: '$2b$12$fYfgXayCEJl/RLvNIPcW1OfBlKsuAAOxSBLOV45SAJQ2uocAL/Cfq',
      first_name: 'Christopher',
      last_name: 'Ramirez',
      phone: '9358172730',
      role: 'user',
      is_active: 1,
      email_verified: 0
    }
  ]

  // Packages data
  const packages = [
    {
      id: 'authentication',
      name: 'Authentication',
      slug: 'authentication',
      price: 10,
      description: 'Verifies card authenticity using expert checks and imaging without assigning a grade or encapsulating the card.',
      long_description: 'A streamlined authentication workflow confirming a card\'s legitimacy through optical inspection and expert validation. Designed for collectors who simply want assurance without full grading. Delivered with a digital authentication record and high-resolution image output stored inside the client dashboard.',
      features: '["Authenticity verification","High-resolution scan provided","Digital authentication record","Basic tamper sleeve","Dashboard tracking access"]',
      specifications: '[{"spec_key":"","spec_value":"Manual authenticity check"},{"spec_key":"","spec_value":"600 DPI imaging"},{"spec_key":"","spec_value":"Standard LED lighting"},{"spec_key":"","spec_value":"No subgrades included"},{"spec_key":"","spec_value":"Non-encapsulated return"},{"spec_key":"","spec_value":"Basic serialization only"}]',
      trust_indicators: '[{"label":"Secure Processing","icon":"shield"},{"label":"Free Shipping","icon":"package"},{"label":"Guaranteed Quality","icon":"check"}]',
      icon_name: 'Guarantee',
      icon_url: '/storage/packages/icon-1256620c-fb23-401e-bf45-7bad15fc59a3.png',
      image_url: '/storage/packages/image-c6f718bf-8ee9-46b4-9ed7-1faa6065a044.jpg',
      processing_time: 'Up to 30 Days',
      min_cards: 1,
      max_cards: null,
      is_active: 1,
      is_popular: 0,
      display_order: 1
    },
    {
      id: 'bulk-grading',
      name: 'Bulk Grading',
      slug: 'bulk-grading',
      price: 15,
      description: 'Cost-efficient grading for batch submissions, offering standard evaluation and consolidated reporting for multiple cards.',
      long_description: 'Designed for collectors, breakers, and sellers processing mid-volume submissions. Provides full grading evaluation with slab encapsulation, group-based QC, and consolidated reporting. Efficient batch workflow keeps costs competitive while maintaining consistent grading quality across all submitted cards.',
      features: '["Batch submission required","Discounted per-card pricing","Full grading included","Group QC handling","Bulk report delivery"]',
      specifications: '[{"spec_key":"","spec_value":"Standard scan resolution"},{"spec_key":"","spec_value":"Bulk report delivery"},{"spec_key":"","spec_value":"No subgrades default"},{"spec_key":"","spec_value":"Polycarbonate slab"},{"spec_key":"","spec_value":"Standard turnaround speed"},{"spec_key":"","spec_value":"Group packaging return"}]',
      trust_indicators: '[{"label":"Secure Processing","icon":"shield"},{"label":"Free Shipping","icon":"package"},{"label":"Guaranteed Quality","icon":"check"}]',
      icon_name: 'Guarantee',
      icon_url: '/storage/packages/icon-79f80d53-1b08-49fa-aabd-7320a1c2c8f3.png',
      image_url: '/storage/packages/image-c52f9bdc-ee7a-421f-88cd-5f5779e260fe.jpg',
      processing_time: 'Up to 20 Days',
      min_cards: 15,
      max_cards: null,
      is_active: 1,
      is_popular: 0,
      display_order: 2
    },
    {
      id: 'standard-grading',
      name: 'Standard Grading',
      slug: 'standard-grading',
      price: 25,
      description: 'Full grading service offering standard slab encapsulation and complete evaluation of card condition metrics.',
      long_description: 'A balanced grading solution evaluating centering, corners, edges, and surface through trained graders and calibrated tools. Includes robust slab encapsulation, serial labeling, and grading results accessible online. Ideal for collectors seeking a reliable, industry-aligned grading experience without premium costs or expedited handling.',
      features: '["Batch submission required","Discounted per-card pricing","Full grading included","Group QC handling","Bulk report delivery"]',
      specifications: '[{"spec_key":"","spec_value":"Standard scan resolution"},{"spec_key":"","spec_value":"Bulk report delivery"},{"spec_key":"","spec_value":"No subgrades default"},{"spec_key":"","spec_value":"Polycarbonate slab"},{"spec_key":"","spec_value":"Standard turnaround speed"},{"spec_key":"","spec_value":"Group packaging return"}]',
      trust_indicators: '[{"label":"Secure Processing","icon":"shield"},{"label":"Free Shipping","icon":"package"},{"label":"Guaranteed Quality","icon":"check"}]',
      icon_name: 'Guarantee',
      icon_url: '/storage/packages/icon-b129fc0d-a032-4ad4-a85f-e1e9c2388350.png',
      image_url: '/storage/packages/image-a76e131d-4e40-49b4-b0cd-5cfab7cd4b13.jpg',
      processing_time: 'Up to 20 Days',
      min_cards: 1,
      max_cards: null,
      is_active: 1,
      is_popular: 0,
      display_order: 2
    },
    {
      id: 'premium-grading',
      name: 'Premium Grading',
      slug: 'premium-grading',
      price: 45,
      description: 'Enhanced grading process with subgrades, upgraded materials, priority handling, and premium slab presentation.',
      long_description: 'A refined grading tier optimized for higher-value cards requiring deeper scrutiny. Includes detailed subgrades, priority pipeline handling, holographic labeling, and high-clarity slab materials. Cards receive advanced inspection and imaging, delivering upgraded visual presentation and improved collector trust in secondary markets.',
      features: '["Subgrades included","Priority queue handling","Holographic label finish","Premium slab clarity","Enhanced imaging detail"]',
      specifications: '[{"spec_key":"","spec_value":"Micro-scratch detection"},{"spec_key":"","spec_value":"4K surface scan"},{"spec_key":"","spec_value":"Dual-light analysis"},{"spec_key":"","spec_value":"Senior QC oversight"},{"spec_key":"","spec_value":"Polycarbonate premium slab"},{"spec_key":"","spec_value":"Barcode verification"}]',
      trust_indicators: '[{"label":"Secure Processing","icon":"shield"},{"label":"Free Shipping","icon":"package"},{"label":"Guaranteed Quality","icon":"check"}]',
      icon_name: 'Guarantee',
      icon_url: '/storage/packages/icon-23139b16-63e5-46af-85fe-2eef46d4aceb.png',
      image_url: '/storage/packages/image-c6099e7a-9106-49fd-96bf-94c61d1df5e6.jpg',
      processing_time: 'Up to 15 Days',
      min_cards: 1,
      max_cards: null,
      is_active: 1,
      is_popular: 0,
      display_order: 4
    }
  ]

  // Orders data
  const orders = [
    {
      id: 3,
      user_id: 4,
      order_number: 'TCG-1764986228167',
      package_id: 'bulk-grading',
      package_name: 'Bulk Grading',
      package_price: 15,
      total_cards: 15,
      subtotal: 225,
      tax: 18,
      shipping: 0,
      total: 243,
      status: 'pending',
      payment_status: 'paid',
      payment_method: null,
      stripe_payment_intent_id: 'pi_3SbAkCAa21WtdPpx0xy30G4F',
      tracking_number: null,
      estimated_completion: null,
      notes: '{"name":"Christopher Ramirez","email":"christopher@thevagroup.com","phone":"9358172730","address":"3066 Harrison Street","city":"Buskirk","state":"NY","zipCode":"12028","country":"United States"}'
    }
  ]

  // Order items data
  const orderItems = [
    {
      id: 3,
      order_id: 3,
      card_name: 'Bulk Grading',
      card_game: 'TCG Grading',
      card_type: null,
      card_rarity: null,
      card_number: null,
      card_image_url: null,
      quantity: 15,
      unit_price: 15,
      grade: null,
      grade_notes: null,
      is_custom: 0
    }
  ]

  db.serialize(() => {
    // Insert users
    const userStmt = db.prepare(`
      INSERT OR REPLACE INTO users (id, email, password_hash, first_name, last_name, phone, role, is_active, email_verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    users.forEach(user => {
      userStmt.run(user.id, user.email, user.password_hash, user.first_name, user.last_name, user.phone, user.role, user.is_active, user.email_verified)
    })
    userStmt.finalize()
    console.log(`  - Inserted ${users.length} users`)

    // Insert packages
    const pkgStmt = db.prepare(`
      INSERT OR REPLACE INTO packages (id, name, slug, price, description, long_description, features, specifications, trust_indicators, icon_name, icon_url, image_url, processing_time, min_cards, max_cards, is_active, is_popular, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    packages.forEach(pkg => {
      pkgStmt.run(pkg.id, pkg.name, pkg.slug, pkg.price, pkg.description, pkg.long_description, pkg.features, pkg.specifications, pkg.trust_indicators, pkg.icon_name, pkg.icon_url, pkg.image_url, pkg.processing_time, pkg.min_cards, pkg.max_cards, pkg.is_active, pkg.is_popular, pkg.display_order)
    })
    pkgStmt.finalize()
    console.log(`  - Inserted ${packages.length} packages`)

    // Insert orders
    const orderStmt = db.prepare(`
      INSERT OR REPLACE INTO orders (id, user_id, order_number, package_id, package_name, package_price, total_cards, subtotal, tax, shipping, total, status, payment_status, payment_method, stripe_payment_intent_id, tracking_number, estimated_completion, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    orders.forEach(order => {
      orderStmt.run(order.id, order.user_id, order.order_number, order.package_id, order.package_name, order.package_price, order.total_cards, order.subtotal, order.tax, order.shipping, order.total, order.status, order.payment_status, order.payment_method, order.stripe_payment_intent_id, order.tracking_number, order.estimated_completion, order.notes)
    })
    orderStmt.finalize()
    console.log(`  - Inserted ${orders.length} orders`)

    // Insert order items
    const itemStmt = db.prepare(`
      INSERT OR REPLACE INTO order_items (id, order_id, card_name, card_game, card_type, card_rarity, card_number, card_image_url, quantity, unit_price, grade, grade_notes, is_custom)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    orderItems.forEach(item => {
      itemStmt.run(item.id, item.order_id, item.card_name, item.card_game, item.card_type, item.card_rarity, item.card_number, item.card_image_url, item.quantity, item.unit_price, item.grade, item.grade_notes, item.is_custom)
    })
    itemStmt.finalize()
    console.log(`  - Inserted ${orderItems.length} order items`)

    // Verify data
    console.log('')
    console.log('Step 3: Verifying data...')

    db.get('SELECT COUNT(*) as count FROM users', [], (err, row) => {
      console.log(`  - Users: ${row.count}`)
    })

    db.get('SELECT COUNT(*) as count FROM packages', [], (err, row) => {
      console.log(`  - Packages: ${row.count}`)
    })

    db.get('SELECT COUNT(*) as count FROM orders', [], (err, row) => {
      console.log(`  - Orders: ${row.count}`)
    })

    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message)
      } else {
        console.log('')
        console.log('='.repeat(60))
        console.log('Database setup complete!')
        console.log('='.repeat(60))
        console.log('')
        console.log('Next steps:')
        console.log('  1. Restart Docker: docker-compose down && docker-compose up -d --build')
        console.log('  2. Check the app at your configured URL')
        console.log('')
      }
    })
  })
}
