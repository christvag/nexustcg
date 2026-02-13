import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import Database from 'better-sqlite3'
import path from 'path'

const JWT_SECRET = process.env.JWT_SECRET || 'nexus-tcgrading-secret-key-2024'

interface JWTPayload {
  userId: number
  email: string
  role: string
}

function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    return decoded
  } catch (error) {
    return null
  }
}

// GET - Search users by username, email, first_name, or last_name
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        error: 'No token provided'
      }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = verifyToken(token)

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired token'
      }, { status: 401 })
    }

    if (user.role.toLowerCase() !== 'admin') {
      return NextResponse.json({
        success: false,
        error: 'Access denied. Admin role required.'
      }, { status: 403 })
    }

    // Get search query
    const searchParams = req.nextUrl.searchParams
    const query = searchParams.get('q') || ''

    if (query.length < 2) {
      return NextResponse.json({
        success: true,
        users: []
      })
    }

    // Initialize database connection
    const dbPath = path.join(process.cwd(), 'database', 'user-management.db')
    const db = new Database(dbPath)
    db.pragma('foreign_keys = ON')

    // Search users by email, first_name, or last_name
    const searchSql = `
      SELECT id, email, first_name, last_name, role
      FROM users
      WHERE
        email LIKE ? OR
        first_name LIKE ? OR
        last_name LIKE ? OR
        (first_name || ' ' || last_name) LIKE ?
      ORDER BY
        CASE
          WHEN email LIKE ? THEN 1
          WHEN first_name LIKE ? THEN 2
          ELSE 3
        END,
        email ASC
      LIMIT 20
    `

    const searchPattern = `%${query}%`
    const exactPattern = `${query}%`

    const users = db.prepare(searchSql).all(
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern,
      exactPattern,
      exactPattern
    )

    db.close()

    return NextResponse.json({
      success: true,
      users
    })
  } catch (error: any) {
    console.error('❌ User search error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
