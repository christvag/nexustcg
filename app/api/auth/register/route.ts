import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import path from 'path'

const JWT_SECRET = process.env.JWT_SECRET || 'nexus-tcgrading-secret-key-2024'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { first_name, last_name, email, phone, password } = body

    console.log('[Register API] Starting registration for:', email)

    // Validation
    if (!email || !password || !first_name || !last_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Initialize database connection
    const dbPath = path.join(process.cwd(), 'database', 'user-management.db')
    const db = new Database(dbPath)
    db.pragma('foreign_keys = ON')

    // Check if user already exists (DIRECT QUERY - bypass cached module)
    const checkSql = 'SELECT * FROM users WHERE email = ?'
    const existingUser = db.prepare(checkSql).get(email) as any

    if (existingUser) {
      db.close()
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 409 }
      )
    }

    console.log('[Register API] User does not exist, creating new user')
    console.log('[Register API] Database path:', dbPath)

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)
    console.log('[Register API] Password hashed')

    const insertSql = `
      INSERT INTO users (email, password_hash, first_name, last_name, phone, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `

    const result = db.prepare(insertSql).run(
      email,
      hashedPassword,
      first_name,
      last_name,
      phone || null,
      'user'
    )

    const userId = result.lastInsertRowid as number
    console.log('[Register API] User inserted with ID:', userId)

    // Query the newly created user
    const selectSql = 'SELECT * FROM users WHERE id = ?'
    const user = db.prepare(selectSql).get(userId) as any

    db.close()

    if (!user) {
      console.error('[Register API] User not found after creation, ID:', userId)
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    console.log('[Register API] User created successfully:', user.email)

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Remove sensitive data
    const { password_hash, reset_token, reset_token_expires, ...safeUser } = user

    return NextResponse.json({
      success: true,
      token,
      user: safeUser
    })

  } catch (error) {
    console.error('[Register API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
