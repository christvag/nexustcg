import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { query } from './database'
import type { User } from './database'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export interface AuthUser {
  id: string
  email: string
  role: 'user' | 'admin' | 'staff'
  first_name?: string
  last_name?: string
}

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

// Verify password
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash)
}

// Generate JWT token
export const generateToken = (user: AuthUser): string => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

// Verify JWT token
export const verifyToken = (token: string): AuthUser | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser
    return decoded
  } catch (error) {
    return null
  }
}

// Register user
export const registerUser = async (
  email: string,
  password: string,
  first_name?: string,
  last_name?: string,
  phone?: string
): Promise<AuthUser> => {
  // Check if user already exists
  const existingUser = await query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  )

  if (existingUser.rows.length > 0) {
    throw new Error('User already exists')
  }

  // Hash password
  const password_hash = await hashPassword(password)

  // Insert new user
  const result = await query(
    `INSERT INTO users (email, password_hash, first_name, last_name, phone) 
     VALUES ($1, $2, $3, $4, $5) 
     RETURNING id, email, role, first_name, last_name`,
    [email, password_hash, first_name, last_name, phone]
  )

  return result.rows[0]
}

// Login user
export const loginUser = async (email: string, password: string): Promise<{ user: AuthUser; token: string }> => {
  // Get user from database
  const result = await query(
    'SELECT id, email, password_hash, role, first_name, last_name FROM users WHERE email = $1 AND is_active = true',
    [email]
  )

  if (result.rows.length === 0) {
    throw new Error('Invalid credentials')
  }

  const user = result.rows[0]

  // Verify password
  const isValidPassword = await verifyPassword(password, user.password_hash)
  if (!isValidPassword) {
    throw new Error('Invalid credentials')
  }

  // Update last login
  await query(
    'UPDATE users SET last_login = NOW() WHERE id = $1',
    [user.id]
  )

  // Create auth user object
  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    role: user.role,
    first_name: user.first_name,
    last_name: user.last_name,
  }

  // Generate token
  const token = generateToken(authUser)

  return { user: authUser, token }
}

// Get user by ID
export const getUserById = async (userId: string): Promise<User | null> => {
  const result = await query(
    'SELECT * FROM users WHERE id = $1',
    [userId]
  )

  return result.rows.length > 0 ? result.rows[0] : null
}

// Update user profile
export const updateUserProfile = async (
  userId: string,
  updates: Partial<Pick<User, 'first_name' | 'last_name' | 'phone' | 'shipping_address'>>
): Promise<User> => {
  const fields = []
  const values = []
  let paramCount = 1

  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      fields.push(`${key} = $${paramCount}`)
      values.push(key === 'shipping_address' ? JSON.stringify(value) : value)
      paramCount++
    }
  })

  if (fields.length === 0) {
    throw new Error('No fields to update')
  }

  values.push(userId)

  const result = await query(
    `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() 
     WHERE id = $${paramCount} 
     RETURNING *`,
    values
  )

  return result.rows[0]
}

// Check if user has permission
export const checkPermission = (userRole: string, requiredRoles: string[]): boolean => {
  return requiredRoles.includes(userRole)
}

// Middleware function to extract user from request
export const extractUserFromToken = (authHeader: string | null | undefined): AuthUser | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  return verifyToken(token)
}