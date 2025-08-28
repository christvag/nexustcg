const sqlite3 = require('sqlite3').verbose()
const bcrypt = require('bcryptjs')
const path = require('path')
const fs = require('fs')

const dbPath = path.join(__dirname, '..', 'database', 'user-management.db')
const schemaPath = path.join(__dirname, '..', 'database', 'user-management-schema.sql')

console.log('Initializing user management database...')

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

db.exec(schema, async (err) => {
  if (err) {
    console.error('Error executing schema:', err.message)
    process.exit(1)
  }
  
  console.log('Database schema created successfully')
  
  // Create dummy data
  try {
    await createDummyData()
    console.log('Dummy data created successfully')
  } catch (error) {
    console.error('Error creating dummy data:', error)
  } finally {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message)
      } else {
        console.log('Database connection closed')
      }
    })
  }
})

async function createDummyData() {
  console.log('Creating dummy users and orders...')
  
  // Hash password for dummy users
  const hashedPassword = await bcrypt.hash('password123', 12)
  
  // Create 5 dummy users
  const users = [
    {
      email: 'john.doe@example.com',
      password_hash: hashedPassword,
      first_name: 'John',
      last_name: 'Doe',
      phone: '+1-555-0123',
      role: 'user'
    },
    {
      email: 'jane.smith@example.com',
      password_hash: hashedPassword,
      first_name: 'Jane',
      last_name: 'Smith',
      phone: '+1-555-0124',
      role: 'user'
    },
    {
      email: 'mike.johnson@example.com',
      password_hash: hashedPassword,
      first_name: 'Mike',
      last_name: 'Johnson',
      phone: '+1-555-0125',
      role: 'user'
    },
    {
      email: 'sarah.wilson@example.com',
      password_hash: hashedPassword,
      first_name: 'Sarah',
      last_name: 'Wilson',
      phone: '+1-555-0126',
      role: 'user'
    },
    {
      email: 'admin@nexustcg.com',
      password_hash: hashedPassword,
      first_name: 'Admin',
      last_name: 'User',
      phone: '+1-555-0100',
      role: 'admin'
    }
  ]
  
  // Insert users
  const userInsertPromises = users.map((user, index) => {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO users (email, password_hash, first_name, last_name, phone, role, email_verified, is_active)
        VALUES (?, ?, ?, ?, ?, ?, 1, 1)
      `
      
      db.run(sql, [
        user.email,
        user.password_hash,
        user.first_name,
        user.last_name,
        user.phone,
        user.role
      ], function(err) {
        if (err) {
          reject(err)
        } else {
          console.log(`Created user: ${user.email} (ID: ${this.lastID})`)
          resolve(this.lastID)
        }
      })
    })
  })
  
  const userIds = await Promise.all(userInsertPromises)
  
  // Create user addresses
  const addresses = [
    {
      user_id: userIds[0],
      type: 'shipping',
      first_name: 'John',
      last_name: 'Doe',
      address_line1: '123 Main Street',
      city: 'New York',
      state: 'NY',
      postal_code: '10001',
      country: 'US',
      is_default: 1
    },
    {
      user_id: userIds[1],
      type: 'shipping',
      first_name: 'Jane',
      last_name: 'Smith',
      address_line1: '456 Oak Avenue',
      city: 'Los Angeles',
      state: 'CA',
      postal_code: '90210',
      country: 'US',
      is_default: 1
    },
    {
      user_id: userIds[2],
      type: 'shipping',
      first_name: 'Mike',
      last_name: 'Johnson',
      address_line1: '789 Pine Road',
      city: 'Chicago',
      state: 'IL',
      postal_code: '60601',
      country: 'US',
      is_default: 1
    }
  ]
  
  // Insert addresses
  for (const address of addresses) {
    await new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO user_addresses (
          user_id, type, first_name, last_name, address_line1, 
          city, state, postal_code, country, is_default
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      
      db.run(sql, [
        address.user_id,
        address.type,
        address.first_name,
        address.last_name,
        address.address_line1,
        address.city,
        address.state,
        address.postal_code,
        address.country,
        address.is_default
      ], function(err) {
        if (err) {
          reject(err)
        } else {
          console.log(`Created address for user ${address.user_id}`)
          resolve(this.lastID)
        }
      })
    })
  }
  
  // Create 10 sample orders
  const orders = [
    {
      user_id: userIds[0],
      package_id: 'standard',
      package_name: 'Standard',
      package_price: 15.00,
      total_cards: 5,
      subtotal: 75.00,
      tax: 6.75,
      shipping: 5.99,
      total: 87.74,
      status: 'pending',
      payment_status: 'pending'
    },
    {
      user_id: userIds[1],
      package_id: 'express',
      package_name: 'Express',
      package_price: 20.00,
      total_cards: 3,
      subtotal: 60.00,
      tax: 5.40,
      shipping: 9.99,
      total: 75.39,
      status: 'received',
      payment_status: 'paid'
    },
    {
      user_id: userIds[2],
      package_id: 'bulk',
      package_name: 'Bulk Grading',
      package_price: 12.00,
      total_cards: 10,
      subtotal: 120.00,
      tax: 10.80,
      shipping: 7.99,
      total: 138.79,
      status: 'in_progress',
      payment_status: 'paid'
    },
    {
      user_id: userIds[0],
      package_id: 'authentication',
      package_name: 'Authentication',
      package_price: 10.00,
      total_cards: 2,
      subtotal: 20.00,
      tax: 1.80,
      shipping: 5.99,
      total: 27.79,
      status: 'grading',
      payment_status: 'paid'
    },
    {
      user_id: userIds[3],
      package_id: 'standard',
      package_name: 'Standard',
      package_price: 15.00,
      total_cards: 7,
      subtotal: 105.00,
      tax: 9.45,
      shipping: 5.99,
      total: 120.44,
      status: 'completed',
      payment_status: 'paid'
    },
    {
      user_id: userIds[1],
      package_id: 'express',
      package_name: 'Express',
      package_price: 20.00,
      total_cards: 1,
      subtotal: 20.00,
      tax: 1.80,
      shipping: 9.99,
      total: 31.79,
      status: 'shipped',
      payment_status: 'paid'
    },
    {
      user_id: userIds[2],
      package_id: 'standard',
      package_name: 'Standard',
      package_price: 15.00,
      total_cards: 4,
      subtotal: 60.00,
      tax: 5.40,
      shipping: 5.99,
      total: 71.39,
      status: 'delivered',
      payment_status: 'paid'
    },
    {
      user_id: userIds[0],
      package_id: 'bulk',
      package_name: 'Bulk Grading',
      package_price: 12.00,
      total_cards: 15,
      subtotal: 180.00,
      tax: 16.20,
      shipping: 7.99,
      total: 204.19,
      status: 'pending',
      payment_status: 'pending'
    },
    {
      user_id: userIds[3],
      package_id: 'express',
      package_name: 'Express',
      package_price: 20.00,
      total_cards: 6,
      subtotal: 120.00,
      tax: 10.80,
      shipping: 9.99,
      total: 140.79,
      status: 'received',
      payment_status: 'paid'
    },
    {
      user_id: userIds[1],
      package_id: 'authentication',
      package_name: 'Authentication',
      package_price: 10.00,
      total_cards: 8,
      subtotal: 80.00,
      tax: 7.20,
      shipping: 5.99,
      total: 93.19,
      status: 'in_progress',
      payment_status: 'paid'
    }
  ]
  
  // Insert orders and their items
  for (let i = 0; i < orders.length; i++) {
    const order = orders[i]
    const orderNumber = `TCG-${Date.now() + i}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
    
    const orderId = await new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO orders (
          user_id, order_number, package_id, package_name, package_price,
          total_cards, subtotal, tax, shipping, total, status, payment_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      
      db.run(sql, [
        order.user_id,
        orderNumber,
        order.package_id,
        order.package_name,
        order.package_price,
        order.total_cards,
        order.subtotal,
        order.tax,
        order.shipping,
        order.total,
        order.status,
        order.payment_status
      ], function(err) {
        if (err) {
          reject(err)
        } else {
          console.log(`Created order: ${orderNumber} (ID: ${this.lastID})`)
          resolve(this.lastID)
        }
      })
    })
    
    // Create sample cards for each order
    const sampleCards = [
      'Ancient Gear Golem',
      'Blue-Eyes White Dragon',
      'Dark Magician',
      'Lightning Bolt',
      'Black Lotus',
      'Charizard',
      'Pikachu',
      'Red-Eyes Black Dragon'
    ]
    
    // Add order items
    for (let j = 0; j < order.total_cards; j++) {
      const cardName = sampleCards[Math.floor(Math.random() * sampleCards.length)]
      const games = ['Yu-Gi-Oh', 'Magic The Gathering', 'Pokemon TCG']
      const cardGame = games[Math.floor(Math.random() * games.length)]
      
      await new Promise((resolve, reject) => {
        const sql = `
          INSERT INTO order_items (
            order_id, card_name, card_game, card_type, card_rarity, 
            card_number, quantity, unit_price, is_custom
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
        
        db.run(sql, [
          orderId,
          cardName,
          cardGame,
          'Creature',
          'Rare',
          `${Math.floor(Math.random() * 999) + 1}`,
          1,
          order.package_price,
          0
        ], function(err) {
          if (err) {
            reject(err)
          } else {
            resolve(this.lastID)
          }
        })
      })
    }
  }
  
  console.log('All dummy data created successfully!')
  console.log('\\n=== LOGIN CREDENTIALS ===')
  console.log('Users (password: password123):')
  users.forEach(user => {
    console.log(`- ${user.email} (${user.role})`)
  })
}