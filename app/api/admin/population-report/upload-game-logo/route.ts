import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'
import { cardGamesDb, initializeCardGamesDatabase } from '@/lib/card-games-database'

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

// POST - Upload game logo
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
    const logo = formData.get('logo') as File
    const game = formData.get('game') as string

    if (!logo || !game) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 })
    }

    // Create storage directory if it doesn't exist
    const storageDir = path.join(process.cwd(), 'storage', 'game_logos')
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true })
    }

    // Generate filename from game name
    const sanitizedGameName = game.toLowerCase().replace(/[^a-z0-9]/g, '_')
    const fileExtension = path.extname(logo.name)
    const filename = `${sanitizedGameName}${fileExtension}`
    const filePath = path.join(storageDir, filename)

    // Convert file to buffer and save
    const bytes = await logo.arrayBuffer()
    const buffer = Buffer.from(bytes)
    fs.writeFileSync(filePath, buffer)

    // Return the relative path for database storage
    const relativePath = `game_logos/${filename}`

    // Update database with logo path
    await initializeCardGamesDatabase()
    await cardGamesDb.updateGame(game, { logo_path: relativePath })

    return NextResponse.json({
      success: true,
      logoPath: relativePath,
      message: 'Logo uploaded successfully'
    })
  } catch (error: any) {
    console.error('❌ Logo upload error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
