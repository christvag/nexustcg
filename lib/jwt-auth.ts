import jwt from 'jsonwebtoken'
import { setCookie, getCookie, deleteCookie } from 'cookies-next'
import { NextRequest, NextResponse } from 'next/server'
import type { User } from './tcgrading-database'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const TOKEN_EXPIRY = '7d' // 7 days

interface TokenPayload {
  userId: number
  email: string
  role: string
  firstName: string
  lastName: string
}

// Generate JWT token
export function generateToken(user: User): string {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    firstName: user.first_name,
    lastName: user.last_name
  }
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY })
}

// Verify JWT token
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload
    return decoded
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

// Set auth cookie
export function setAuthCookie(res: NextResponse, token: string) {
  setCookie('auth-token', token, {
    req: undefined,
    res,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  })
}

// Get auth token from request
export function getAuthToken(req: NextRequest): string | null {
  // Check Authorization header first
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  // Check cookie
  const cookieToken = getCookie('auth-token', { req }) as string | undefined
  return cookieToken || null
}

// Verify request authentication
export function verifyAuth(req: NextRequest): TokenPayload | null {
  const token = getAuthToken(req)
  if (!token) return null
  
  return verifyToken(token)
}

// Middleware to protect routes
export function requireAuth(handler: Function) {
  return async (req: NextRequest, ...args: any[]) => {
    const user = verifyAuth(req)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      )
    }
    
    // Add user to request for use in handler
    (req as any).user = user
    return handler(req, ...args)
  }
}

// Middleware to require specific roles
export function requireRole(roles: string[]) {
  return (handler: Function) => {
    return async (req: NextRequest, ...args: any[]) => {
      const user = verifyAuth(req)
      
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized - Please login' },
          { status: 401 }
        )
      }
      
      if (!roles.includes(user.role)) {
        return NextResponse.json(
          { error: 'Forbidden - Insufficient permissions' },
          { status: 403 }
        )
      }
      
      (req as any).user = user
      return handler(req, ...args)
    }
  }
}