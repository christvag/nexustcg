import { NextRequest, NextResponse } from 'next/server'
import { getOrderItems, updateOrderItemGrade } from '@/lib/tcgrading-database'

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

    const items = getOrderItems(orderId)
    
    return NextResponse.json({
      items,
      count: items.length
    })

  } catch (error) {
    console.error('Get order items API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order items' },
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
    const { itemId, grade, notes } = body
    
    if (isNaN(orderId) || !itemId || !grade) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const success = updateOrderItemGrade(parseInt(itemId), grade, notes)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update item grade' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Item grade updated successfully'
    })

  } catch (error) {
    console.error('Update order item API error:', error)
    return NextResponse.json(
      { error: 'Failed to update order item' },
      { status: 500 }
    )
  }
}