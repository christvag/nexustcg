import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import fs from 'fs/promises'
import path from 'path'

const JWT_SECRET = process.env.JWT_SECRET || 'nexus-tcgrading-secret-key-2024'
const SETTINGS_FILE = path.join(process.cwd(), 'data', 'population-report-settings.json')

interface JWTPayload {
  userId: number
  email: string
  role: string
}

interface Settings {
  cardGames: string[]
  selectedGames: string[]
}

function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    return decoded
  } catch (error) {
    return null
  }
}

async function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), 'data')
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

async function loadSettings(): Promise<Settings> {
  try {
    await ensureDataDirectory()
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    // Return default settings if file doesn't exist
    return {
      cardGames: ['Pokemon', 'Yu-Gi-Oh!', 'MTG', 'One Piece'],
      selectedGames: ['Pokemon', 'Yu-Gi-Oh!', 'MTG', 'One Piece']
    }
  }
}

async function saveSettings(settings: Settings): Promise<void> {
  await ensureDataDirectory()
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8')
}

// GET - Get settings
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

    const settings = await loadSettings()

    return NextResponse.json({
      success: true,
      settings
    })
  } catch (error: any) {
    console.error('❌ Get settings error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// POST - Save settings
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
    const { cardGames, selectedGames } = body

    if (!Array.isArray(cardGames) || !Array.isArray(selectedGames)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid settings format'
      }, { status: 400 })
    }

    const settings: Settings = {
      cardGames,
      selectedGames
    }

    await saveSettings(settings)

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully'
    })
  } catch (error: any) {
    console.error('❌ Save settings error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
