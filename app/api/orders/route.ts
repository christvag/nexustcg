import { NextRequest, NextResponse } from 'next/server'
import { createOrder, getAllOrders, getOrdersByUserId, initializeDatabase } from '@/lib/user-database'

// Initialize database on first request
let dbInitialized = false

const ensureDbInitialized = async () => {
  if (!dbInitialized) {
    await initializeDatabase()
    dbInitialized = true
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureDbInitialized()
    
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const userId = searchParams.get('user_id')

    let orders
    
    if (userId) {
      // Get orders for specific user
      orders = await getOrdersByUserId(parseInt(userId))
    } else {
      // Get all orders (admin view)
      orders = await getAllOrders(limit, offset)
    }
    
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
  try {
    await ensureDbInitialized()
    
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
      cards
    } = orderData
    
    // Validation
    if (!user_id || !package_id || !package_name || !cards || cards.length === 0) {
      return NextResponse.json(
        { error: 'Missing required order data' },
        { status: 400 }
      )
    }

    // Transform card data to match expected format
    const items = cards.map((cardItem: any) => ({
      card_name: cardItem.card.name,
      card_game: cardItem.card.game,
      card_type: cardItem.card.type,
      card_rarity: cardItem.card.rarity,
      card_number: cardItem.card.number,
      card_image_url: cardItem.card.imageUrl,
      quantity: cardItem.quantity,
      unit_price: parseFloat(package_price),
      is_custom: cardItem.card.id.startsWith('custom-')
    }))

    const order = await createOrder({
      user_id: parseInt(user_id),
      package_id,
      package_name,
      package_price: parseFloat(package_price),
      total_cards,
      subtotal: parseFloat(subtotal),
      tax: parseFloat(tax || 0),
      shipping: parseFloat(shipping || 0),
      total: parseFloat(total),
      items
    })

    return NextResponse.json({
      success: true,
      order
    })

  } catch (error) {
    console.error('Create order API error:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}