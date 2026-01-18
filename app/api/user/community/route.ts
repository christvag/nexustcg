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
    const type = searchParams.get('type') || 'population_reports';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Mock data - replace with actual database query
    const populationReports = [
      {
        id: 'POP-001',
        cardId: 'CARD-001',
        cardName: 'Pokemon Charizard Base Set',
        setName: 'Base Set',
        cardNumber: '4/102',
        totalGraded: 15847,
        gradeCounts: {
          '10': 423,
          '9': 1245,
          '8': 2876,
          '7': 3456,
          '6': 2987,
          '5': 2134,
          '4': 1523,
          '3': 876,
          '2': 234,
          '1': 93
        },
        userCards: [
          {
            id: 'USER-CARD-001',
            orderId: 'ORD-2024-001',
            grade: '9',
            serialNumber: 'PSA123456789',
            comments: [
              {
                id: 'COMMENT-001',
                userId: userId,
                userName: 'John Doe',
                content: 'Amazing card! So happy with the PSA 9 grade.',
                timestamp: '2024-01-16T10:30:00Z',
                likes: 12,
                replies: []
              }
            ],
            submittedAt: '2024-01-15T10:30:00Z',
            gradedAt: '2024-01-16T09:15:00Z'
          }
        ]
      },
      {
        id: 'POP-002',
        cardId: 'CARD-002',
        cardName: 'Yu-Gi-Oh Blue Eyes White Dragon',
        setName: 'Legend of Blue Eyes White Dragon',
        cardNumber: 'LOB-001',
        totalGraded: 8953,
        gradeCounts: {
          '10': 156,
          '9': 678,
          '8': 1234,
          '7': 1876,
          '6': 1654,
          '5': 1432,
          '4': 987,
          '3': 543,
          '2': 287,
          '1': 106
        },
        userCards: [
          {
            id: 'USER-CARD-002',
            orderId: 'ORD-2024-002',
            grade: '8',
            serialNumber: 'PSA987654321',
            comments: [
              {
                id: 'COMMENT-002',
                userId: userId,
                userName: 'John Doe',
                content: 'Classic card, love the artwork. PSA 8 is solid!',
                timestamp: '2024-01-14T16:45:00Z',
                likes: 8,
                replies: [
                  {
                    id: 'REPLY-001',
                    userId: 'OTHER-USER-001',
                    userName: 'Card Collector',
                    content: 'Totally agree! This card never gets old.',
                    timestamp: '2024-01-14T17:30:00Z',
                    likes: 3
                  }
                ]
              }
            ],
            submittedAt: '2024-01-10T14:20:00Z',
            gradedAt: '2024-01-14T15:30:00Z'
          }
        ]
      }
    ];

    const startIndex = (page - 1) * limit;
    const paginatedReports = populationReports.slice(startIndex, startIndex + limit);

    return NextResponse.json({ 
      populationReports: paginatedReports,
      total: populationReports.length,
      page,
      limit,
      totalPages: Math.ceil(populationReports.length / limit)
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

    const decoded = verify(token, process.env.JWT_SECRET || 'nexus-tcgrading-secret-key-2024') as any;
    const userId = decoded.id;

    const { userCardId, content, parentCommentId } = await request.json();

    // Mock response - replace with actual database insert
    const newComment = {
      id: `COMMENT-${Date.now()}`,
      userId,
      userName: 'John Doe', // This should come from user profile
      userCardId,
      content,
      parentCommentId,
      timestamp: new Date().toISOString(),
      likes: 0,
      replies: []
    };

    return NextResponse.json({ 
      success: true,
      comment: newComment
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

    const { commentId, action } = await request.json();

    if (action === 'like') {
      // Mock response - replace with actual database update
      return NextResponse.json({ 
        success: true,
        commentId,
        newLikeCount: 13, // This should be calculated from actual data
        liked: true
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}