import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/middleware/auth'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        error: 'No token provided',
        debug: {
          authHeader: authHeader
        }
      }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await verifyToken(token)

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired token',
        debug: {
          token: token.substring(0, 50) + '...',
          tokenLength: token.length
        }
      }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      message: 'Token is valid',
      user: user,
      debug: {
        token: token.substring(0, 50) + '...',
        tokenLength: token.length
      }
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Token validation error',
      details: error.message
    }, { status: 500 })
  }
}