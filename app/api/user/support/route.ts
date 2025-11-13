import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    const userId = decoded.id;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Mock data - replace with actual database query
    const tickets = [
      {
        id: 'TICKET-001',
        customerId: userId,
        orderId: 'ORD-2024-001',
        subject: 'Question about grading timeline',
        status: 'open',
        priority: 'medium',
        category: 'general_inquiry',
        messages: [
          {
            id: 'MSG-001',
            from: 'customer',
            content: 'Hi, I submitted my card for grading last week. Can you provide an update on the timeline?',
            timestamp: '2024-01-15T10:30:00Z',
            attachments: []
          }
        ],
        createdAt: '2024-01-15T10:30:00Z',
        lastActivity: '2024-01-15T10:30:00Z'
      },
      {
        id: 'TICKET-002',
        customerId: userId,
        orderId: 'ORD-2024-002',
        subject: 'Thank you for excellent service',
        status: 'closed',
        priority: 'low',
        category: 'feedback',
        messages: [
          {
            id: 'MSG-002',
            from: 'customer',
            content: 'Just wanted to say thank you for the excellent grading service. Very happy with the results!',
            timestamp: '2024-01-14T16:20:00Z',
            attachments: []
          },
          {
            id: 'MSG-003',
            from: 'admin',
            content: 'Thank you so much for your feedback! We really appreciate customers like you.',
            timestamp: '2024-01-14T17:15:00Z',
            attachments: []
          }
        ],
        createdAt: '2024-01-14T16:20:00Z',
        lastActivity: '2024-01-14T17:15:00Z',
        resolvedAt: '2024-01-14T17:15:00Z'
      }
    ];

    let filteredTickets = tickets;

    if (status) {
      filteredTickets = filteredTickets.filter(ticket => ticket.status === status);
    }

    const startIndex = (page - 1) * limit;
    const paginatedTickets = filteredTickets.slice(startIndex, startIndex + limit);

    return NextResponse.json({ 
      tickets: paginatedTickets,
      total: filteredTickets.length,
      page,
      limit,
      totalPages: Math.ceil(filteredTickets.length / limit)
    });
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

    const decoded = verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    const userId = decoded.id;

    const { orderId, subject, message, category, attachments } = await request.json();

    // Mock response - replace with actual database insert
    const newTicket = {
      id: `TICKET-${Date.now()}`,
      customerId: userId,
      orderId,
      subject,
      status: 'open',
      priority: 'medium',
      category,
      messages: [{
        id: `MSG-${Date.now()}`,
        from: 'customer',
        content: message,
        timestamp: new Date().toISOString(),
        attachments: attachments || []
      }],
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };

    return NextResponse.json({ 
      success: true,
      ticket: newTicket
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}