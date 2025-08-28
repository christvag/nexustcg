import { NextRequest, NextResponse } from 'next/server'
import { extractUserFromToken, checkPermission } from '@/lib/auth'
import { query } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const user = extractUserFromToken(authHeader)

    if (!user || !checkPermission(user.role, ['admin', 'staff'])) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get dashboard statistics
    const [
      totalOrdersResult,
      pendingOrdersResult,
      completedOrdersResult,
      revenueResult,
      recentOrdersResult
    ] = await Promise.all([
      query('SELECT COUNT(*) as count FROM orders'),
      query('SELECT COUNT(*) as count FROM orders WHERE status = $1', ['pending']),
      query('SELECT COUNT(*) as count FROM orders WHERE status = $1', ['completed']),
      query('SELECT SUM(total) as revenue FROM orders WHERE payment_status = $1', ['paid']),
      query(`
        SELECT o.*, u.first_name, u.last_name, u.email
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
        LIMIT 10
      `)
    ])

    const stats = {
      totalOrders: parseInt(totalOrdersResult.rows[0].count),
      pendingOrders: parseInt(pendingOrdersResult.rows[0].count),
      completedOrders: parseInt(completedOrdersResult.rows[0].count),
      totalRevenue: parseFloat(revenueResult.rows[0].revenue || 0),
      recentOrders: recentOrdersResult.rows
    }

    return NextResponse.json(stats)
  } catch (error: any) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
}