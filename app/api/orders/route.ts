import { NextRequest, NextResponse } from 'next/server'
import Database from 'better-sqlite3'
import path from 'path'

function getDb() {
  const dbPath = path.join(process.cwd(), 'database', 'user-management.db')
  const db = new Database(dbPath)
  db.pragma('foreign_keys = ON')
  return db
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const userId = searchParams.get('user_id')

    const db = getDb()

    let orders
    if (userId) {
      orders = db.prepare(`
        SELECT * FROM orders
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `).all(parseInt(userId), limit, offset)
    } else {
      orders = db.prepare(`
        SELECT * FROM orders
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `).all(limit, offset)
    }

    db.close()

    return NextResponse.json({
      orders,
      count: orders.length
    })

  } catch (error) {
    console.error('Get orders API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const db = getDb()

  try {
    const orderData = await request.json()

    const {
      user_id,
      package_id,
      package_name,
      package_price,
      total_cards,
      subtotal,
      tax,
      shipping,
      total,
      cards,
      payment_intent_id,
      payment_status,
      customer_info
    } = orderData

    console.log('[Orders API] Creating order:', { package_name, total_cards, total })

    // Validation
    if (!package_name || !total_cards || !customer_info) {
      db.close()
      return NextResponse.json(
        { error: 'Missing required order data' },
        { status: 400 }
      )
    }

    // Generate order number
    const orderNumber = `TCG-${Date.now()}`

    // Insert order
    const insertOrderSql = `
      INSERT INTO orders (
        user_id, order_number, package_id, package_name, package_price,
        total_cards, subtotal, tax, shipping, total,
        status, payment_status, stripe_payment_intent_id, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    const orderResult = db.prepare(insertOrderSql).run(
      user_id || null,
      orderNumber,
      package_id || 'package',
      package_name,
      package_price || 0,
      total_cards,
      subtotal || 0,
      tax || 0,
      shipping || 0,
      total || 0,
      'pending',
      payment_status || 'paid',
      payment_intent_id || null,
      JSON.stringify(customer_info)
    )

    const orderId = orderResult.lastInsertRowid as number
    console.log('[Orders API] Order created with ID:', orderId)

    // Insert order items (cards/packages)
    if (cards && cards.length > 0) {
      const insertItemSql = `
        INSERT INTO order_items (
          order_id, card_name, card_game, quantity, unit_price
        ) VALUES (?, ?, ?, ?, ?)
      `

      for (const item of cards) {
        // Handle different card data formats
        const cardName = item.card?.name || item.packageName || package_name
        const cardGame = item.card?.game || 'TCG Grading'
        const quantity = item.quantity || 1
        const unitPrice = item.price || package_price || 0

        db.prepare(insertItemSql).run(
          orderId,
          cardName,
          cardGame,
          quantity,
          unitPrice
        )
      }
      console.log('[Orders API] Order items created:', cards.length)
    }

    // Create payment record
    if (payment_intent_id) {
      const insertPaymentSql = `
        INSERT INTO payments (
          order_id, stripe_payment_intent_id, amount, currency, status, payment_method
        ) VALUES (?, ?, ?, ?, ?, ?)
      `

      db.prepare(insertPaymentSql).run(
        orderId,
        payment_intent_id,
        total || 0,
        'USD',
        payment_status || 'paid',
        'stripe'
      )
      console.log('[Orders API] Payment record created')
    }

    // Get the created order
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId)

    db.close()

    return NextResponse.json({
      success: true,
      order,
      orderNumber
    })

  } catch (error) {
    console.error('Create order API error:', error)
    db.close()
    return NextResponse.json(
      { error: 'Failed to create order: ' + (error as Error).message },
      { status: 500 }
    )
  }
}
