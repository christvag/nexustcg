import { NextRequest, NextResponse } from 'next/server'
import { createUser, getUserById, getAllUsers, updateUser, runQuery, type User } from '@/lib/user-database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, first_name, last_name, username, phone, role } = body

    if (!email || !password || !first_name || !last_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    try {
      const user = await createUser({
        email,
        password,
        first_name,
        last_name,
        username,
        phone,
        role
      })

      return NextResponse.json({
        success: true,
        user
      })
    } catch (error: any) {
      if (error.message?.includes('UNIQUE constraint failed')) {
        return NextResponse.json(
          { error: 'User already exists with this email' },
          { status: 409 }
        )
      }
      throw error
    }

  } catch (error) {
    console.error('User API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    if (userId) {
      const user = await getUserById(parseInt(userId))
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      // Get user statistics
      const orderStats = await runQuery(
        `SELECT
          COUNT(*) as total_orders,
          COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total ELSE 0 END), 0) as total_spent
        FROM orders
        WHERE user_id = ?`,
        [parseInt(userId)]
      )

      // Remove sensitive fields
      const { password_hash, reset_token, reset_token_expires, ...safeUser } = user as any

      return NextResponse.json({
        user: {
          ...safeUser,
          total_orders: orderStats[0]?.total_orders || 0,
          total_spent: orderStats[0]?.total_spent || 0
        }
      })
    }

    // Get all users
    const users = await getAllUsers()

    // Get statistics for all users and remove sensitive data
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const orderStats = await runQuery(
          `SELECT
            COUNT(*) as total_orders,
            COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total ELSE 0 END), 0) as total_spent
          FROM orders
          WHERE user_id = ?`,
          [user.id]
        )

        // Remove sensitive fields
        const { password_hash, reset_token, reset_token_expires, ...safeUser } = user as any

        return {
          ...safeUser,
          total_orders: orderStats[0]?.total_orders || 0,
          total_spent: orderStats[0]?.total_spent || 0
        }
      })
    )

    return NextResponse.json({
      users: usersWithStats,
      count: usersWithStats.length
    })

  } catch (error) {
    console.error('Get users API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const userIdNum = parseInt(userId)
    const body = await request.json()

    // Check if user exists
    const existingUser = await getUserById(userIdNum)
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Update user using updateUser function
    const updatedUser = await updateUser(userIdNum, {
      first_name: body.first_name,
      last_name: body.last_name,
      email: body.email,
      phone: body.phone,
      role: body.role,
      is_active: body.is_active !== undefined ? body.is_active : undefined,
      email_verified: body.email_verified !== undefined ? body.email_verified : undefined
    })

    // Remove sensitive fields
    const { password_hash, reset_token, reset_token_expires, ...safeUser } = updatedUser as any

    return NextResponse.json({
      success: true,
      user: safeUser,
      message: 'User updated successfully'
    })

  } catch (error) {
    console.error('Update user API error:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const userIdNum = parseInt(userId)

    // Check if user exists
    const user = await getUserById(userIdNum)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get all order IDs for this user
    const orderIds = await runQuery(
      'SELECT id FROM orders WHERE user_id = ?',
      [userIdNum]
    )

    // Delete all related data in correct order
    for (const order of orderIds) {
      // Delete order-related data
      await runQuery('DELETE FROM order_items WHERE order_id = ?', [order.id])
      await runQuery('DELETE FROM order_status_history WHERE order_id = ?', [order.id])
      await runQuery('DELETE FROM chat_messages WHERE order_id = ?', [order.id])
      await runQuery('DELETE FROM payments WHERE order_id = ?', [order.id])
    }

    // Delete orders
    await runQuery('DELETE FROM orders WHERE user_id = ?', [userIdNum])

    // Delete user-related data
    await runQuery('DELETE FROM user_addresses WHERE user_id = ?', [userIdNum])
    await runQuery('DELETE FROM user_sessions WHERE user_id = ?', [userIdNum])
    await runQuery('DELETE FROM chat_messages WHERE user_id = ?', [userIdNum])

    // Finally delete the user
    await runQuery('DELETE FROM users WHERE id = ?', [userIdNum])

    return NextResponse.json({
      success: true,
      message: 'User and all related data deleted successfully'
    })

  } catch (error) {
    console.error('Delete user API error:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}