import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verify(token, process.env.JWT_SECRET || 'nexus-tcgrading-secret-key-2024') as any;
    
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    // Mock data - replace with actual database query
    const users = [
      {
        id: 'USR-001',
        name: 'John Smith',
        email: 'john@example.com',
        role: 'customer',
        status: 'active',
        totalOrders: 12,
        totalSpent: 2450.00,
        createdAt: '2024-01-10T08:00:00Z',
        lastLogin: '2024-01-15T14:30:00Z'
      },
      {
        id: 'USR-002',
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        role: 'customer',
        status: 'active',
        totalOrders: 8,
        totalSpent: 1680.50,
        createdAt: '2024-01-05T10:15:00Z',
        lastLogin: '2024-01-14T16:45:00Z'
      },
      {
        id: 'USR-003',
        name: 'Mike Wilson',
        email: 'mike@example.com',
        role: 'customer',
        status: 'suspended',
        totalOrders: 3,
        totalSpent: 450.00,
        createdAt: '2023-12-20T12:30:00Z',
        lastLogin: '2024-01-01T09:20:00Z'
      }
    ];

    const filteredUsers = search 
      ? users.filter(user => 
          user.name.toLowerCase().includes(search.toLowerCase()) ||
          user.email.toLowerCase().includes(search.toLowerCase())
        )
      : users;

    const startIndex = (page - 1) * limit;
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + limit);

    return NextResponse.json({ 
      users: paginatedUsers,
      total: filteredUsers.length,
      page,
      limit,
      totalPages: Math.ceil(filteredUsers.length / limit)
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
    
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId, status, role } = await request.json();

    // Mock response - replace with actual database update
    return NextResponse.json({ 
      success: true,
      user: {
        id: userId,
        status,
        role,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}