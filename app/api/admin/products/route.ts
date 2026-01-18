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
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    // Mock data - replace with actual database query
    const products = [
      {
        id: 'PROD-001',
        name: 'Pokemon Card Grading',
        category: 'pokemon',
        basePrice: 15.00,
        expressPrice: 25.00,
        turnaroundTime: '7-10 business days',
        expressTurnaround: '2-3 business days',
        status: 'active',
        description: 'Professional grading service for Pokemon cards',
        createdAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 'PROD-002',
        name: 'Yu-Gi-Oh Card Grading',
        category: 'yugioh',
        basePrice: 12.00,
        expressPrice: 22.00,
        turnaroundTime: '7-10 business days',
        expressTurnaround: '2-3 business days',
        status: 'active',
        description: 'Professional grading service for Yu-Gi-Oh cards',
        createdAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 'PROD-003',
        name: 'MTG Card Grading',
        category: 'mtg',
        basePrice: 18.00,
        expressPrice: 30.00,
        turnaroundTime: '7-10 business days',
        expressTurnaround: '2-3 business days',
        status: 'active',
        description: 'Professional grading service for Magic: The Gathering cards',
        createdAt: '2024-01-01T00:00:00Z'
      }
    ];

    let filteredProducts = products;

    if (category) {
      filteredProducts = filteredProducts.filter(p => p.category === category);
    }

    if (search) {
      filteredProducts = filteredProducts.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    return NextResponse.json({ 
      products: filteredProducts,
      total: filteredProducts.length
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
    
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const productData = await request.json();

    // Mock response - replace with actual database insert
    const newProduct = {
      id: `PROD-${Date.now()}`,
      ...productData,
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    return NextResponse.json({ 
      success: true,
      product: newProduct
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

    const { productId, ...updateData } = await request.json();

    // Mock response - replace with actual database update
    return NextResponse.json({ 
      success: true,
      product: {
        id: productId,
        ...updateData,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}