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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Mock data - replace with actual database query
    const orders = [
      {
        id: 'ORD-2024-001',
        customerId: userId,
        items: [
          { 
            name: 'Pokemon Charizard Card', 
            quantity: 1, 
            price: 299.99,
            gradingService: 'Standard',
            expectedGrade: 'Mint 9+',
            images: ['card1.jpg']
          }
        ],
        total: 299.99,
        status: 'received',
        paymentStatus: 'paid',
        trackingNumber: 'TRK123456789',
        submissionDate: '2024-01-15T10:30:00Z',
        estimatedCompletion: '2024-01-25T17:00:00Z',
        currentStep: 'Authentication',
        stepProgress: 2,
        totalSteps: 5,
        statusHistory: [
          { status: 'submitted', timestamp: '2024-01-15T10:30:00Z', note: 'Order submitted successfully' },
          { status: 'received', timestamp: '2024-01-16T09:15:00Z', note: 'Package received at facility' }
        ],
        shippingAddress: {
          street: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zipCode: '12345'
        }
      },
      {
        id: 'ORD-2024-002',
        customerId: userId,
        items: [
          { 
            name: 'Yu-Gi-Oh Blue Eyes White Dragon', 
            quantity: 2, 
            price: 199.99,
            gradingService: 'Express',
            finalGrade: 'Mint 8',
            images: ['card2.jpg', 'card3.jpg']
          }
        ],
        total: 399.98,
        status: 'completed',
        paymentStatus: 'paid',
        trackingNumber: 'TRK987654321',
        submissionDate: '2024-01-10T14:20:00Z',
        completedDate: '2024-01-16T09:15:00Z',
        currentStep: 'Shipped',
        stepProgress: 5,
        totalSteps: 5,
        statusHistory: [
          { status: 'submitted', timestamp: '2024-01-10T14:20:00Z', note: 'Order submitted successfully' },
          { status: 'received', timestamp: '2024-01-11T08:30:00Z', note: 'Package received at facility' },
          { status: 'grading', timestamp: '2024-01-12T10:00:00Z', note: 'Cards being graded' },
          { status: 'encapsulation', timestamp: '2024-01-14T15:30:00Z', note: 'Cards being encapsulated' },
          { status: 'completed', timestamp: '2024-01-16T09:15:00Z', note: 'Order completed and shipped' }
        ]
      }
    ];

    let filteredOrders = orders;

    if (status) {
      filteredOrders = filteredOrders.filter(order => order.status === status);
    }

    const startIndex = (page - 1) * limit;
    const paginatedOrders = filteredOrders.slice(startIndex, startIndex + limit);

    return NextResponse.json({ 
      orders: paginatedOrders,
      total: filteredOrders.length,
      page,
      limit,
      totalPages: Math.ceil(filteredOrders.length / limit)
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}