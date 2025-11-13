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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Mock data - replace with actual database query
    const tickets = [
      {
        id: 'TICKET-001',
        customerId: 'USR-001',
        customerName: 'John Smith',
        customerEmail: 'john@example.com',
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
        assignedTo: null,
        createdAt: '2024-01-15T10:30:00Z',
        lastActivity: '2024-01-15T10:30:00Z'
      },
      {
        id: 'TICKET-002',
        customerId: 'USR-002',
        customerName: 'Sarah Johnson',
        customerEmail: 'sarah@example.com',
        orderId: 'ORD-2024-002',
        subject: 'Damaged card received',
        status: 'in_progress',
        priority: 'high',
        category: 'damage_claim',
        messages: [
          {
            id: 'MSG-002',
            from: 'customer',
            content: 'I received my graded card today but the case appears to be cracked. Can you help?',
            timestamp: '2024-01-14T14:20:00Z',
            attachments: ['image1.jpg', 'image2.jpg']
          },
          {
            id: 'MSG-003',
            from: 'admin',
            content: 'Thank you for bringing this to our attention. We will review your case and get back to you within 24 hours with a resolution.',
            timestamp: '2024-01-14T15:45:00Z',
            attachments: []
          }
        ],
        assignedTo: 'admin-001',
        createdAt: '2024-01-14T14:20:00Z',
        lastActivity: '2024-01-14T15:45:00Z'
      },
      {
        id: 'TICKET-003',
        customerId: 'USR-003',
        customerName: 'Mike Wilson',
        customerEmail: 'mike@example.com',
        orderId: null,
        subject: 'Pricing question for bulk submission',
        status: 'closed',
        priority: 'low',
        category: 'pricing_inquiry',
        messages: [
          {
            id: 'MSG-004',
            from: 'customer',
            content: 'Do you offer discounts for bulk submissions of 50+ cards?',
            timestamp: '2024-01-12T09:15:00Z',
            attachments: []
          },
          {
            id: 'MSG-005',
            from: 'admin',
            content: 'Yes, we offer a 10% discount for submissions of 50+ cards and 15% for 100+ cards. Please contact us directly for custom pricing.',
            timestamp: '2024-01-12T11:30:00Z',
            attachments: []
          }
        ],
        assignedTo: 'admin-002',
        createdAt: '2024-01-12T09:15:00Z',
        lastActivity: '2024-01-12T11:30:00Z',
        resolvedAt: '2024-01-12T11:30:00Z'
      }
    ];

    let filteredTickets = tickets;

    if (status) {
      filteredTickets = filteredTickets.filter(t => t.status === status);
    }

    if (priority) {
      filteredTickets = filteredTickets.filter(t => t.priority === priority);
    }

    const startIndex = (page - 1) * limit;
    const paginatedTickets = filteredTickets.slice(startIndex, startIndex + limit);

    return NextResponse.json({ 
      tickets: paginatedTickets,
      total: filteredTickets.length,
      page,
      limit,
      totalPages: Math.ceil(filteredTickets.length / limit),
      statistics: {
        open: tickets.filter(t => t.status === 'open').length,
        inProgress: tickets.filter(t => t.status === 'in_progress').length,
        closed: tickets.filter(t => t.status === 'closed').length,
        averageResponseTime: '2.5 hours'
      }
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
    
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { ticketId, content, attachments } = await request.json();

    // Mock response - replace with actual database insert
    const newMessage = {
      id: `MSG-${Date.now()}`,
      ticketId,
      from: 'admin',
      content,
      attachments: attachments || [],
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({ 
      success: true,
      message: newMessage
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

    const decoded = verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { ticketId, status, assignedTo, priority } = await request.json();

    // Mock response - replace with actual database update
    return NextResponse.json({ 
      success: true,
      ticket: {
        id: ticketId,
        status,
        assignedTo,
        priority,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}