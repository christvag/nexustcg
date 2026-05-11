import { NextRequest, NextResponse } from 'next/server'
import Database from 'better-sqlite3'
import path from 'path'

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

    const items = db
      .prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at')
      .all(orderId)

    db.close()

    return NextResponse.json({
      items,
      count: items.length,
    })
  } catch (error) {
    console.error('Get order items API error:', error)
    db.close()
    return NextResponse.json({ error: 'Failed to fetch order items' }, { status: 500 })
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
    const { itemId, grade, notes } = body

    if (isNaN(orderId) || !itemId || !grade) {
      db.close()
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const result = db
      .prepare('UPDATE order_items SET grade = ?, grade_notes = ? WHERE id = ?')
      .run(grade, notes || null, parseInt(itemId))

    db.close()

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Failed to update item grade' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Item grade updated successfully',
    })
  } catch (error) {
    console.error('Update order item API error:', error)
    db.close()
    return NextResponse.json({ error: 'Failed to update order item' }, { status: 500 })
  }
}
