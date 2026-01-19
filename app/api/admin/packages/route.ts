import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import {
  getAllPackagesAdmin,
  createPackage,
  updatePackage,
  deletePackage,
  togglePackageStatus
} from '@/lib/pricing-database';

// Middleware to check admin authentication
function checkAdminAuth(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return { error: 'Unauthorized', status: 401 };
  }

  try {
    const decoded = verify(token, process.env.JWT_SECRET || 'nexus-tcgrading-secret-key-2024') as any;

    if (decoded.role !== 'admin') {
      return { error: 'Forbidden - Admin access required', status: 403 };
    }

    return { user: decoded };
  } catch (error) {
    return { error: 'Invalid token', status: 401 };
  }
}

// GET all packages (including inactive ones for admin)
export async function GET(request: NextRequest) {
  const auth = checkAdminAuth(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    // For admin, we fetch all packages (not just active)
    const packages = await getAllPackagesAdmin();

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

// POST create new package
export async function POST(request: NextRequest) {
  const auth = checkAdminAuth(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const packageData = await request.json();

    // Validate required fields
    if (!packageData.id || !packageData.name || !packageData.price) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: id, name, price' },
        { status: 400 }
      );
    }

    // Generate slug if not provided
    if (!packageData.slug) {
      packageData.slug = packageData.name.toLowerCase().replace(/\s+/g, '-');
    }

    const newPackage = await createPackage(packageData);

    return NextResponse.json({
      success: true,
      package: newPackage,
      message: 'Package created successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating package:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create package' },
      { status: 500 }
    );
  }
}

// PUT update existing package
export async function PUT(request: NextRequest) {
  const auth = checkAdminAuth(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id, ...packageData } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Package ID is required' },
        { status: 400 }
      );
    }

    const updatedPackage = await updatePackage(id, packageData);

    return NextResponse.json({
      success: true,
      package: updatedPackage,
      message: 'Package updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating package:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update package' },
      { status: 500 }
    );
  }
}

// DELETE package
export async function DELETE(request: NextRequest) {
  const auth = checkAdminAuth(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Package ID is required' },
        { status: 400 }
      );
    }

    await deletePackage(id);

    return NextResponse.json({
      success: true,
      message: 'Package deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting package:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete package' },
      { status: 500 }
    );
  }
}

// PATCH toggle package status
export async function PATCH(request: NextRequest) {
  const auth = checkAdminAuth(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Package ID is required' },
        { status: 400 }
      );
    }

    const updatedPackage = await togglePackageStatus(id);

    return NextResponse.json({
      success: true,
      package: updatedPackage,
      message: 'Package status toggled successfully'
    });
  } catch (error: any) {
    console.error('Error toggling package status:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to toggle package status' },
      { status: 500 }
    );
  }
}
