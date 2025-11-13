import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware } from '@/lib/middleware/auth'
import { runQuery, runQuerySingle, initializeDatabase } from '@/lib/user-database'

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
    const cardName = url.searchParams.get('cardName')
    const game = url.searchParams.get('game')
    const year = url.searchParams.get('year')
    const set = url.searchParams.get('set')

    if (!cardName) {
      return NextResponse.json({
        success: false,
        error: 'Card name is required'
      }, { status: 400 })
    }

    const gameFilter = getGameFilter(game)
    
    // Build query parameters
    let whereClause = `WHERE grade IS NOT NULL AND card_name = ?`
    let params: any[] = [cardName]
    
    if (game) {
      whereClause += ` AND (${gameFilter})`
    }
    if (year) {
      whereClause += ` AND SUBSTR(created_at, 1, 4) = ?`
      params.push(year)
    }
    if (set) {
      whereClause += ` AND card_type = ?`
      params.push(set)
    }
    
    // Get detailed grading information for a specific card
    const cardDetails = await runQuery(`
      SELECT 
        id,
        card_number as card_id,
        card_name,
        card_game,
        card_type,
        card_rarity,
        card_number,
        grade,
        grade_notes,
        created_at as graded_date,
        oi.order_id
      FROM order_items oi
      ${whereClause}
      ORDER BY grade DESC, created_at DESC
    `, params)

    // Get grade distribution for this card
    const gradeDistribution = await runQuery(`
      SELECT 
        grade,
        COUNT(*) as count
      FROM order_items 
      ${whereClause}
      GROUP BY grade
      ORDER BY grade DESC
    `, params)

    // Calculate statistics
    const totalGraded = cardDetails.length
    const grades = cardDetails.map(card => parseInt(card.grade))
    const avgGrade = grades.length > 0 ? grades.reduce((a, b) => a + b, 0) / grades.length : 0
    const highestGrade = Math.max(...grades, 0)
    const lowestGrade = Math.min(...grades, 10)

    // Calculate grade percentages
    const gradeStats = gradeDistribution.map(dist => ({
      grade: dist.grade.toString(),
      count: dist.count,
      percentage: ((dist.count / totalGraded) * 100).toFixed(1)
    }))

    // Get popularity rank (how rare this card is)
    const popularityRank = await runQuerySingle(`
      SELECT 
        card_name,
        COUNT(*) as total_graded,
        (
          SELECT COUNT(*) + 1 
          FROM (
            SELECT card_name, COUNT(*) as cnt
            FROM order_items 
            WHERE grade IS NOT NULL
            ${game ? `AND (${gameFilter})` : ''}
            ${year ? 'AND SUBSTR(created_at, 1, 4) = ?' : ''}
            ${set ? 'AND card_type = ?' : ''}
            GROUP BY card_name
            HAVING cnt > (SELECT COUNT(*) FROM order_items WHERE grade IS NOT NULL AND card_name = ?)
          ) ranked
        ) as popularity_rank
      FROM order_items 
      ${whereClause}
      GROUP BY card_name
    `, [...params, cardName])

    return NextResponse.json({
      success: true,
      data: {
        cardName,
        game,
        year,
        set,
        summary: {
          totalGraded,
          avgGrade: parseFloat(avgGrade.toFixed(2)),
          highestGrade,
          lowestGrade,
          popularityRank: popularityRank?.popularity_rank || 'N/A'
        },
        gradeDistribution: gradeStats,
        individualCards: cardDetails.map(card => ({
          ...card,
          grade: parseInt(card.grade),
          gradedDate: new Date(card.graded_date).toLocaleDateString()
        }))
      }
    })

  } catch (error: any) {
    console.error('❌ Card details error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

function getGameFilter(game: string | null): string {
  if (!game) return '1=1'
  
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