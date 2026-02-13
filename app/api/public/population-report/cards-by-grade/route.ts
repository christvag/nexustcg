import { NextRequest, NextResponse } from 'next/server'
import { populationReportDb, initializePopulationReportDatabase } from '@/lib/population-report-database'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    await initializePopulationReportDatabase()

    const url = new URL(req.url)
    const cardName = url.searchParams.get('card_name')
    const cardGame = url.searchParams.get('card_game')
    const grade = url.searchParams.get('grade')

    if (!cardName || !cardGame || !grade) {
      return NextResponse.json({
        success: false,
        error: 'card_name, card_game, and grade are required'
      }, { status: 400 })
    }

    const cards = await populationReportDb.runQuery(`
      SELECT
        id, card_id, card_name, card_game, card_grade, grade_name,
        set_name, rarity, edition, year_card, card_number, date_graded, front_image
      FROM population_report_cards
      WHERE card_name = ? AND card_game = ? AND TRIM(card_grade) = ?
      ORDER BY date_graded DESC
    `, [cardName, cardGame, grade])

    return NextResponse.json({
      success: true,
      data: {
        cards,
        total: cards.length,
        card_name: cardName,
        card_game: cardGame,
        grade
      }
    })

  } catch (error: any) {
    console.error('Cards by grade API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
