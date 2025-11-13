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

// GET - Get all graded cards
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
    const cards = await populationReportDb.getAllCards()

    return NextResponse.json({
      success: true,
      cards
    })
  } catch (error: any) {
    console.error('❌ Get cards error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// POST - Add new graded card
export async function POST(req: NextRequest) {
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

    const body = await req.json()
    const { cardId, cardGame, cardName, cardGrade, setName, edition, rarity, cardInfo, cardOwner, frontImage, backImage } = body

    // Validate required fields
    if (!cardId || !cardGame || !cardName || !cardGrade || !setName || !rarity || !cardOwner) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 })
    }

    await initializePopulationReportDatabase()

    const cardData = {
      card_id: cardId,
      card_game: cardGame,
      card_name: cardName,
      card_grade: cardGrade,
      set_name: setName,
      edition: edition || '',
      rarity: rarity,
      card_info: cardInfo || '',
      card_owner: cardOwner,
      date_graded: new Date().toISOString(),
      front_image: frontImage || '',
      back_image: backImage || ''
    }

    const insertedId = await populationReportDb.insertCard(cardData)

    return NextResponse.json({
      success: true,
      cardId: insertedId,
      message: 'Card added successfully'
    })
  } catch (error: any) {
    console.error('❌ Add card error:', error)
    return NextResponse.json({
      success: false,
      error: error.message.includes('UNIQUE constraint')
        ? 'Card ID already exists'
        : 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
