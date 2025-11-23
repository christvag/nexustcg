import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { populationReportDb, initializePopulationReportDatabase } from '@/lib/population-report-database'
import fs from 'fs'
import path from 'path'

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

function saveBase64Image(base64Data: string, cardId: string, side: 'front' | 'back'): string | null {
  try {
    if (!base64Data || !base64Data.includes('base64,')) {
      return null
    }

    // Extract the base64 data (remove data:image/png;base64, prefix)
    const base64String = base64Data.split('base64,')[1]
    const buffer = Buffer.from(base64String, 'base64')

    // Determine file extension from the data URL
    const mimeType = base64Data.split(';')[0].split(':')[1]
    const extension = mimeType.split('/')[1] || 'png'

    // Create filename with card ID and timestamp
    const fileName = `${cardId}_${Date.now()}.${extension}`

    // Determine the folder path
    const folderName = side === 'front' ? 'front_cards' : 'back_cards'
    const folderPath = path.join(process.cwd(), 'storage', 'card_image', folderName)

    // Ensure directory exists
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true })
    }

    // Full file path
    const filePath = path.join(folderPath, fileName)

    // Save the file
    fs.writeFileSync(filePath, buffer)

    // Return the relative path to store in database (without /storage/ prefix)
    // Frontend will prepend /api/storage/ when displaying
    return `card_image/${folderName}/${fileName}`
  } catch (error) {
    console.error(`Error saving ${side} image:`, error)
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

    // Transform cards to include is_featured and map database fields to expected format
    const transformedCards = cards.map(card => ({
      id: card.id,
      card_id: card.card_id,
      card_game: card.card_game,
      card_name: card.card_name,
      card_grade: card.card_grade,
      grade_name: card.grade_name,
      year_card: card.year_card,
      set_name: card.set_name,
      edition: card.edition,
      rarity: card.rarity,
      card_info: card.card_info,
      date_graded: card.date_graded,
      front_image_path: card.front_image,
      back_image_path: card.back_image,
      is_featured: card.is_featured || 0
    }))

    return NextResponse.json({
      success: true,
      cards: transformedCards
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
    const { cardId, cardGame, cardName, cardGrade, gradeName, yearCard, setName, edition, rarity, cardInfo, cardOwner, frontImage, backImage } = body

    // Validate required fields
    if (!cardId || !cardGame || !cardName || !cardGrade || !gradeName || !yearCard || !setName || !rarity) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 })
    }

    await initializePopulationReportDatabase()

    // Save images to storage and get file paths
    const frontImagePath = frontImage ? saveBase64Image(frontImage, cardId, 'front') : null
    const backImagePath = backImage ? saveBase64Image(backImage, cardId, 'back') : null

    console.log('[Add Card] Front image saved to:', frontImagePath)
    console.log('[Add Card] Back image saved to:', backImagePath)

    const cardData = {
      card_id: cardId,
      card_game: cardGame,
      card_name: cardName,
      card_grade: cardGrade,
      grade_name: gradeName,
      year_card: yearCard,
      set_name: setName,
      edition: edition || '',
      rarity: rarity,
      card_info: cardInfo || '',
      card_owner: cardOwner || 'Nexus TCG Grading',
      date_graded: new Date().toISOString(),
      front_image: frontImagePath || '',
      back_image: backImagePath || ''
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
