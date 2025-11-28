import { NextRequest, NextResponse } from 'next/server'
import { populationReportDb, initializePopulationReportDatabase } from '@/lib/population-report-database'

// Disable caching for this route
export const dynamic = 'force-dynamic'

// GET - Get card details by card_id (public endpoint)
export async function GET(
  req: NextRequest,
  { params }: { params: { cardId: string } }
) {
  try {
    const cardId = params.cardId

    if (!cardId) {
      return NextResponse.json({
        success: false,
        error: 'Card ID is required'
      }, { status: 400 })
    }

    await initializePopulationReportDatabase()
    const card = await populationReportDb.getCardByCardId(cardId)

    if (!card) {
      return NextResponse.json({
        success: false,
        error: 'Card not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      card
    })
  } catch (error: any) {
    console.error('❌ Get card error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
