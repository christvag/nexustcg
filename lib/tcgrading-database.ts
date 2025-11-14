import Database from 'better-sqlite3'
import path from 'path'
import bcrypt from 'bcrypt'

const dbPath = path.join(process.cwd(), 'database', 'tcgrading.db')
let db: Database.Database | null = null

export function getDb() {
  if (!db) {
    db = new Database(dbPath)
    db.pragma('foreign_keys = ON')
  }
  return db
}

// User management functions
export interface User {
  id: number
  first_name: string
  last_name: string
  email: string
  phone?: string
  role: 'user' | 'admin' | 'staff'
  created_at: string
  updated_at: string
  last_login?: string
  is_active: boolean
}

export interface CreateUserData {
  first_name: string
  last_name: string
  email: string
  phone?: string
  password: string
  role?: 'user' | 'admin' | 'staff'
}

export async function createUser(userData: CreateUserData): Promise<User> {
  const database = getDb()
  const hashedPassword = await bcrypt.hash(userData.password, 10)
  
  const stmt = database.prepare(`
    INSERT INTO users (first_name, last_name, email, phone, password, role)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  
  const result = stmt.run(
    userData.first_name,
    userData.last_name,
    userData.email,
    userData.phone || null,
    hashedPassword,
    userData.role || 'user'
  )
  
  return getUserById(result.lastInsertRowid as number)!
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const database = getDb()
  const stmt = database.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1')
  const user = stmt.get(email) as any
  
  if (!user) return null
  
  const isValid = await bcrypt.compare(password, user.password)
  if (!isValid) return null
  
  // Update last login
  const updateStmt = database.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?')
  updateStmt.run(user.id)
  
  const { password: _, ...userWithoutPassword } = user
  return userWithoutPassword as User
}

export function getUserById(id: number): User | null {
  const database = getDb()
  const stmt = database.prepare('SELECT * FROM users WHERE id = ? AND is_active = 1')
  const user = stmt.get(id) as any
  
  if (!user) return null
  
  const { password, ...userWithoutPassword } = user
  return userWithoutPassword as User
}

export function getUserByEmail(email: string): User | null {
  const database = getDb()
  const stmt = database.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1')
  const user = stmt.get(email) as any
  
  if (!user) return null
  
  const { password, ...userWithoutPassword } = user
  return userWithoutPassword as User
}

export function getAllUsers(): User[] {
  const database = getDb()
  const stmt = database.prepare('SELECT * FROM users WHERE is_active = 1 ORDER BY created_at DESC')
  const users = stmt.all() as any[]
  
  return users.map(user => {
    const { password, ...userWithoutPassword } = user
    return userWithoutPassword as User
  })
}

// Order management functions
export interface Order {
  id: number
  user_id?: number
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
  payment_intent_id?: string
  payment_method: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  shipping_address: string
  shipping_city: string
  shipping_state: string
  shipping_zip: string
  shipping_country: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface CreateOrderData {
  user_id?: number
  package_id: string
  package_name: string
  package_price: number
  total_cards: number
  subtotal: number
  tax: number
  shipping: number
  total: number
  payment_intent_id?: string
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
  customer_info: {
    name: string
    email: string
    phone?: string
    address: string
    city: string
    state: string
    zipCode: string
    country?: string
  }
  cards: any[]
}

export function createOrder(orderData: CreateOrderData): Order {
  const database = getDb()
  const orderNumber = `TCG-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
  
  // Start transaction
  const transaction = database.transaction((orderData: CreateOrderData) => {
    // Check if user exists (if user_id provided)
    let validUserId = null
    if (orderData.user_id) {
      const userCheck = database.prepare('SELECT id FROM users WHERE id = ?').get(orderData.user_id)
      if (userCheck) {
        validUserId = orderData.user_id
      }
    }
    
    // Insert order
    const orderStmt = database.prepare(`
      INSERT INTO orders (
        user_id, order_number, package_id, package_name, package_price,
        total_cards, subtotal, tax, shipping, total, payment_status,
        payment_intent_id, customer_name, customer_email, customer_phone,
        shipping_address, shipping_city, shipping_state, shipping_zip, shipping_country
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    const orderResult = orderStmt.run(
      validUserId,
      orderNumber,
      orderData.package_id,
      orderData.package_name,
      orderData.package_price,
      orderData.total_cards,
      orderData.subtotal,
      orderData.tax,
      orderData.shipping,
      orderData.total,
      orderData.payment_status || 'pending',
      orderData.payment_intent_id || null,
      orderData.customer_info.name,
      orderData.customer_info.email,
      orderData.customer_info.phone || null,
      orderData.customer_info.address,
      orderData.customer_info.city,
      orderData.customer_info.state,
      orderData.customer_info.zipCode,
      orderData.customer_info.country || 'United States'
    )
    
    const orderId = orderResult.lastInsertRowid as number
    
    // Insert order items
    const itemStmt = database.prepare(`
      INSERT INTO order_items (
        order_id, card_id, card_name, card_game, card_type, card_rarity,
        card_number, card_set, image_url, quantity, unit_price, total_price
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    for (const card of orderData.cards) {
      itemStmt.run(
        orderId,
        card.card.id,
        card.card.name,
        card.card.game,
        card.card.type,
        card.selectedRarity || card.card.rarity,
        card.card.number,
        card.selectedSet || card.card.type,
        card.card.imageUrl,
        card.quantity,
        orderData.package_price,
        orderData.package_price * card.quantity
      )
    }
    
    return orderId
  })
  
  const orderId = transaction(orderData)
  return getOrderById(orderId)!
}

export function getOrderById(id: number): Order | null {
  const database = getDb()
  const stmt = database.prepare('SELECT * FROM orders WHERE id = ?')
  return stmt.get(id) as Order | null
}

export function getOrdersByUserId(userId: number): Order[] {
  const database = getDb()
  const stmt = database.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC')
  return stmt.all(userId) as Order[]
}

export function getAllOrders(limit: number = 100, offset: number = 0): Order[] {
  const database = getDb()
  const stmt = database.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT ? OFFSET ?')
  return stmt.all(limit, offset) as Order[]
}

export function updateOrderStatus(orderId: number, status: Order['status'], notes?: string): boolean {
  const database = getDb()
  
  // Get current order
  const currentOrder = getOrderById(orderId)
  if (!currentOrder) return false
  
  // Start transaction
  const transaction = database.transaction((orderId: number, status: Order['status'], notes?: string) => {
    // Update order status
    const updateStmt = database.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    updateStmt.run(status, orderId)
    
    // Add to status history
    const historyStmt = database.prepare(`
      INSERT INTO order_status_history (order_id, old_status, new_status, notes)
      VALUES (?, ?, ?, ?)
    `)
    historyStmt.run(orderId, currentOrder.status, status, notes || null)
  })
  
  transaction(orderId, status, notes)
  return true
}

// Order items functions
export interface OrderItem {
  id: number
  order_id: number
  card_id: string
  card_name: string
  card_game: string
  card_type?: string
  card_rarity?: string
  card_number?: string
  card_set?: string
  image_url?: string
  quantity: number
  unit_price: number
  total_price: number
  grading_status: 'pending' | 'received' | 'grading' | 'graded' | 'shipped'
  grade?: string
  grade_notes?: string
  created_at: string
  updated_at: string
}

export function getOrderItems(orderId: number): OrderItem[] {
  const database = getDb()
  const stmt = database.prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at')
  return stmt.all(orderId) as OrderItem[]
}

export function updateOrderItemGrade(itemId: number, grade: string, notes?: string): boolean {
  const database = getDb()
  const stmt = database.prepare(`
    UPDATE order_items 
    SET grade = ?, grade_notes = ?, grading_status = 'graded', updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `)
  const result = stmt.run(grade, notes || null, itemId)
  return result.changes > 0
}

// Analytics and reporting functions
export interface DashboardStats {
  totalUsers: number
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  completedOrders: number
  cardsGraded: number
  popularCards: Array<{
    card_name: string
    card_game: string
    search_count: number
    order_count: number
  }>
}

export function getDashboardStats(): DashboardStats {
  const database = getDb()
  
  const totalUsers = database.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 1').get() as any
  const totalOrders = database.prepare('SELECT COUNT(*) as count FROM orders').get() as any
  const revenue = database.prepare("SELECT SUM(total) as revenue FROM orders WHERE payment_status = 'paid'").get() as any
  const pendingOrders = database.prepare("SELECT COUNT(*) as count FROM orders WHERE status IN ('pending', 'received', 'in_progress', 'grading')").get() as any
  const completedOrders = database.prepare("SELECT COUNT(*) as count FROM orders WHERE status IN ('completed', 'shipped', 'delivered')").get() as any
  const cardsGraded = database.prepare("SELECT COUNT(*) as count FROM order_items WHERE grading_status = 'graded'").get() as any
  const popularCards = database.prepare(`
    SELECT card_name, card_game, search_count, order_count 
    FROM card_popularity 
    ORDER BY order_count DESC, search_count DESC 
    LIMIT 10
  `).all() as any[]
  
  return {
    totalUsers: totalUsers.count,
    totalOrders: totalOrders.count,
    totalRevenue: revenue.revenue || 0,
    pendingOrders: pendingOrders.count,
    completedOrders: completedOrders.count,
    cardsGraded: cardsGraded.count,
    popularCards
  }
}

export function trackCardSearch(cardName: string, cardGame: string): void {
  const database = getDb()
  const stmt = database.prepare(`
    INSERT INTO card_popularity (card_name, card_game, search_count, last_searched)
    VALUES (?, ?, 1, CURRENT_TIMESTAMP)
    ON CONFLICT(card_name, card_game) DO UPDATE SET
      search_count = search_count + 1,
      last_searched = CURRENT_TIMESTAMP
  `)
  stmt.run(cardName, cardGame)
}

export function trackCardOrder(cardName: string, cardGame: string): void {
  const database = getDb()
  const stmt = database.prepare(`
    INSERT INTO card_popularity (card_name, card_game, order_count)
    VALUES (?, ?, 1)
    ON CONFLICT(card_name, card_game) DO UPDATE SET
      order_count = order_count + 1
  `)
  stmt.run(cardName, cardGame)
}