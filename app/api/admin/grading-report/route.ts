import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware } from '@/lib/middleware/auth'
import { runQuery, initializeDatabase } from '@/lib/user-database'

export async function GET(req: NextRequest) {
  try {
    // Authenticate and check admin role
    const authResult = await authMiddleware(req)
    if ('error' in authResult) {
      return NextResponse.json({
        success: false,
        error: authResult.error
      }, { status: authResult.status })
    }

    const { user } = authResult
    if (user.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied. Admin role required.' 
      }, { status: 403 })
    }

    await initializeDatabase()

    // Get all graded cards with customer and order information
    const gradedCards = await runQuery(`
      SELECT 
        oi.*,
        o.order_number,
        o.customer_name,
        o.customer_email
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE oi.grading_status = 'graded' 
        AND oi.grade IS NOT NULL
      ORDER BY oi.updated_at DESC
    `)

    // Calculate statistics
    const stats = {
      totalGraded: gradedCards.length,
      averageGrade: 0,
      grade10Count: 0,
      grade10Percentage: 0,
      topGames: [],
      recentActivity: 0
    }

    if (gradedCards.length > 0) {
      // Calculate average grade
      const totalGrade = gradedCards.reduce((sum, card: any) => sum + parseFloat(card.grade), 0)
      stats.averageGrade = totalGrade / gradedCards.length

      // Count Grade 10s
      stats.grade10Count = gradedCards.filter((card: any) => parseFloat(card.grade) === 10).length
      stats.grade10Percentage = (stats.grade10Count / gradedCards.length) * 100

      // Top games
      const gameCounts = gradedCards.reduce((acc: any, card: any) => {
        acc[card.card_game] = (acc[card.card_game] || 0) + 1
        return acc
      }, {})

      stats.topGames = Object.entries(gameCounts)
        .map(([game, count]) => ({ game, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Recent activity (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      stats.recentActivity = gradedCards.filter((card: any) => card.updated_at > sevenDaysAgo).length
    }

    return NextResponse.json({
      success: true,
      gradedCards,
      stats
    })

  } catch (error: any) {
    console.error('❌ Grading report API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// POST endpoint for updating grades (admin only)
export async function POST(req: NextRequest) {
  try {
    // Authenticate and check admin role
    const authResult = await authMiddleware(req)
    if ('error' in authResult) {
      return NextResponse.json({
        success: false,
        error: authResult.error
      }, { status: authResult.status })
    }

    const { user } = authResult
    if (user.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied. Admin role required.' 
      }, { status: 403 })
    }

    const body = await req.json()
    const { action, itemId, grade, notes } = body

    await initializeDatabase()

    switch (action) {
      case 'update_grade':
        if (!itemId || !grade) {
          return NextResponse.json({
            success: false,
            error: 'Missing required fields: itemId and grade'
          }, { status: 400 })
        }

        const result = await runQuery(`
          UPDATE order_items 
          SET grade = ?, grade_notes = ?, grading_status = 'graded', updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `, [grade, notes || null, itemId])

        return NextResponse.json({
          success: true,
          message: 'Grade updated successfully'
        })

      case 'bulk_update':
        const { items } = body
        if (!Array.isArray(items)) {
          return NextResponse.json({
            success: false,
            error: 'Items must be an array'
          }, { status: 400 })
        }

        for (const item of items) {
          await runQuery(`
            UPDATE order_items 
            SET grade = ?, grade_notes = ?, grading_status = 'graded', updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
          `, [item.grade, item.notes || null, item.itemId])
        }

        return NextResponse.json({
          success: true,
          message: `Updated ${items.length} items successfully`
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action specified',
          availableActions: ['update_grade', 'bulk_update']
        }, { status: 400 })
    }

  } catch (error: any) {
    console.error('❌ Grading report update error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}