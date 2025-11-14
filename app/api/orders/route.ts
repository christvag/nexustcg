import { NextRequest, NextResponse } from 'next/server'
import { createOrder, getAllOrders, getOrdersByUserId, getOrderItems, trackCardOrder, type CreateOrderData } from '@/lib/tcgrading-database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const userId = searchParams.get('user_id')

    let orders
    
    if (userId) {
      // Get orders for specific user
      orders = getOrdersByUserId(parseInt(userId))
    } else {
      // Get all orders (admin view)
      orders = getAllOrders(limit, offset)
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
    
    // Validation
    if (!package_id || !package_name || !cards || cards.length === 0 || !customer_info) {
      return NextResponse.json(
        { error: 'Missing required order data' },
        { status: 400 }
      )
    }

    // Track card orders for analytics
    for (const cardItem of cards) {
      trackCardOrder(cardItem.card.name, cardItem.card.game)
    }

    const order = createOrder({
      user_id: user_id || undefined,
      package_id,
      package_name,
      package_price: parseFloat(package_price),
      total_cards: parseInt(total_cards),
      subtotal: parseFloat(subtotal),
      tax: parseFloat(tax || 0),
      shipping: parseFloat(shipping || 0),
      total: parseFloat(total),
      payment_intent_id,
      payment_status: payment_status || 'pending',
      customer_info,
      cards
    } as CreateOrderData)

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