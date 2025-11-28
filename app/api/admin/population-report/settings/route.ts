import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { cardGamesDb, initializeCardGamesDatabase } from '@/lib/card-games-database'

// Disable caching for this route - settings should always be fresh
export const dynamic = 'force-dynamic'

const JWT_SECRET = process.env.JWT_SECRET || 'nexus-tcgrading-secret-key-2024'

interface JWTPayload {
  userId: number
  email: string
  role: string
}

interface Settings {
  cardGames: string[]
  selectedGames: string[]
  gameLogos?: { [key: string]: string }
}

function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    return decoded
  } catch (error) {
    return null
  }
}

async function loadSettings(): Promise<Settings> {
  try {
    await initializeCardGamesDatabase()
    const games = await cardGamesDb.getAllGames()
    const activeGames = games.filter(g => g.is_active === 1)

    const cardGames = games.map(g => g.game_name)
    const selectedGames = activeGames.map(g => g.game_name)
    const gameLogos: { [key: string]: string } = {}

    games.forEach(game => {
      if (game.logo_path) {
        gameLogos[game.game_name] = game.logo_path
      }
    })

    return {
      cardGames,
      selectedGames,
      gameLogos
    }
  } catch (error) {
    console.error('Error loading settings:', error)
    return {
      cardGames: ['Pokemon', 'Yu-Gi-Oh!', 'MTG', 'One Piece'],
      selectedGames: ['Pokemon', 'Yu-Gi-Oh!', 'MTG', 'One Piece'],
      gameLogos: {}
    }
  }
}

async function saveSettings(settings: Settings): Promise<void> {
  await initializeCardGamesDatabase()

  // Get all current games from database
  const currentGames = await cardGamesDb.getAllGames()
  const currentGameNames = currentGames.map(g => g.game_name)

  // Add new games
  for (const gameName of settings.cardGames) {
    if (!currentGameNames.includes(gameName)) {
      const isActive = settings.selectedGames.includes(gameName) ? 1 : 0
      const logoPath = settings.gameLogos?.[gameName] || null
      await cardGamesDb.addGame({
        game_name: gameName,
        logo_path: logoPath,
        is_active: isActive,
        display_order: settings.cardGames.indexOf(gameName)
      })
    } else {
      // Update existing games
      const isActive = settings.selectedGames.includes(gameName) ? 1 : 0
      await cardGamesDb.updateGame(gameName, { is_active: isActive })
    }
  }

  // Remove games that are no longer in the list
  for (const currentGame of currentGames) {
    if (!settings.cardGames.includes(currentGame.game_name)) {
      await cardGamesDb.deleteGame(currentGame.game_name)
    }
  }
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
    const { cardGames, selectedGames, gameLogos } = body

    if (!Array.isArray(cardGames) || !Array.isArray(selectedGames)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid settings format'
      }, { status: 400 })
    }

    const settings: Settings = {
      cardGames,
      selectedGames,
      gameLogos: gameLogos || {}
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
