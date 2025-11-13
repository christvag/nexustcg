import { Pool, PoolClient } from 'pg'

// Database connection pool
let pool: Pool | null = null

const getPool = (): Pool => {
  if (!pool) {
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'tcg_grading', 
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })

    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err)
      process.exit(-1)
    })
  }
  return pool
}

// Generic query function
export const query = async (text: string, params?: any[]): Promise<any> => {
  const pool = getPool()
  const client = await pool.connect()
  
  try {
    const result = await client.query(text, params)
    return result
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  } finally {
    client.release()
  }
}

// Transaction wrapper
export const transaction = async (callback: (client: PoolClient) => Promise<any>): Promise<any> => {
  const pool = getPool()
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Transaction error:', error)
    throw error
  } finally {
    client.release()
  }
}

// Close database connection
export const closeConnection = async (): Promise<void> => {
  if (pool) {
    await pool.end()
    pool = null
  }
}

// Database models and types
export interface User {
  id: string
  email: string
  password_hash?: string
  role: 'user' | 'admin' | 'staff'
  first_name?: string
  last_name?: string
  phone?: string
  shipping_address?: any
  created_at: Date
  updated_at: Date
  last_login?: Date
  is_active: boolean
}

export interface Order {
  id: string
  user_id: string
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
  estimated_completion?: Date
  notes?: string
  created_at: Date
  updated_at: Date
}

export interface OrderItem {
  id: string
  order_id: string
  card_name: string
  card_game: string
  card_type?: string
  card_rarity?: string
  card_number?: string
  quantity: number
  unit_price: number
  grade?: number
  grade_notes?: string
  is_custom: boolean
  created_at: Date
}

export interface ChatMessage {
  id: string
  order_id: string
  user_id: string
  sender_type: 'user' | 'staff' | 'admin'
  message: string
  is_read: boolean
  created_at: Date
}

export interface Payment {
  id: string
  order_id: string
  stripe_payment_intent_id?: string
  amount: number
  currency: string
  status: string
  payment_method?: string
  created_at: Date
  updated_at: Date
}