import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { populationReportDb, initializePopulationReportDatabase } from '@/lib/population-report-database'

const JWT_SECRET = process.env.JWT_SECRET || 'nexus-tcgrading-secret-key-2024'

interface JWTPayload {
  userId: number
  email: string
  role: string
}

function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    return decoded
  } catch (error) {
    return null
  }
}

// GET - Get next available card ID
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        error: 'No token provided'
      }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = verifyToken(token)

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired token'
      }, { status: 401 })
    }

    if (user.role.toLowerCase() !== 'admin') {
      return NextResponse.json({
        success: false,
        error: 'Access denied. Admin role required.'
      }, { status: 403 })
    }

    await initializePopulationReportDatabase()
    const nextCardId = await populationReportDb.getNextCardId()

    return NextResponse.json({
      success: true,
      nextCardId
    })
  } catch (error: any) {
    console.error('❌ Get next card ID error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
