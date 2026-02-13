import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verify(token, process.env.JWT_SECRET || 'nexus-tcgrading-secret-key-2024') as any;
    const userId = decoded.id;

    // Mock data - replace with actual database query
    const addresses = [
      {
        id: 'ADDR-001',
        userId,
        type: 'shipping',
        name: 'Home Address',
        firstName: 'John',
        lastName: 'Doe',
        company: '',
        street: '123 Main Street',
        apartment: 'Apt 2B',
        city: 'Anytown',
        state: 'California',
        zipCode: '12345',
        country: 'United States',
        phone: '+1 (555) 123-4567',
        isDefault: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T10:30:00Z'
      },
      {
        id: 'ADDR-002',
        userId,
        type: 'billing',
        name: 'Work Address',
        firstName: 'John',
        lastName: 'Doe',
        company: 'ABC Corp',
        street: '456 Business Avenue',
        apartment: 'Suite 100',
        city: 'Business City',
        state: 'California',
        zipCode: '67890',
        country: 'United States',
        phone: '+1 (555) 987-6543',
        isDefault: false,
        createdAt: '2024-01-05T00:00:00Z',
        updatedAt: '2024-01-05T00:00:00Z'
      }
    ];

    return NextResponse.json({ addresses });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verify(token, process.env.JWT_SECRET || 'nexus-tcgrading-secret-key-2024') as any;
    const userId = decoded.id;

    const addressData = await request.json();

    // Mock response - replace with actual database insert
    const newAddress = {
      id: `ADDR-${Date.now()}`,
      userId,
      ...addressData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({ 
      success: true,
      address: newAddress
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verify(token, process.env.JWT_SECRET || 'nexus-tcgrading-secret-key-2024') as any;
    const userId = decoded.id;

    const { addressId, ...updateData } = await request.json();

    // Mock response - replace with actual database update
    return NextResponse.json({ 
      success: true,
      address: {
        id: addressId,
        userId,
        ...updateData,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verify(token, process.env.JWT_SECRET || 'nexus-tcgrading-secret-key-2024') as any;
    const userId = decoded.id;

    const { searchParams } = new URL(request.url);
    const addressId = searchParams.get('id');

    if (!addressId) {
      return NextResponse.json({ error: 'Address ID required' }, { status: 400 });
    }

    // Mock response - replace with actual database delete
    return NextResponse.json({ 
      success: true,
      addressId,
      deletedAt: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}