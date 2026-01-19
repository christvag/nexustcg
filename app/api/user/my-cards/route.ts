import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware } from '@/lib/middleware/auth'
import { populationReportDb, initializePopulationReportDatabase } from '@/lib/population-report-database'

// Disable caching for this route
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authMiddleware(req)
    if ('error' in authResult) {
      return NextResponse.json({
        success: false,
        error: authResult.error
      }, { status: authResult.status })
    }

    const { user } = authResult
    const url = new URL(req.url)
    const email = url.searchParams.get('email')

    // Ensure user can only fetch their own cards
    if (email !== user.email) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized access'
      }, { status: 403 })
    }

    await initializePopulationReportDatabase()

    // Fetch cards owned by this user (matching card_owner to user email)
    const cards = await populationReportDb.runQuery(`
      SELECT
        id,
        card_id,
        card_game,
        card_name,
        card_grade,
        grade_name,
        year_card,
        set_name,
        edition,
        rarity,
        card_number,
        card_info,
        language,
        date_graded,
        front_image,
        back_image
      FROM population_report_cards
      WHERE card_owner = ?
      ORDER BY created_at DESC
    `, [email])

    return NextResponse.json({
      success: true,
      cards
    })

  } catch (error: any) {
    console.error('Error fetching user cards:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
