import { NextRequest, NextResponse } from 'next/server';
import { getPackageByIdOrSlug } from '@/lib/pricing-database';

// GET single package by ID or slug (public endpoint)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const packageData = await getPackageByIdOrSlug(params.id);

    if (!packageData) {
      return NextResponse.json(
        { success: false, error: 'Package not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      package: packageData
    });
  } catch (error) {
    console.error('Error fetching package:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch package' },
      { status: 500 }
    );
  }
}
