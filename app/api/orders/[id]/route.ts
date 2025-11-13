import { NextRequest, NextResponse } from 'next/server'
import { extractUserFromToken, checkPermission } from '@/lib/auth'
import { query } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    const user = extractUserFromToken(authHeader)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const orderId = params.id

    // Get order with user info
    let orderQuery = `
      SELECT o.*, u.first_name, u.last_name, u.email, u.phone, u.shipping_address
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = $1
    `
    let queryParams = [orderId]

    // If user is not admin/staff, only show their orders
    if (!checkPermission(user.role, ['admin', 'staff'])) {
      orderQuery += ' AND o.user_id = $2'
      queryParams.push(user.id)
    }

    const orderResult = await query(orderQuery, queryParams)

    if (orderResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const order = orderResult.rows[0]

    // Get order items
    const itemsResult = await query(
      'SELECT * FROM order_items WHERE order_id = $1 ORDER BY created_at',
      [orderId]
    )

    // Get order status history
    const historyResult = await query(
      `SELECT osh.*, u.first_name, u.last_name 
       FROM order_status_history osh
       LEFT JOIN users u ON osh.changed_by = u.id
       WHERE osh.order_id = $1 
       ORDER BY osh.created_at DESC`,
      [orderId]
    )

    return NextResponse.json({
      order,
      items: itemsResult.rows,
      history: historyResult.rows
    })
  } catch (error: any) {
    console.error('Get order error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    const user = extractUserFromToken(authHeader)

    if (!user || !checkPermission(user.role, ['admin', 'staff'])) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const orderId = params.id
    const updates = await request.json()

    // Get current order
    const currentOrder = await query(
      'SELECT status FROM orders WHERE id = $1',
      [orderId]
    )

    if (currentOrder.rows.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const oldStatus = currentOrder.rows[0].status

    // Build update query
    const fields: string[] = []
    const values: any[] = []
    let paramCount = 1

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id') {
        fields.push(`${key} = $${paramCount}`)
        values.push(value)
        paramCount++
      }
    })

    if (fields.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    values.push(orderId)

    // Update order
    const result = await query(
      `UPDATE orders SET ${fields.join(', ')}, updated_at = NOW() 
       WHERE id = $${paramCount} 
       RETURNING *`,
      values
    )

    // If status changed, add to history
    if (updates.status && updates.status !== oldStatus) {
      await query(
        `INSERT INTO order_status_history (order_id, old_status, new_status, changed_by, notes)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, oldStatus, updates.status, user.id, updates.notes || null]
      )
    }

    return NextResponse.json({
      order: result.rows[0],
      message: 'Order updated successfully'
    })
  } catch (error: any) {
    console.error('Update order error:', error)
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    )
  }
}