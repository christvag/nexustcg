import { NextRequest, NextResponse } from 'next/server'
import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import path from 'path'

function getDb() {
  const dbPath = path.join(process.cwd(), 'database', 'user-management.db')
  const db = new Database(dbPath)
  db.pragma('foreign_keys = ON')
  return db
}

export async function POST(request: NextRequest) {
  const db = getDb()
  try {
    const body = await request.json()
    const { email, password, first_name, last_name, username, phone, role } = body

    if (!email || !password || !first_name || !last_name) {
      db.close()
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
    if (existing) {
      db.close()
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const result = db.prepare(`
      INSERT INTO users (email, password_hash, first_name, last_name, phone, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      email,
      hashedPassword,
      first_name,
      last_name,
      phone || null,
      role || 'user'
    )

    const userId = result.lastInsertRowid as number
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any

    // Remove sensitive fields
    const { password_hash, reset_token, reset_token_expires, ...safeUser } = user

    db.close()

    return NextResponse.json({
      success: true,
      user: safeUser
    })

  } catch (error: any) {
    console.error('User API error:', error)
    db.close()
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const db = getDb()
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    if (userId) {
      const user = db.prepare(`
        SELECT u.*,
          COUNT(o.id) as total_orders,
          COALESCE(SUM(CASE WHEN o.payment_status = 'paid' THEN o.total ELSE 0 END), 0) as total_spent
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
        WHERE u.id = ?
        GROUP BY u.id
      `).get(parseInt(userId)) as any

      if (!user) {
        db.close()
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      // Remove sensitive fields
      const { password_hash, reset_token, reset_token_expires, ...safeUser } = user

      db.close()

      return NextResponse.json({ user: safeUser })
    }

    // Get all users with order stats in a single query
    const users = db.prepare(`
      SELECT u.*,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(CASE WHEN o.payment_status = 'paid' THEN o.total ELSE 0 END), 0) as total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `).all() as any[]

    // Remove sensitive fields
    const safeUsers = users.map(user => {
      const { password_hash, reset_token, reset_token_expires, ...safeUser } = user
      return safeUser
    })

    db.close()

    return NextResponse.json({
      users: safeUsers,
      count: safeUsers.length
    })

  } catch (error) {
    console.error('Get users API error:', error)
    db.close()
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const db = getDb()
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    if (!userId) {
      db.close()
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const userIdNum = parseInt(userId)
    const body = await request.json()

    // Check if user exists
    const existingUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userIdNum)
    if (!existingUser) {
      db.close()
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Build dynamic update
    const updates: string[] = []
    const values: any[] = []

    if (body.first_name !== undefined) { updates.push('first_name = ?'); values.push(body.first_name) }
    if (body.last_name !== undefined) { updates.push('last_name = ?'); values.push(body.last_name) }
    if (body.email !== undefined) { updates.push('email = ?'); values.push(body.email) }
    if (body.phone !== undefined) { updates.push('phone = ?'); values.push(body.phone) }
    if (body.role !== undefined) { updates.push('role = ?'); values.push(body.role) }
    if (body.is_active !== undefined) { updates.push('is_active = ?'); values.push(body.is_active) }
    if (body.email_verified !== undefined) { updates.push('email_verified = ?'); values.push(body.email_verified) }

    if (updates.length > 0) {
      values.push(userIdNum)
      db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values)
    }

    // Get updated user
    const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userIdNum) as any

    // Remove sensitive fields
    const { password_hash, reset_token, reset_token_expires, ...safeUser } = updatedUser

    db.close()

    return NextResponse.json({
      success: true,
      user: safeUser,
      message: 'User updated successfully'
    })

  } catch (error) {
    console.error('Update user API error:', error)
    db.close()
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const db = getDb()
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    if (!userId) {
      db.close()
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const userIdNum = parseInt(userId)

    // Check if user exists
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userIdNum)
    if (!user) {
      db.close()
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get all order IDs for this user
    const orderIds = db.prepare('SELECT id FROM orders WHERE user_id = ?').all(userIdNum) as any[]

    // Delete all related data in a transaction
    const deleteAll = db.transaction(() => {
      for (const order of orderIds) {
        db.prepare('DELETE FROM order_items WHERE order_id = ?').run(order.id)
        db.prepare('DELETE FROM order_status_history WHERE order_id = ?').run(order.id)
        db.prepare('DELETE FROM chat_messages WHERE order_id = ?').run(order.id)
        db.prepare('DELETE FROM payments WHERE order_id = ?').run(order.id)
      }

      db.prepare('DELETE FROM orders WHERE user_id = ?').run(userIdNum)
      db.prepare('DELETE FROM user_addresses WHERE user_id = ?').run(userIdNum)
      db.prepare('DELETE FROM user_sessions WHERE user_id = ?').run(userIdNum)
      db.prepare('DELETE FROM chat_messages WHERE user_id = ?').run(userIdNum)
      db.prepare('DELETE FROM users WHERE id = ?').run(userIdNum)
    })

    deleteAll()

    db.close()

    return NextResponse.json({
      success: true,
      message: 'User and all related data deleted successfully'
    })

  } catch (error) {
    console.error('Delete user API error:', error)
    db.close()
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
