import { NextRequest, NextResponse } from 'next/server'
import Database from 'better-sqlite3'
import path from 'path'
import { triggerOrderEmail } from '@/lib/email-trigger'

function getDb() {
  const dbPath = path.join(process.cwd(), 'database', 'user-management.db')
  const db = new Database(dbPath)
  db.pragma('foreign_keys = ON')
  return db
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const db = getDb()
  try {
    const orderId = parseInt(params.id)

    if (isNaN(orderId)) {
      db.close()
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 })
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId)

    if (!order) {
      db.close()
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const items = db
      .prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at')
      .all(orderId)

    db.close()

    return NextResponse.json({
      order,
      items,
      count: items.length,
    })
  } catch (error) {
    console.error('Get order API error:', error)
    db.close()
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const db = getDb()
  try {
    const orderId = parseInt(params.id)
    const body = await request.json()
    const { status, notes } = body

    if (isNaN(orderId) || !status) {
      db.close()
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const currentOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any
    if (!currentOrder) {
      db.close()
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const tx = db.transaction(() => {
      db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
        status,
        orderId
      )
      db.prepare(
        'INSERT INTO order_status_history (order_id, old_status, new_status, notes) VALUES (?, ?, ?, ?)'
      ).run(orderId, currentOrder.status, status, notes || null)
    })
    tx()

    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any

    // Fire-and-forget: send email notification
    if (updatedOrder?.user_id) {
      const user = db
        .prepare('SELECT first_name, last_name, email FROM users WHERE id = ?')
        .get(updatedOrder.user_id) as any

      if (user?.email) {
        const customerName =
          user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : 'Customer'
        triggerOrderEmail(user.email, updatedOrder.order_number, status, customerName).catch(
          () => {}
        )
      }
    }

    db.close()

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
      order: updatedOrder,
    })
  } catch (error) {
    console.error('Update order API error:', error)
    db.close()
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}
