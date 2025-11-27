import { NextRequest, NextResponse } from 'next/server'
import { populationReportDb, initializePopulationReportDatabase } from '@/lib/population-report-database'
import { cardGamesDb, initializeCardGamesDatabase } from '@/lib/card-games-database'

// Helper function to get game filter with parameterized query support
function getGameFilter(game: string, actualGameName?: string): { sql: string; params: string[] } {
  const gameLower = game.toLowerCase()

  // Handle common game variations with known aliases (no params needed for these)
  switch (gameLower) {
    case 'pokemon':
      return { sql: "UPPER(card_game) LIKE '%POKEMON%'", params: [] }
    case 'yugioh':
    case 'yu-gi-oh':
    case 'yu-gi-oh!':
      return { sql: "(UPPER(card_game) LIKE '%YU-GI-OH%' OR UPPER(card_game) LIKE '%YUGIOH%')", params: [] }
    case 'mtg':
    case 'magic':
    case 'magicthegathering':
    case 'magic: the gathering':
      return { sql: "(UPPER(card_game) LIKE '%MAGIC%' OR UPPER(card_game) LIKE '%MTG%')", params: [] }
    case 'onepiece':
    case 'one piece':
    case 'onepiececards':
      return { sql: "(UPPER(card_game) LIKE '%ONE PIECE%' OR UPPER(card_game) LIKE '%ONEPIECE%')", params: [] }
    default:
      // For dynamically added games, use the actual game name if provided
      // Otherwise fall back to the game ID
      const gameName = actualGameName || game
      return { sql: "UPPER(card_game) LIKE UPPER(?)", params: [`%${gameName}%`] }
  }
}

// Helper to look up actual game name from database by game ID
async function getActualGameName(gameId: string): Promise<string | undefined> {
  try {
    await initializeCardGamesDatabase()
    const games = await cardGamesDb.getAllGames()
    // Game ID is generated as: name.toLowerCase().replace(/[^a-z0-9]/g, '')
    const matchingGame = games.find(g => {
      const generatedId = g.game_name.toLowerCase().replace(/[^a-z0-9]/g, '')
      return generatedId === gameId.toLowerCase()
    })
    return matchingGame?.game_name
  } catch (error) {
    console.error('Error looking up game name:', error)
    return undefined
  }
}

export async function GET(req: NextRequest) {
  try {
    await initializePopulationReportDatabase()
    const url = new URL(req.url)
    const game = url.searchParams.get('game')
    const year = url.searchParams.get('year')
    const set = url.searchParams.get('set')
    const search = url.searchParams.get('search')

    if (!game) {
      // Return summary stats for all games
      const stats = await populationReportDb.runQuery(`
        SELECT
          CASE
            WHEN UPPER(card_game) LIKE '%POKEMON%' THEN 'pokemon'
            WHEN UPPER(card_game) LIKE '%YU-GI-OH%' OR UPPER(card_game) LIKE '%YUGIOH%' THEN 'yugioh'
            WHEN UPPER(card_game) LIKE '%MAGIC%' OR UPPER(card_game) LIKE '%MTG%' THEN 'mtg'
            WHEN UPPER(card_game) LIKE '%ONE PIECE%' OR UPPER(card_game) LIKE '%ONEPIECE%' THEN 'onepiece'
            ELSE 'other'
          END as game_type,
          card_game as card_game,
          COUNT(*) as total_cards,
          COUNT(CASE WHEN card_grade IN ('9', '10') THEN 1 END) as gem_mint_cards,
          COUNT(CASE WHEN card_grade IN ('8', '9', '10') THEN 1 END) as near_mint_plus,
          0 as avg_grade
        FROM population_report_cards
        GROUP BY game_type, card_game
        ORDER BY total_cards DESC
      `)

      return NextResponse.json({
        success: true,
        data: {
          type: 'games',
          games: stats
        }
      })
    }

    // Look up the actual game name for dynamically added games
    const actualGameName = await getActualGameName(game)

    if (!year) {
      // Return years for the selected game
      const gameFilter = getGameFilter(game, actualGameName)
      let sql = `
        SELECT
          strftime('%Y', date_graded) as year,
          COUNT(*) as total_cards,
          COUNT(CASE WHEN card_grade IN ('9', '10') THEN 1 END) as gem_mint_cards,
          0 as avg_grade,
          COUNT(DISTINCT set_name) as total_sets
        FROM population_report_cards
        WHERE (${gameFilter.sql})`

      let params: string[] = [...gameFilter.params]
      if (search) {
        sql += ` AND (UPPER(card_name) LIKE UPPER(?) OR UPPER(card_game) LIKE UPPER(?))`
        params.push(`%${search}%`, `%${search}%`)
      }

      sql += `
        GROUP BY strftime('%Y', date_graded)
        ORDER BY year DESC
      `

      const years = await populationReportDb.runQuery(sql, params)

      return NextResponse.json({
        success: true,
        data: {
          type: 'years',
          game,
          years
        }
      })
    }

    if (!set) {
      // Return sets for the selected game and year
      const gameFilter = getGameFilter(game, actualGameName)
      let sql = `
        SELECT
          COALESCE(set_name, 'Unknown Set') as set_name,
          COUNT(*) as total_cards,
          COUNT(CASE WHEN card_grade IN ('9', '10') THEN 1 END) as gem_mint_cards,
          COUNT(CASE WHEN card_grade IN ('8', '9', '10') THEN 1 END) as near_mint_plus,
          0 as avg_grade,
          COUNT(DISTINCT card_name) as unique_cards
        FROM population_report_cards
        WHERE (${gameFilter.sql})
          AND strftime('%Y', date_graded) = ?`

      let params: any[] = [...gameFilter.params, year]
      if (search) {
        sql += ` AND (UPPER(card_name) LIKE UPPER(?) OR UPPER(set_name) LIKE UPPER(?))`
        params.push(`%${search}%`, `%${search}%`)
      }

      sql += `
        GROUP BY set_name
        ORDER BY total_cards DESC
      `

      const sets = await populationReportDb.runQuery(sql, params)

      return NextResponse.json({
        success: true,
        data: {
          type: 'sets',
          game,
          year,
          sets
        }
      })
    }

    // Return cards for the selected game, year, and set
    const gameFilter = getGameFilter(game, actualGameName)
    let sql = `
      SELECT
        card_name,
        COALESCE(card_id, 'N/A') as card_id,
        rarity as card_rarity,
        COUNT(*) as total_graded,
        COUNT(CASE WHEN card_grade = '10' THEN 1 END) as grade_10,
        COUNT(CASE WHEN card_grade = '9' THEN 1 END) as grade_9,
        COUNT(CASE WHEN card_grade = '8' THEN 1 END) as grade_8,
        COUNT(CASE WHEN card_grade = '7' THEN 1 END) as grade_7,
        COUNT(CASE WHEN card_grade = '6' THEN 1 END) as grade_6,
        COUNT(CASE WHEN card_grade IN ('1','2','3','4','5') THEN 1 END) as grade_5_below,
        0 as avg_grade,
        MAX(card_grade) as highest_grade,
        MIN(card_grade) as lowest_grade
      FROM population_report_cards
      WHERE (${gameFilter.sql})
        AND strftime('%Y', date_graded) = ?
        AND set_name = ?`

    let params: any[] = [...gameFilter.params, year, set]
    if (search) {
      sql += ` AND (UPPER(card_name) LIKE UPPER(?) OR UPPER(card_id) LIKE UPPER(?))`
      params.push(`%${search}%`, `%${search}%`)
    }

    sql += `
      GROUP BY card_name, card_id, rarity
      ORDER BY total_graded DESC, card_name
    `

    const cards = await populationReportDb.runQuery(sql, params)

    return NextResponse.json({
      success: true,
      data: {
        type: 'cards',
        game,
        year,
        set,
        cards
      }
    })

  } catch (error: any) {
    console.error('❌ Population report error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}