import { NextRequest, NextResponse } from 'next/server'
import { populationReportDb, initializePopulationReportDatabase } from '@/lib/population-report-database'

export async function GET(req: NextRequest) {
  try {
    await initializePopulationReportDatabase()
    const url = new URL(req.url)
    const limit = parseInt(url.searchParams.get('limit') || '20')

    // Get Pokemon cards
    const sql = `
      SELECT
        id,
        card_id,
        card_name,
        card_game,
        card_grade,
        set_name,
        rarity,
        strftime('%m', date_graded) as month_graded,
        strftime('%Y', date_graded) as year_graded,
        date_graded,
        front_image
      FROM population_report_cards
      WHERE UPPER(card_game) LIKE '%POKEMON%'
      ORDER BY created_at DESC
      LIMIT ?
    `

    const cards = await populationReportDb.runQuery(sql, [limit])

    // Get total count
    const countSql = `
      SELECT COUNT(*) as total
      FROM population_report_cards
      WHERE UPPER(card_game) LIKE '%POKEMON%'
    `
    const countResult = await populationReportDb.runQuery(countSql)
    const total = countResult[0]?.total || 0

    return NextResponse.json({
      success: true,
      data: {
        cards: cards.map(card => ({
          ...card,
          month_graded: parseInt(card.month_graded),
          year_graded: parseInt(card.year_graded)
        })),
        total
      }
    })

  } catch (error: any) {
    console.error('❌ Pokemon cards error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
