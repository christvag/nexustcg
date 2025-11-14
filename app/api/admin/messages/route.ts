import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { getDB } from '@/lib/user-database';

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

    const db = await getDB();

    // Build query
    let query = `
      SELECT
        sm.id,
        sm.user_id,
        sm.subject,
        sm.message,
        sm.status,
        sm.priority,
        sm.created_at,
        sm.updated_at,
        u.first_name,
        u.last_name,
        u.email
      FROM support_messages sm
      LEFT JOIN users u ON sm.user_id = u.id
    `;

    const conditions = [];
    const params: any[] = [];

    if (status) {
      conditions.push('sm.status = ?');
      params.push(status);
    }

    if (priority) {
      conditions.push('sm.priority = ?');
      params.push(priority);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY sm.created_at DESC';

    const allTickets = await new Promise<any[]>((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    // Map database results to API format
    const tickets = allTickets.map((row: any) => ({
      id: `TICKET-${String(row.id).padStart(3, '0')}`,
      customerId: String(row.user_id),
      customerName: `${row.first_name} ${row.last_name}`,
      customerEmail: row.email,
      orderId: null,
      subject: row.subject,
      status: row.status,
      priority: row.priority,
      category: 'general_inquiry',
      messages: [
        {
          id: `MSG-${row.id}`,
          from: 'customer',
          content: row.message,
          timestamp: row.created_at,
          attachments: []
        }
      ],
      assignedTo: null,
      createdAt: row.created_at,
      lastActivity: row.updated_at
    }));

    const startIndex = (page - 1) * limit;
    const paginatedTickets = tickets.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      tickets: paginatedTickets,
      total: tickets.length,
      page,
      limit,
      totalPages: Math.ceil(tickets.length / limit),
      statistics: {
        open: tickets.filter(t => t.status === 'open').length,
        inProgress: tickets.filter(t => t.status === 'in_progress').length,
        closed: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
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