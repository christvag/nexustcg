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

// Helper function to delete card images from storage
function deleteCardImages(frontImage?: string, backImage?: string): void {
  const deleteImage = (imagePath?: string) => {
    if (!imagePath) return

    try {
      // Image paths are stored like: /storage/card_image/front_cards/filename.jpg
      // or card_image/front_cards/filename.jpg
      const relativePath = imagePath.startsWith('/storage/')
        ? imagePath.substring(9) // Remove '/storage/'
        : imagePath.startsWith('storage/')
        ? imagePath.substring(8) // Remove 'storage/'
        : imagePath

      const fullPath = path.join(process.cwd(), 'storage', relativePath)

      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath)
        console.log(`✅ Deleted image: ${fullPath}`)
      } else {
        console.log(`⚠️ Image not found (already deleted?): ${fullPath}`)
      }
    } catch (error) {
      console.error(`❌ Error deleting image ${imagePath}:`, error)
    }
  }

  deleteImage(frontImage)
  deleteImage(backImage)
}

// PUT - Update a graded card
export async function PUT(
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

    const body = await req.json()

    await initializePopulationReportDatabase()
    await populationReportDb.updateCard(cardId, body)

    return NextResponse.json({
      success: true,
      message: 'Card updated successfully'
    })
  } catch (error: any) {
    console.error('❌ Update card error:', error)
    return NextResponse.json({
      success: false,
      error: error.message.includes('UNIQUE constraint')
        ? 'Card ID already exists'
        : 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// DELETE - Delete a graded card
export async function DELETE(
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

    // Fetch card data to get image paths before deletion
    const card = await populationReportDb.getCardById(cardId)

    if (!card) {
      return NextResponse.json({
        success: false,
        error: 'Card not found'
      }, { status: 404 })
    }

    // Delete associated images from storage
    deleteCardImages(card.front_image, card.back_image)

    // Delete card from database
    await populationReportDb.deleteCard(cardId)

    return NextResponse.json({
      success: true,
      message: 'Card and associated images deleted successfully'
    })
  } catch (error: any) {
    console.error('❌ Delete card error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
