import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware } from '@/lib/middleware/auth'
import { getNotionIntegration } from '@/lib/notion-integration'

export async function POST(req: NextRequest) {
  try {
    // Authenticate and check admin role
    const authResult = await authMiddleware(req)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { user } = authResult
    if (user.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied. Admin role required.' 
      }, { status: 403 })
    }

    const notion = getNotionIntegration()
    if (!notion) {
      return NextResponse.json({
        success: false,
        error: 'Notion integration not configured. Please check environment variables.',
        details: 'NOTION_SECRET_KEY and NOTION_DATABASE_ID are required'
      }, { status: 500 })
    }

    const body = await req.json()
    const { action } = body

    switch (action) {
      case 'create_database':
        try {
          const databaseId = await notion.createNotionDatabase()
          return NextResponse.json({
            success: true,
            message: 'Notion database created successfully',
            databaseId
          })
        } catch (error: any) {
          return NextResponse.json({
            success: false,
            error: 'Failed to create Notion database',
            details: error.message
          }, { status: 500 })
        }

      case 'sync_data':
        try {
          const result = await notion.syncCardPopularityData()
          return NextResponse.json({
            success: true,
            message: `Sync completed: ${result.synced} cards synced, ${result.errors} errors`,
            ...result
          })
        } catch (error: any) {
          return NextResponse.json({
            success: false,
            error: 'Failed to sync data to Notion',
            details: error.message
          }, { status: 500 })
        }

      case 'get_report':
        try {
          const report = await notion.getPopularityReport()
          return NextResponse.json({
            success: true,
            data: report
          })
        } catch (error: any) {
          return NextResponse.json({
            success: false,
            error: 'Failed to generate popularity report',
            details: error.message
          }, { status: 500 })
        }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action specified',
          availableActions: ['create_database', 'sync_data', 'get_report']
        }, { status: 400 })
    }

  } catch (error: any) {
    console.error('❌ Notion sync API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// GET endpoint for checking Notion integration status
export async function GET(req: NextRequest) {
  try {
    const authResult = await authMiddleware(req)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { user } = authResult
    if (user.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied. Admin role required.' 
      }, { status: 403 })
    }

    const notion = getNotionIntegration()
    const isConfigured = !!notion
    const envVars = {
      hasSecretKey: !!process.env.NOTION_SECRET_KEY,
      hasDatabaseId: !!process.env.NOTION_DATABASE_ID,
      hasParentPageId: !!process.env.NOTION_PARENT_PAGE_ID
    }

    if (notion) {
      try {
        const report = await notion.getPopularityReport()
        return NextResponse.json({
          success: true,
          configured: isConfigured,
          environment: envVars,
          cardCount: report.length,
          lastSync: new Date().toISOString()
        })
      } catch (error: any) {
        return NextResponse.json({
          success: true,
          configured: isConfigured,
          environment: envVars,
          error: 'Database accessible but sync failed',
          details: error.message
        })
      }
    }

    return NextResponse.json({
      success: false,
      configured: isConfigured,
      environment: envVars,
      error: 'Notion integration not configured'
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Failed to check Notion status',
      details: error.message
    }, { status: 500 })
  }
}