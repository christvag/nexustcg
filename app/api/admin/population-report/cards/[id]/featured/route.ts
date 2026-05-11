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

// POST - Toggle featured status for a card
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const cardId = parseInt(params.id)
    if (isNaN(cardId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid card ID'
      }, { status: 400 })
    }

    await initializePopulationReportDatabase()
    const isFeatured = await populationReportDb.toggleFeatured(cardId)

    return NextResponse.json({
      success: true,
      message: isFeatured ? 'Card added to featured' : 'Card removed from featured',
      is_featured: isFeatured
    })
  } catch (error: any) {
    console.error('❌ Toggle featured error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
