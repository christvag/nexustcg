import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware } from '@/lib/middleware/auth'
import { runQuery, initializeDatabase } from '@/lib/user-database'

export async function GET(req: NextRequest) {
  try {
    const authResult = await authMiddleware(req)
    if ('error' in authResult) {
      return NextResponse.json({
        success: false,
        error: authResult.error
      }, { status: authResult.status })
    }

    const { user } = authResult
    if (user.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied. Admin role required.' 
      }, { status: 403 })
    }

    await initializeDatabase()
    const url = new URL(req.url)
    const game = url.searchParams.get('game')
    const year = url.searchParams.get('year')
    const set = url.searchParams.get('set')
    const search = url.searchParams.get('search')

    if (!game) {
      // Return summary stats for all games
      const stats = await runQuery(`
        SELECT 
          CASE 
            WHEN UPPER(card_game) LIKE '%POKEMON%' THEN 'pokemon'
            WHEN UPPER(card_game) LIKE '%YU-GI-OH%' THEN 'yugioh'
            WHEN UPPER(card_game) LIKE '%MAGIC%' OR UPPER(card_game) LIKE '%MTG%' THEN 'mtg'
            WHEN UPPER(card_game) LIKE '%ONE PIECE%' THEN 'onepiece'
            ELSE 'other'
          END as game_type,
          card_game,
          COUNT(*) as total_cards,
          COUNT(CASE WHEN grade >= 9 THEN 1 END) as gem_mint_cards,
          COUNT(CASE WHEN grade >= 8 THEN 1 END) as near_mint_plus,
          AVG(CAST(grade as REAL)) as avg_grade
        FROM order_items 
        WHERE grade IS NOT NULL
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

    if (!year) {
      // Return years for the selected game
      const gameFilter = getGameFilter(game)
      let sql = `
        SELECT 
          COALESCE(SUBSTR(oi.created_at, 1, 4), 'Unknown') as year,
          COUNT(*) as total_cards,
          COUNT(CASE WHEN grade >= 9 THEN 1 END) as gem_mint_cards,
          AVG(CAST(grade as REAL)) as avg_grade,
          COUNT(DISTINCT card_name) as total_sets
        FROM order_items oi 
        WHERE grade IS NOT NULL 
          AND (${gameFilter})`
      
      let params: string[] = []
      if (search) {
        sql += ` AND (UPPER(card_name) LIKE UPPER(?) OR UPPER(card_game) LIKE UPPER(?))`
        params = [`%${search}%`, `%${search}%`]
      }
      
      sql += `
        GROUP BY year
        ORDER BY year DESC
      `
      
      const years = await runQuery(sql, params)

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
      // Return sets for the selected game and year (using card_type as set proxy)
      const gameFilter = getGameFilter(game)
      let sql = `
        SELECT 
          COALESCE(card_type, 'Unknown Set') as set_name,
          COUNT(*) as total_cards,
          COUNT(CASE WHEN grade >= 9 THEN 1 END) as gem_mint_cards,
          COUNT(CASE WHEN grade >= 8 THEN 1 END) as near_mint_plus,
          AVG(CAST(grade as REAL)) as avg_grade,
          COUNT(DISTINCT card_name) as unique_cards
        FROM order_items 
        WHERE grade IS NOT NULL 
          AND (${gameFilter})
          AND SUBSTR(created_at, 1, 4) = ?`
      
      let params: any[] = [year]
      if (search) {
        sql += ` AND (UPPER(card_name) LIKE UPPER(?) OR UPPER(card_type) LIKE UPPER(?))`
        params.push(`%${search}%`, `%${search}%`)
      }
      
      sql += `
        GROUP BY card_type
        ORDER BY total_cards DESC
      `
      
      const sets = await runQuery(sql, params)

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
    const gameFilter = getGameFilter(game)
    let sql = `
      SELECT 
        card_name,
        COALESCE(card_number, 'N/A') as card_id,
        card_rarity,
        COUNT(*) as total_graded,
        COUNT(CASE WHEN grade = 10 THEN 1 END) as grade_10,
        COUNT(CASE WHEN grade = 9 THEN 1 END) as grade_9,
        COUNT(CASE WHEN grade = 8 THEN 1 END) as grade_8,
        COUNT(CASE WHEN grade = 7 THEN 1 END) as grade_7,
        COUNT(CASE WHEN grade = 6 THEN 1 END) as grade_6,
        COUNT(CASE WHEN grade <= 5 THEN 1 END) as grade_5_below,
        AVG(CAST(grade as REAL)) as avg_grade,
        MAX(grade) as highest_grade,
        MIN(grade) as lowest_grade
      FROM order_items 
      WHERE grade IS NOT NULL 
        AND (${gameFilter})
        AND SUBSTR(created_at, 1, 4) = ?
        AND card_type = ?`
    
    let params: any[] = [year, set]
    if (search) {
      sql += ` AND (UPPER(card_name) LIKE UPPER(?) OR UPPER(card_number) LIKE UPPER(?))`
      params.push(`%${search}%`, `%${search}%`)
    }
    
    sql += `
      GROUP BY card_name, card_number, card_rarity
      ORDER BY total_graded DESC, card_name
    `
    
    const cards = await runQuery(sql, params)

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

function getGameFilter(game: string): string {
  switch (game) {
    case 'pokemon':
      return "UPPER(card_game) LIKE '%POKEMON%'"
    case 'yugioh':
      return "UPPER(card_game) LIKE '%YU-GI-OH%'"
    case 'mtg':
      return "(UPPER(card_game) LIKE '%MAGIC%' OR UPPER(card_game) LIKE '%MTG%')"
    case 'onepiece':
      return "UPPER(card_game) LIKE '%ONE PIECE%'"
    default:
      return "1=1"
  }
}