import sqlite3 from 'sqlite3'
import Database from 'better-sqlite3'
import path from 'path'
import bcrypt from 'bcryptjs'

// Database connection (async for backward compatibility)
let db: sqlite3.Database | null = null
// Synchronous database connection
let syncDb: Database.Database | null = null

const getDatabasePath = () => {
  // Path to the user management database
  return path.join(process.cwd(), 'database', 'user-management.db')
}

const getDatabase = (): sqlite3.Database => {
  if (!db) {
    const dbPath = getDatabasePath()
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening user database:', err.message)
        throw err
      }
      console.log('Connected to the user management SQLite database.')
    })

    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON')
  }
  return db
}

const getSyncDatabase = (): Database.Database => {
  if (!syncDb) {
    const dbPath = getDatabasePath()
    syncDb = new Database(dbPath)
    syncDb.pragma('foreign_keys = ON')
    console.log('Connected to the user management SQLite database (sync).')
  }
  return syncDb
}

// User interface
export interface User {
  id: number
  email: string
  password_hash?: string
  first_name: string
  last_name: string
  phone: string | null
  role: 'user' | 'admin' | 'staff'
  is_active: boolean
  created_at: string
  updated_at: string
  last_login: string | null
  email_verified: boolean
}

// Order interface
export interface Order {
  id: number
  user_id: number
  order_number: string
  package_id: string
  package_name: string
  package_price: number
  total_cards: number
  subtotal: number
  tax: number
  shipping: number
  total: number
  status: 'pending' | 'received' | 'in_progress' | 'grading' | 'completed' | 'shipped' | 'delivered' | 'cancelled'
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  payment_method?: string
  stripe_payment_intent_id?: string
  tracking_number?: string
  estimated_completion?: string
  notes?: string
  created_at: string
  updated_at: string
}

// Order item interface
export interface OrderItem {
  id: number
  order_id: number
  card_name: string
  card_game: string
  card_type?: string
  card_rarity?: string
  card_number?: string
  card_image_url?: string
  quantity: number
  unit_price: number
  grade?: number
  grade_notes?: string
  is_custom: boolean
  created_at: string
}

// User address interface
export interface UserAddress {
  id: number
  user_id: number
  type: 'shipping' | 'billing'
  first_name: string
  last_name: string
  company?: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  postal_code: string
  country: string
  is_default: boolean
  created_at: string
  updated_at: string
}

// Initialize database with schema
export const initializeDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const database = getDatabase()
    const fs = require('fs')
    const schemaPath = path.join(process.cwd(), 'database', 'user-management-schema.sql')
    
    fs.readFile(schemaPath, 'utf8', (err: any, schema: string) => {
      if (err) {
        console.error('Error reading schema file:', err)
        reject(err)
        return
      }
      
      database.exec(schema, (err) => {
        if (err) {
          console.error('Error initializing database:', err)
          reject(err)
          return
        }
        
        console.log('Database initialized successfully')
        resolve()
      })
    })
  })
}

// User management functions - v3 (NEW SYNC VERSION)
export const createUserSync = async (userData: {
  email: string
  password: string
  first_name: string
  last_name: string
  username?: string
  phone?: string
  role?: 'user' | 'admin' | 'staff'
}): Promise<User> => {
  console.log('[createUserSync v3] Starting SYNC user creation')
  try {
    const database = getSyncDatabase()
    const hashedPassword = await bcrypt.hash(userData.password, 12)

    const sql = `
      INSERT INTO users (email, password_hash, first_name, last_name, username, phone, role)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `

    console.log('[createUserSync] Creating user with email:', userData.email)

    const result = database.prepare(sql).run(
      userData.email,
      hashedPassword,
      userData.first_name,
      userData.last_name,
      userData.username || null,
      userData.phone || null,
      userData.role || 'user'
    )

    const userId = result.lastInsertRowid as number
    console.log('[createUserSync] User created with ID:', userId)

    // Query the newly created user
    const selectSql = 'SELECT * FROM users WHERE id = ?'
    const user = database.prepare(selectSql).get(userId) as User

    if (!user) {
      console.error('[createUserSync] User not found after creation, ID:', userId)
      throw new Error('User not found after creation')
    }

    console.log('[createUserSync] Successfully created and retrieved user:', user.email)
    return user
  } catch (error) {
    console.error('[createUserSync] Error:', error)
    throw error
  }
}

// User management functions - v2 (DEPRECATED - keeping for backwards compatibility)
export const createUser = async (userData: {
  email: string
  password: string
  first_name: string
  last_name: string
  username?: string
  phone?: string
  role?: 'user' | 'admin' | 'staff'
}): Promise<User> => {
  // Redirect to new sync version
  return createUserSync(userData)
}

export const getUserById = (id: number): Promise<User> => {
  return new Promise((resolve, reject) => {
    const database = getDatabase()
    const sql = 'SELECT * FROM users WHERE id = ?'
    
    database.get(sql, [id], (err, row: User) => {
      if (err) {
        console.error('Error getting user by ID:', err.message)
        reject(err)
        return
      }
      
      if (!row) {
        reject(new Error('User not found'))
        return
      }
      
      resolve(row)
    })
  })
}

export const getUserByEmail = (email: string): Promise<User> => {
  return new Promise((resolve, reject) => {
    const database = getDatabase()
    const sql = 'SELECT * FROM users WHERE email = ?'
    
    database.get(sql, [email], (err, row: User) => {
      if (err) {
        console.error('Error getting user by email:', err.message)
        reject(err)
        return
      }
      
      if (!row) {
        reject(new Error('User not found'))
        return
      }
      
      resolve(row)
    })
  })
}

export const updateUser = (id: number, updates: Partial<User>): Promise<User> => {
  return new Promise((resolve, reject) => {
    const database = getDatabase()
    const updateFields = Object.keys(updates).filter(key => key !== 'id')
    const setClause = updateFields.map(field => `${field} = ?`).join(', ')
    const values = updateFields.map(field => (updates as any)[field])
    
    if (updateFields.length === 0) {
      getUserById(id).then(resolve).catch(reject)
      return
    }
    
    const sql = `UPDATE users SET ${setClause} WHERE id = ?`
    values.push(id)
    
    database.run(sql, values, (err) => {
      if (err) {
        console.error('Error updating user:', err.message)
        reject(err)
        return
      }
      
      getUserById(id).then(resolve).catch(reject)
    })
  })
}

export const getAllUsers = (limit: number = 100, offset: number = 0): Promise<User[]> => {
  return new Promise((resolve, reject) => {
    const database = getDatabase()
    const sql = 'SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?'
    
    database.all(sql, [limit, offset], (err, rows: User[]) => {
      if (err) {
        console.error('Error getting all users:', err.message)
        reject(err)
        return
      }
      
      resolve(rows)
    })
  })
}

// Order management functions
export const createOrder = (orderData: {
  user_id: number
  package_id: string
  package_name: string
  package_price: number
  total_cards: number
  subtotal: number
  tax?: number
  shipping?: number
  total: number
  items: Array<{
    card_name: string
    card_game: string
    card_type?: string
    card_rarity?: string
    card_number?: string
    card_image_url?: string
    quantity: number
    unit_price: number
    is_custom?: boolean
  }>
}): Promise<Order> => {
  return new Promise((resolve, reject) => {
    const database = getDatabase()
    const orderNumber = 'TCG-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase()
    
    database.serialize(() => {
      database.run('BEGIN TRANSACTION')
      
      // Insert order
      const orderSql = `
        INSERT INTO orders (
          user_id, order_number, package_id, package_name, package_price,
          total_cards, subtotal, tax, shipping, total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      
      database.run(orderSql, [
        orderData.user_id,
        orderNumber,
        orderData.package_id,
        orderData.package_name,
        orderData.package_price,
        orderData.total_cards,
        orderData.subtotal,
        orderData.tax || 0,
        orderData.shipping || 0,
        orderData.total
      ], function(err) {
        if (err) {
          database.run('ROLLBACK')
          reject(err)
          return
        }
        
        const orderId = this.lastID
        
        // Insert order items
        const itemSql = `
          INSERT INTO order_items (
            order_id, card_name, card_game, card_type, card_rarity,
            card_number, card_image_url, quantity, unit_price, is_custom
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
        
        let itemsProcessed = 0
        const totalItems = orderData.items.length
        
        if (totalItems === 0) {
          database.run('COMMIT')
          getOrderById(orderId).then(resolve).catch(reject)
          return
        }
        
        orderData.items.forEach((item) => {
          database.run(itemSql, [
            orderId,
            item.card_name,
            item.card_game,
            item.card_type || null,
            item.card_rarity || null,
            item.card_number || null,
            item.card_image_url || null,
            item.quantity,
            item.unit_price,
            item.is_custom || false
          ], (err) => {
            if (err) {
              database.run('ROLLBACK')
              reject(err)
              return
            }
            
            itemsProcessed++
            if (itemsProcessed === totalItems) {
              database.run('COMMIT')
              getOrderById(orderId).then(resolve).catch(reject)
            }
          })
        })
      })
    })
  })
}

export const getOrderById = (id: number): Promise<Order> => {
  return new Promise((resolve, reject) => {
    const database = getDatabase()
    const sql = 'SELECT * FROM orders WHERE id = ?'
    
    database.get(sql, [id], (err, row: Order) => {
      if (err) {
        console.error('Error getting order by ID:', err.message)
        reject(err)
        return
      }
      
      if (!row) {
        reject(new Error('Order not found'))
        return
      }
      
      resolve(row)
    })
  })
}

export const getOrdersByUserId = (userId: number): Promise<Order[]> => {
  return new Promise((resolve, reject) => {
    const database = getDatabase()
    const sql = 'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC'
    
    database.all(sql, [userId], (err, rows: Order[]) => {
      if (err) {
        console.error('Error getting orders by user ID:', err.message)
        reject(err)
        return
      }
      
      resolve(rows)
    })
  })
}

export const getAllOrders = (limit: number = 100, offset: number = 0): Promise<Order[]> => {
  return new Promise((resolve, reject) => {
    const database = getDatabase()
    const sql = `
      SELECT o.*, u.first_name, u.last_name, u.email 
      FROM orders o 
      JOIN users u ON o.user_id = u.id 
      ORDER BY o.created_at DESC 
      LIMIT ? OFFSET ?
    `
    
    database.all(sql, [limit, offset], (err, rows: any[]) => {
      if (err) {
        console.error('Error getting all orders:', err.message)
        reject(err)
        return
      }
      
      resolve(rows)
    })
  })
}

export const getOrderItems = (orderId: number): Promise<OrderItem[]> => {
  return new Promise((resolve, reject) => {
    const database = getDatabase()
    const sql = 'SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at ASC'
    
    database.all(sql, [orderId], (err, rows: OrderItem[]) => {
      if (err) {
        console.error('Error getting order items:', err.message)
        reject(err)
        return
      }
      
      resolve(rows)
    })
  })
}

export const updateOrderStatus = (orderId: number, status: Order['status'], notes?: string): Promise<Order> => {
  return new Promise((resolve, reject) => {
    const database = getDatabase()
    const sql = 'UPDATE orders SET status = ? WHERE id = ?'
    
    database.run(sql, [status, orderId], (err) => {
      if (err) {
        console.error('Error updating order status:', err.message)
        reject(err)
        return
      }
      
      getOrderById(orderId).then(resolve).catch(reject)
    })
  })
}

// Generic query execution utility
export const runQuery = (sql: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const database = getDatabase()
    database.all(sql, params, (err, rows: any[]) => {
      if (err) {
        console.error('Error executing query:', err.message)
        reject(err)
        return
      }
      resolve(rows || [])
    })
  })
}

// Single row query execution utility
export const runQuerySingle = (sql: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    const database = getDatabase()
    database.get(sql, params, (err, row: any) => {
      if (err) {
        console.error('Error executing single query:', err.message)
        reject(err)
        return
      }
      resolve(row)
    })
  })
}

// Close database connection
export const closeDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message)
          reject(err)
          return
        }
        console.log('User database connection closed.')
        db = null
        resolve()
      })
    } else {
      resolve()
    }
  })
}