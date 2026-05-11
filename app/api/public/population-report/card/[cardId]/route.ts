import { NextRequest, NextResponse } from 'next/server'
import { populationReportDb, initializePopulationReportDatabase } from '@/lib/population-report-database'

export async function GET(
  req: NextRequest,
  { params }: { params: { cardId: string } }
) {
  try {
    await initializePopulationReportDatabase()
    const { cardId } = params

    if (!cardId) {
      return NextResponse.json({
        success: false,
        error: 'Card ID is required'
      }, { status: 400 })
    }

    // Get card by card_id
    const card = await populationReportDb.getCardByCardId(cardId)

    if (!card) {
      return NextResponse.json({
        success: false,
        error: 'Card not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: card
    })

  } catch (error: any) {
    console.error('❌ Card detail error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
