import { NextRequest, NextResponse } from 'next/server'
import { getOrderById, updateOrderStatus, getOrderItems } from '@/lib/tcgrading-database'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = parseInt(params.id)
    
    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      )
    }

    const order = getOrderById(orderId)
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Get order items
    const items = getOrderItems(orderId)

    return NextResponse.json({ 
      order,
      items,
      count: items.length
    })

  } catch (error) {
    console.error('Get order API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = parseInt(params.id)
    const body = await request.json()
    const { status, notes } = body
    
    if (isNaN(orderId) || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const success = updateOrderStatus(orderId, status, notes)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update order status' },
        { status: 404 }
      )
    }

    const updatedOrder = getOrderById(orderId)

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
      order: updatedOrder
    })

  } catch (error) {
    console.error('Update order API error:', error)
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    )
  }
}