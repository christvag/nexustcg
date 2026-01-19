import { NextRequest, NextResponse } from 'next/server';
import { getAllPackages } from '@/lib/pricing-database';

// Disable caching for this route
export const dynamic = 'force-dynamic';

// GET all active packages (public endpoint - NO AUTH REQUIRED)
export async function GET(request: NextRequest) {
  console.log('[API /api/packages] Fetching packages - public endpoint');

  try {
    const packages = await getAllPackages();
    console.log(`[API /api/packages] Found ${packages.length} packages`);

    return NextResponse.json({
      success: true,
      packages
    });
  } catch (error) {
    console.error('[API /api/packages] Error fetching packages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch packages' },
      { status: 500 }
    );
  }
}
