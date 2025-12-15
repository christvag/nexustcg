import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// id: middleware-cors-001
// Allowed origins for CORS - WordPress main site and subdomain
const allowedOrigins = [
  'https://nexusgrading.com',
  'https://www.nexusgrading.com',
  'https://tcg.nexusgrading.com',
  // Development origins
  'http://localhost:3000',
  'http://localhost:4000',
]

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin') || ''
  const isAllowedOrigin = allowedOrigins.includes(origin) ||
    (process.env.ALLOWED_ORIGINS?.split(',').includes(origin))

  // Handle preflight OPTIONS requests
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 })

    if (isAllowedOrigin) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    }
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Allow-Methods', 'GET, DELETE, PATCH, POST, PUT, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization')
    response.headers.set('Access-Control-Max-Age', '86400')

    return response
  }

  // Handle actual requests
  const response = NextResponse.next()

  // Set CORS headers for allowed origins
  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set('Access-Control-Allow-Methods', 'GET, DELETE, PATCH, POST, PUT, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization')

  return response
}

// Apply middleware to API routes
export const config = {
  matcher: '/api/:path*',
}
