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
    const paymentConfig = {
      stripe: {
        isEnabled: true,
        publicKey: 'pk_test_...',
        webhookEndpoint: '/api/webhooks/stripe',
        supportedMethods: ['card', 'apple_pay', 'google_pay'],
        currency: 'USD',
        lastUpdated: '2024-01-15T09:00:00Z'
      },
      paypal: {
        isEnabled: true,
        clientId: 'AXxxx...',
        environment: 'sandbox',
        webhookEndpoint: '/api/webhooks/paypal',
        supportedMethods: ['paypal', 'paypal_credit'],
        currency: 'USD',
        lastUpdated: '2024-01-15T09:00:00Z'
      },
      general: {
        processingFee: 2.9,
        processingFeeType: 'percentage',
        minimumAmount: 5.00,
        maximumAmount: 10000.00,
        refundPolicy: 'Within 30 days',
        autoRefundEnabled: false
      }
    };

    const recentTransactions = [
      {
        id: 'TXN-001',
        orderId: 'ORD-2024-001',
        amount: 299.99,
        currency: 'USD',
        method: 'stripe',
        status: 'completed',
        createdAt: '2024-01-15T14:30:00Z',
        customer: 'john@example.com'
      },
      {
        id: 'TXN-002',
        orderId: 'ORD-2024-002',
        amount: 399.98,
        currency: 'USD',
        method: 'paypal',
        status: 'completed',
        createdAt: '2024-01-14T16:45:00Z',
        customer: 'sarah@example.com'
      }
    ];

    return NextResponse.json({ 
      paymentConfig,
      recentTransactions,
      statistics: {
        totalTransactions: 1247,
        totalRevenue: 18542.50,
        successRate: 98.5,
        averageTransactionValue: 148.76
      }
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

    const { provider, config } = await request.json();

    // Mock response - replace with actual database update
    return NextResponse.json({ 
      success: true,
      paymentConfig: {
        provider,
        config: {
          ...config,
          updatedAt: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}