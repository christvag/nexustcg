import { NextResponse } from 'next/server'
import { query } from '@/lib/database'

export async function GET() {
  try {
    // Test database connection with a simple query
    const result = await query('SELECT version() as version, current_database() as database, current_user as user')
    
    // Get table count
    const tableCount = await query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `)
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful!',
      database_info: result.rows[0],
      table_count: tableCount.rows[0].count,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('Database test failed:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
      error_code: error.code,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}