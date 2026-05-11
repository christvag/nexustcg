import { NextRequest, NextResponse } from 'next/server'
import Database from 'better-sqlite3'
import path from 'path'

export const dynamic = 'force-dynamic'

function getDb() {
  const dbPath = path.join(process.cwd(), 'database', 'user-management.db')
  const db = new Database(dbPath, { readonly: true })
  return db
}

export async function GET(request: NextRequest) {
  const db = getDb()
  try {
    const totalUsers = (db.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 1').get() as any).count
    const totalOrders = (db.prepare('SELECT COUNT(*) as count FROM orders').get() as any).count
    const revenueRow = db
      .prepare("SELECT SUM(total) as revenue FROM orders WHERE payment_status = 'paid'")
      .get() as any
    const pendingOrders = (db
      .prepare(
        "SELECT COUNT(*) as count FROM orders WHERE status IN ('pending', 'received', 'in_progress', 'grading')"
      )
      .get() as any).count
    const completedOrders = (db
      .prepare("SELECT COUNT(*) as count FROM orders WHERE status IN ('completed', 'shipped', 'delivered')")
      .get() as any).count
    const cardsGraded = (db
      .prepare("SELECT COUNT(*) as count FROM order_items WHERE grade IS NOT NULL AND grade <> ''")
      .get() as any).count

    db.close()

    return NextResponse.json({
      totalUsers,
      totalOrders,
      totalRevenue: revenueRow?.revenue || 0,
      pendingOrders,
      completedOrders,
      cardsGraded,
      popularCards: [],
    })
  } catch (error) {
    console.error('Dashboard stats API error:', error)
    db.close()
    return NextResponse.json({ error: 'Failed to fetch dashboard statistics' }, { status: 500 })
  }
}
