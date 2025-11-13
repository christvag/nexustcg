import { NextRequest, NextResponse } from 'next/server'
import { gradedCardsDb, initializeGradedCardsDatabase } from '@/lib/graded-cards-database'

export async function GET(req: NextRequest) {
  try {
    await initializeGradedCardsDatabase()
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
    let whereClause = `WHERE card_name = ?`
    let params: any[] = [cardName]
    
    if (game) {
      whereClause += ` AND (${gameFilter})`
    }
    if (year) {
      whereClause += ` AND year_card = ?`
      params.push(year)
    }
    if (set) {
      whereClause += ` AND set_name = ?`
      params.push(set)
    }
    
    // Get detailed grading information for a specific card
    const cardDetails = await gradedCardsDb.runQuery(`
      SELECT 
        id,
        card_id,
        card_name,
        card_type,
        set_name,
        rarity,
        edition,
        grade,
        grade_name,
        date_grade as graded_date,
        year_card,
        author
      FROM graded_cards
      ${whereClause}
      ORDER BY grade DESC, created_at DESC
    `, params)

    // Get grade distribution for this card
    const gradeDistribution = await gradedCardsDb.runQuery(`
      SELECT 
        grade,
        COUNT(*) as count
      FROM graded_cards 
      ${whereClause}
      GROUP BY grade
      ORDER BY grade DESC
    `, params)

    // Calculate statistics
    const totalGraded = cardDetails.length
    const grades = cardDetails.map(card => parseFloat(card.grade))
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
    const popularityRank = await gradedCardsDb.runQuerySingle(`
      SELECT 
        card_name,
        COUNT(*) as total_graded,
        (
          SELECT COUNT(*) + 1 
          FROM (
            SELECT card_name, COUNT(*) as cnt
            FROM graded_cards 
            ${game ? `WHERE (${gameFilter})` : 'WHERE 1=1'}
            ${year ? 'AND year_card = ?' : ''}
            ${set ? 'AND set_name = ?' : ''}
            GROUP BY card_name
            HAVING cnt > (SELECT COUNT(*) FROM graded_cards WHERE card_name = ?)
          ) ranked
        ) as popularity_rank
      FROM graded_cards 
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
          grade: parseFloat(card.grade),
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
      return "UPPER(card_type) LIKE '%POKEMON%'"
    case 'yugioh':
      return "(UPPER(card_type) LIKE '%YU-GI-OH%' OR UPPER(card_type) LIKE '%YUGIOH%')"
    case 'mtg':
      return "(UPPER(card_type) LIKE '%MAGIC%' OR UPPER(card_type) LIKE '%MTG%')"
    case 'onepiece':
      return "(UPPER(card_type) LIKE '%ONE PIECE%' OR UPPER(card_type) LIKE '%ONEPIECE%')"
    default:
      return "1=1"
  }
}