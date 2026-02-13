import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import Database from 'better-sqlite3'
import path from 'path'
import { triggerOrderEmail } from '@/lib/email-trigger'

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
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status')
    const offset = (page - 1) * limit

    let orders: any[]
    let total: number

    if (status && status !== 'all') {
      orders = db.prepare(`
        SELECT o.*, u.first_name, u.last_name, u.email as customer_email
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        WHERE o.status = ?
        ORDER BY o.created_at DESC
        LIMIT ? OFFSET ?
      `).all(status, limit, offset)

      const countResult = db.prepare(
        'SELECT COUNT(*) as count FROM orders WHERE status = ?'
      ).get(status) as any
      total = countResult.count
    } else {
      orders = db.prepare(`
        SELECT o.*, u.first_name, u.last_name, u.email as customer_email
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
        LIMIT ? OFFSET ?
      `).all(limit, offset)

      const countResult = db.prepare('SELECT COUNT(*) as count FROM orders').get() as any
      total = countResult.count
    }

    // Format orders for frontend
    const formattedOrders = orders.map(order => ({
      ...order,
      customerName: order.first_name && order.last_name
        ? `${order.first_name} ${order.last_name}`
        : 'Unknown',
      email: order.customer_email || ''
    }))

    db.close()

    return NextResponse.json({
      orders: formattedOrders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('Admin orders API error:', error)
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
    const { orderId, status, notes } = await request.json()

    if (!orderId) {
      db.close()
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    const existingOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId)
    if (!existingOrder) {
      db.close()
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const updates: string[] = []
    const values: any[] = []

    if (status !== undefined) { updates.push('status = ?'); values.push(status) }
    if (notes !== undefined) { updates.push('notes = ?'); values.push(notes) }

    if (updates.length > 0) {
      values.push(orderId)
      db.prepare(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`).run(...values)
    }

    const updatedOrder = db.prepare(`
      SELECT o.*, u.first_name, u.last_name, u.email as customer_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `).get(orderId) as any

    db.close()

    // Fire-and-forget: send email notification if status was changed
    if (status !== undefined && updatedOrder?.customer_email) {
      const customerName = updatedOrder.first_name && updatedOrder.last_name
        ? `${updatedOrder.first_name} ${updatedOrder.last_name}`
        : 'Customer'
      triggerOrderEmail(
        updatedOrder.customer_email,
        updatedOrder.order_number,
        status,
        customerName
      ).catch(() => {})
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder
    })
  } catch (error) {
    console.error('Admin orders update error:', error)
    db.close()
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
