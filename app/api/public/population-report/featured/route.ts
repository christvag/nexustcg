import { NextRequest, NextResponse } from 'next/server'
import { populationReportDb, initializePopulationReportDatabase } from '@/lib/population-report-database'

// Disable caching for this route
export const dynamic = 'force-dynamic'

// GET - Get featured cards for public display
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '4')

    await initializePopulationReportDatabase()
    const featuredCards = await populationReportDb.getFeaturedCards(limit)

    // Transform data for frontend consumption
    const transformedCards = featuredCards.map(card => ({
      id: card.id,
      card_id: card.card_id,
      card_name: card.card_name,
      card_game: card.card_game,
      card_grade: card.card_grade,
      grade_name: card.grade_name,
      set_name: card.set_name,
      rarity: card.rarity,
      year_card: card.year_card,
      language: card.language || 'English',
      front_image: card.front_image,
      date_graded: card.date_graded
    }))

    return NextResponse.json({
      success: true,
      data: transformedCards
    })
  } catch (error: any) {
    console.error('❌ Get featured cards error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
