import { NextResponse } from 'next/server'

// Demo data for when database is not connected
const demoUsers = [
  {
    id: '1',
    email: 'admin@tcggrading.com',
    role: 'admin',
    first_name: 'Admin',
    last_name: 'User'
  },
  {
    id: '2', 
    email: 'user1@example.com',
    role: 'user',
    first_name: 'John',
    last_name: 'Doe'
  }
]

const demoOrders = [
  {
    id: '1',
    user_id: '2',
    order_number: 'TCG-1704639600-ABC123',
    package_name: 'Standard',
    package_price: 15.00,
    total_cards: 5,
    total: 90.99,
    status: 'in_progress',
    payment_status: 'paid',
    created_at: new Date().toISOString(),
    first_name: 'John',
    last_name: 'Doe',
    email: 'user1@example.com'
  },
  {
    id: '2',
    user_id: '2', 
    order_number: 'TCG-1704639700-DEF456',
    package_name: 'Express',
    package_price: 20.00,
    total_cards: 3,
    total: 64.80,
    status: 'completed',
    payment_status: 'paid',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    first_name: 'John',
    last_name: 'Doe',
    email: 'user1@example.com'
  }
]

export async function GET() {
  return NextResponse.json({
    message: 'Demo data API - Use this when database connection fails',
    users: demoUsers,
    orders: demoOrders,
    stats: {
      totalOrders: demoOrders.length,
      pendingOrders: demoOrders.filter(o => ['pending', 'in_progress'].includes(o.status)).length,
      completedOrders: demoOrders.filter(o => o.status === 'completed').length,
      totalRevenue: demoOrders.reduce((sum, o) => sum + o.total, 0)
    }
  })
}