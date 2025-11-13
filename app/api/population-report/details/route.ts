import { NextRequest, NextResponse } from 'next/server'
import { populationReportDb, initializePopulationReportDatabase } from '@/lib/population-report-database'

export async function GET(req: NextRequest) {
  try {
    await initializePopulationReportDatabase()
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
      whereClause += ` AND strftime('%Y', date_graded) = ?`
      params.push(year)
    }
    if (set) {
      whereClause += ` AND set_name = ?`
      params.push(set)
    }

    // Get detailed grading information for a specific card
    const cardDetails = await populationReportDb.runQuery(`
      SELECT
        id,
        card_id,
        card_name,
        card_game,
        set_name,
        rarity,
        edition,
        card_grade as grade,
        card_grade as grade_name,
        date_graded as graded_date,
        card_owner as author
      FROM population_report_cards
      ${whereClause}
      ORDER BY card_grade DESC, created_at DESC
    `, params)

    // Get grade distribution for this card
    const gradeDistribution = await populationReportDb.runQuery(`
      SELECT
        card_grade as grade,
        COUNT(*) as count
      FROM population_report_cards
      ${whereClause}
      GROUP BY card_grade
      ORDER BY card_grade DESC
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
    const popularityRank = await populationReportDb.runQuery(`
      SELECT
        card_name,
        COUNT(*) as total_graded,
        (
          SELECT COUNT(*) + 1
          FROM (
            SELECT card_name, COUNT(*) as cnt
            FROM population_report_cards
            ${game ? `WHERE (${gameFilter})` : 'WHERE 1=1'}
            ${year ? 'AND strftime(\'%Y\', date_graded) = ?' : ''}
            ${set ? 'AND set_name = ?' : ''}
            GROUP BY card_name
            HAVING cnt > (SELECT COUNT(*) FROM population_report_cards WHERE card_name = ?)
          ) ranked
        ) as popularity_rank
      FROM population_report_cards
      ${whereClause}
      GROUP BY card_name
    `, [...params, cardName])

    const popularityResult = popularityRank.length > 0 ? popularityRank[0] : null

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
          popularityRank: popularityResult?.popularity_rank || 'N/A'
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
      return "UPPER(card_game) LIKE '%POKEMON%'"
    case 'yugioh':
      return "(UPPER(card_game) LIKE '%YU-GI-OH%' OR UPPER(card_game) LIKE '%YUGIOH%')"
    case 'mtg':
      return "(UPPER(card_game) LIKE '%MAGIC%' OR UPPER(card_game) LIKE '%MTG%')"
    case 'onepiece':
      return "(UPPER(card_game) LIKE '%ONE PIECE%' OR UPPER(card_game) LIKE '%ONEPIECE%')"
    default:
      return "1=1"
  }
}