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
    const profile = {
      id: userId,
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1 (555) 123-4567',
      memberSince: '2024-01-01T00:00:00Z',
      totalOrders: 15,
      totalSpent: 2245.50,
      preferences: {
        emailNotifications: true,
        smsNotifications: false,
        marketingEmails: true,
        newsletter: true
      },
      addresses: [
        {
          id: 'ADDR-001',
          type: 'shipping',
          name: 'Home Address',
          street: '123 Main Street',
          apartment: 'Apt 2B',
          city: 'Anytown',
          state: 'California',
          zipCode: '12345',
          country: 'United States',
          isDefault: true
        },
        {
          id: 'ADDR-002',
          type: 'billing',
          name: 'Work Address',
          street: '456 Business Ave',
          apartment: 'Suite 100',
          city: 'Business City',
          state: 'California',
          zipCode: '67890',
          country: 'United States',
          isDefault: false
        }
      ]
    };

    return NextResponse.json({ profile });
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

    const updateData = await request.json();

    // Mock response - replace with actual database update
    return NextResponse.json({ 
      success: true,
      profile: {
        id: userId,
        ...updateData,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}