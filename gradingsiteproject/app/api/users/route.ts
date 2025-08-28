import { NextRequest, NextResponse } from 'next/server'
import { createUser, getAllUsers, getUserByEmail, initializeDatabase } from '@/lib/user-database'
import bcrypt from 'bcryptjs'

// Initialize database on first request
let dbInitialized = false

const ensureDbInitialized = async () => {
  if (!dbInitialized) {
    await initializeDatabase()
    dbInitialized = true
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDbInitialized()
    
    const body = await request.json()
    const { action, ...userData } = body

    if (action === 'register') {
      // Register new user
      const { email, password, first_name, last_name, phone } = userData
      
      if (!email || !password || !first_name || !last_name) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        )
      }

      // Check if user already exists
      try {
        await getUserByEmail(email)
        return NextResponse.json(
          { error: 'User already exists with this email' },
          { status: 409 }
        )
      } catch (error) {
        // User doesn't exist, continue with registration
      }

      const user = await createUser({
        email,
        password,
        first_name,
        last_name,
        phone
      })

      // Remove password hash from response
      const { password_hash, ...userResponse } = user
      
      return NextResponse.json({
        success: true,
        user: userResponse
      })
    }

    if (action === 'login') {
      // Login user
      const { email, password } = userData
      
      if (!email || !password) {
        return NextResponse.json(
          { error: 'Email and password are required' },
          { status: 400 }
        )
      }

      try {
        const user = await getUserByEmail(email)
        
        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password_hash!)
        if (!isValidPassword) {
          return NextResponse.json(
            { error: 'Invalid email or password' },
            { status: 401 }
          )
        }

        // Remove password hash from response
        const { password_hash, ...userResponse } = user
        
        return NextResponse.json({
          success: true,
          user: userResponse
        })
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

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
    await ensureDbInitialized()
    
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const users = await getAllUsers(limit, offset)
    
    // Remove password hashes from response
    const usersResponse = users.map(({ password_hash, ...user }) => user)
    
    return NextResponse.json({
      users: usersResponse,
      count: users.length
    })

  } catch (error) {
    console.error('Get users API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}