import { NextRequest, NextResponse } from 'next/server';
import { getAllPackages } from '@/lib/pricing-database';

// Disable caching for this route
export const dynamic = 'force-dynamic';

// GET all active packages (public endpoint)
export async function GET(request: NextRequest) {
  try {
    const packages = await getAllPackages();

    return NextResponse.json({
      success: true,
      packages
    });
  } catch (error) {
    console.error('Error fetching packages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch packages' },
      { status: 500 }
    );
  }
}
