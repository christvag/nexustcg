import { NextRequest, NextResponse } from 'next/server'
import { getUserById, updateUser, getOrdersByUserId, initializeDatabase } from '@/lib/user-database'

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
    
    const userId = parseInt(params.id)
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const includeOrders = searchParams.get('include_orders') === 'true'

    const user = await getUserById(userId)
    
    // Remove password hash from response
    const { password_hash, ...userResponse } = user
    
    const response: any = { user: userResponse }
    
    if (includeOrders) {
      const orders = await getOrdersByUserId(userId)
      response.orders = orders
    }
    
    return NextResponse.json(response)

  } catch (error) {
    console.error('Get user API error:', error)
    
    if (error.message === 'User not found') {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureDbInitialized()
    
    const userId = parseInt(params.id)
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    const updates = await request.json()
    
    // Remove sensitive fields that shouldn't be updated via this endpoint
    const { id, password_hash, created_at, ...allowedUpdates } = updates
    
    const updatedUser = await updateUser(userId, allowedUpdates)
    
    // Remove password hash from response
    const { password_hash: _, ...userResponse } = updatedUser
    
    return NextResponse.json({
      success: true,
      user: userResponse
    })

  } catch (error) {
    console.error('Update user API error:', error)
    
    if (error.message === 'User not found') {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}