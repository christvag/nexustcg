import { NextRequest, NextResponse } from 'next/server'
import { cardGamesDb, initializeCardGamesDatabase } from '@/lib/card-games-database'

// Disable caching for this route - games list should always be fresh
export const dynamic = 'force-dynamic'

// GET - Get active games (public endpoint)
export async function GET(req: NextRequest) {
  try {
    await initializeCardGamesDatabase()
    const games = await cardGamesDb.getActiveGames()

    return NextResponse.json({
      success: true,
      games: games.map(game => ({
        id: game.game_name.toLowerCase().replace(/[^a-z0-9]/g, ''),
        name: game.game_name,
        logo_path: game.logo_path
      }))
    })
  } catch (error: any) {
    console.error('❌ Get games error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
