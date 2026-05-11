import { NextRequest, NextResponse } from 'next/server'
import { populationReportDb, initializePopulationReportDatabase } from '@/lib/population-report-database'

export const dynamic = 'force-dynamic'

// All possible grades in display order (highest to lowest)
const ALL_GRADES = [
  '10+', '10', '9.5', '9', '8.5', '8', '7.5', '7',
  '6.5', '6', '5.5', '5', '4.5', '4', '3.5', '3',
  '2.5', '2', '1.5', '1', 'Auth'
]

export async function GET(req: NextRequest) {
  try {
    await initializePopulationReportDatabase()

    const url = new URL(req.url)
    const cardName = url.searchParams.get('card_name')
    const cardGame = url.searchParams.get('card_game')

    if (!cardName || !cardGame) {
      return NextResponse.json({
        success: false,
        error: 'card_name and card_game are required'
      }, { status: 400 })
    }

    // Get grade distribution counts
    const gradeCounts = await populationReportDb.runQuery(`
      SELECT
        TRIM(card_grade) as grade,
        COUNT(*) as count
      FROM population_report_cards
      WHERE card_name = ? AND card_game = ?
      GROUP BY TRIM(card_grade)
    `, [cardName, cardGame])

    // Get total count
    const totalResult = await populationReportDb.runQuery(`
      SELECT COUNT(*) as total
      FROM population_report_cards
      WHERE card_name = ? AND card_game = ?
    `, [cardName, cardGame])

    const total = totalResult.length > 0 ? totalResult[0].total : 0

    // Build ordered grades map with all grades defaulting to 0
    const grades: Record<string, number> = {}
    for (const grade of ALL_GRADES) {
      grades[grade] = 0
    }

    // Populate from query results
    for (const row of gradeCounts) {
      const gradeKey = row.grade
      if (gradeKey in grades) {
        grades[gradeKey] = row.count
      } else {
        // Handle any unexpected grade values
        grades[gradeKey] = row.count
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        card_name: cardName,
        card_game: cardGame,
        total,
        grades
      }
    })

  } catch (error: any) {
    console.error('Pop report API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
