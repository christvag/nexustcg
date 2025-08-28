import { NextRequest, NextResponse } from 'next/server'
import { registerUser, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password, first_name, last_name, phone } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const user = await registerUser(email, password, first_name, last_name, phone)
    const token = generateToken(user)

    return NextResponse.json({
      user,
      token,
      message: 'Registration successful'
    })
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 400 }
    )
  }
}