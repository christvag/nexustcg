import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import Database from 'better-sqlite3'
import path from 'path'

const JWT_SECRET = process.env.JWT_SECRET || 'nexus-tcgrading-secret-key-2024'

function getDb() {
  const dbPath = path.join(process.cwd(), 'database', 'user-management.db')
  const db = new Database(dbPath)
  db.pragma('foreign_keys = ON')
  return db
}

function verifyAdmin(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    return { error: 'Unauthorized', status: 401 }
  }

  try {
    const decoded = verify(token, JWT_SECRET) as any
    if (decoded.role !== 'admin') {
      return { error: 'Forbidden', status: 403 }
    }
    return { decoded }
  } catch {
    return { error: 'Invalid token', status: 401 }
  }
}

export async function GET(request: NextRequest) {
  const auth = verifyAdmin(request)
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const db = getDb()
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const offset = (page - 1) * limit

    let users: any[]
    let total: number

    if (search) {
      const searchPattern = `%${search}%`
      users = db.prepare(`
        SELECT u.*,
          COUNT(o.id) as total_orders,
          COALESCE(SUM(CASE WHEN o.payment_status = 'paid' THEN o.total ELSE 0 END), 0) as total_spent
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
        WHERE u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?
        GROUP BY u.id
        ORDER BY u.created_at DESC
        LIMIT ? OFFSET ?
      `).all(searchPattern, searchPattern, searchPattern, limit, offset)

      const countResult = db.prepare(`
        SELECT COUNT(*) as count FROM users
        WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ?
      `).get(searchPattern, searchPattern, searchPattern) as any
      total = countResult.count
    } else {
      users = db.prepare(`
        SELECT u.*,
          COUNT(o.id) as total_orders,
          COALESCE(SUM(CASE WHEN o.payment_status = 'paid' THEN o.total ELSE 0 END), 0) as total_spent
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
        GROUP BY u.id
        ORDER BY u.created_at DESC
        LIMIT ? OFFSET ?
      `).all(limit, offset)

      const countResult = db.prepare('SELECT COUNT(*) as count FROM users').get() as any
      total = countResult.count
    }

    // Remove sensitive fields
    const safeUsers = users.map(user => {
      const { password_hash, reset_token, reset_token_expires, ...safeUser } = user
      return safeUser
    })

    db.close()

    return NextResponse.json({
      users: safeUsers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('Admin users API error:', error)
    db.close()
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = verifyAdmin(request)
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const db = getDb()
  try {
    const { userId, status, role } = await request.json()

    if (!userId) {
      db.close()
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const existingUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
    if (!existingUser) {
      db.close()
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const updates: string[] = []
    const values: any[] = []

    if (status !== undefined) { updates.push('is_active = ?'); values.push(status === 'active' ? 1 : 0) }
    if (role !== undefined) { updates.push('role = ?'); values.push(role) }

    if (updates.length > 0) {
      values.push(userId)
      db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values)
    }

    const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any
    const { password_hash, reset_token, reset_token_expires, ...safeUser } = updatedUser

    db.close()

    return NextResponse.json({
      success: true,
      user: safeUser
    })
  } catch (error) {
    console.error('Admin users update error:', error)
    db.close()
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
