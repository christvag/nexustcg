import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

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

// POST - Upload card image
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

    const formData = await req.formData()
    const image = formData.get('image') as File
    const cardId = formData.get('card_id') as string
    const type = formData.get('type') as string // 'front' or 'back'

    if (!image || !cardId || !type) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 })
    }

    // Create storage directory if it doesn't exist
    const storageDir = path.join(process.cwd(), 'storage', 'card_image', `${type}_cards`)
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true })
    }

    // Generate unique filename
    const fileExtension = path.extname(image.name)
    const filename = `${cardId}_${Date.now()}${fileExtension}`
    const filePath = path.join(storageDir, filename)

    // Convert file to buffer and save
    const bytes = await image.arrayBuffer()
    const buffer = Buffer.from(bytes)
    fs.writeFileSync(filePath, buffer)

    // Return the relative path for database storage
    const relativePath = `card_image/${type}_cards/${filename}`

    return NextResponse.json({
      success: true,
      imagePath: relativePath,
      message: 'Image uploaded successfully'
    })
  } catch (error: any) {
    console.error('❌ Image upload error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
