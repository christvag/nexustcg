import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Mock data - replace with actual database query
    const orders = [
      {
        id: 'ORD-2024-001',
        customerId: 'USR-001',
        customerName: 'John Smith',
        email: 'john@example.com',
        items: [
          { name: 'Pokemon Charizard Card', quantity: 1, price: 299.99 }
        ],
        total: 299.99,
        status: 'pending_grading',
        createdAt: '2024-01-15T10:30:00Z',
        shippingAddress: {
          street: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zipCode: '12345'
        }
      },
      {
        id: 'ORD-2024-002',
        customerId: 'USR-002',
        customerName: 'Sarah Johnson',
        email: 'sarah@example.com',
        items: [
          { name: 'Yu-Gi-Oh Blue Eyes White Dragon', quantity: 2, price: 199.99 }
        ],
        total: 399.98,
        status: 'completed',
        createdAt: '2024-01-14T14:20:00Z',
        completedAt: '2024-01-16T09:15:00Z'
      }
    ];

    return NextResponse.json({ orders, total: orders.length });
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

    const decoded = verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { orderId, status, notes } = await request.json();

    // Mock response - replace with actual database update
    return NextResponse.json({ 
      success: true,
      order: {
        id: orderId,
        status,
        notes,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}