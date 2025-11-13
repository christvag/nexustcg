import { NextRequest, NextResponse } from 'next/server'
import { extractUserFromToken, getUserById } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const user = extractUserFromToken(authHeader)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const fullUser = await getUserById(user.id)
    if (!fullUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Remove password hash from response
    const { password_hash, ...userWithoutPassword } = fullUser

    return NextResponse.json({
      user: userWithoutPassword
    })
  } catch (error: any) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Failed to get user information' },
      { status: 500 }
    )
  }
}