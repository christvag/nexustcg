import { NextRequest, NextResponse } from 'next/server'
import { populationReportDb, initializePopulationReportDatabase } from '@/lib/population-report-database'

export async function GET(req: NextRequest) {
  try {
    await initializePopulationReportDatabase()
    const url = new URL(req.url)
    const search = url.searchParams.get('search') || ''

    if (!search || search.trim().length < 2) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    // Search for cards matching the search term
    const sql = `
      SELECT
        id,
        card_id,
        card_name,
        card_game,
        card_grade,
        set_name,
        rarity,
        card_owner,
        strftime('%m', date_graded) as month_graded,
        strftime('%Y', date_graded) as year_graded,
        date_graded,
        front_image
      FROM population_report_cards
      WHERE UPPER(card_name) LIKE UPPER(?)
         OR UPPER(card_game) LIKE UPPER(?)
         OR UPPER(set_name) LIKE UPPER(?)
         OR UPPER(card_id) LIKE UPPER(?)
      ORDER BY created_at DESC
      LIMIT 50
    `

    const searchTerm = `%${search}%`
    const cards = await populationReportDb.runQuery(sql, [searchTerm, searchTerm, searchTerm, searchTerm])

    return NextResponse.json({
      success: true,
      data: cards.map(card => ({
        ...card,
        month_graded: parseInt(card.month_graded),
        year_graded: parseInt(card.year_graded)
      }))
    })

  } catch (error: any) {
    console.error('❌ Search error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
