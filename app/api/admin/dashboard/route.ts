import { NextRequest, NextResponse } from 'next/server'
import { getDashboardStats } from '@/lib/tcgrading-database'

export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication middleware to check if user is admin
    // For now, allowing access for development
    
    const stats = getDashboardStats()
    
    return NextResponse.json(stats)

  } catch (error) {
    console.error('Dashboard stats API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
}