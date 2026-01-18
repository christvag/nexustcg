import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { authMiddleware } from '@/lib/middleware/auth'
import { getUserById, updateUser } from '@/lib/user-database'

export async function POST(request: NextRequest) {
  try {
    // Authenticate admin user
    const authResult = await authMiddleware(request, 'admin')

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }

    const body = await request.json()
    const { userId, newPassword, confirmPassword } = body

    // Validate required fields
    if (!userId || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'User ID, new password, and confirm password are required' },
        { status: 400 }
      )
    }

    // Check if new passwords match
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Passwords do not match' },
        { status: 400 }
      )
    }

    // Validate password length
    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Verify user exists
    const targetUser = await getUserById(parseInt(userId))

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12)

    // Update password in database
    await updateUser(parseInt(userId), { password_hash: newPasswordHash })

    return NextResponse.json({
      success: true,
      message: `Password changed successfully for user ${targetUser.email}`
    })

  } catch (error) {
    console.error('[admin/change-password] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to change password' },
      { status: 500 }
    )
  }
}
