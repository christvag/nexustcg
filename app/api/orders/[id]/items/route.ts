import { NextRequest, NextResponse } from 'next/server'
import { getOrderItems, initializeDatabase } from '@/lib/user-database'

// Initialize database on first request
let dbInitialized = false

const ensureDbInitialized = async () => {
  if (!dbInitialized) {
    await initializeDatabase()
    dbInitialized = true
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureDbInitialized()
    
    const orderId = parseInt(params.id)
    
    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      )
    }

    const items = await getOrderItems(orderId)
    
    return NextResponse.json({
      items
    })

  } catch (error) {
    console.error('Get order items API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order items' },
      { status: 500 }
    )
  }
}