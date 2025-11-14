import { NextRequest, NextResponse } from 'next/server'
import { deleteCookie } from 'cookies-next'

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })
    
    // Delete auth cookie
    deleteCookie('auth-token', {
      req: request,
      res: response,
      path: '/'
    })
    
    return response

  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    )
  }
}