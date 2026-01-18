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

    // Package pricing data - replace with actual database query
    const packagePricing = [
      {
        id: 'authentication',
        name: 'Authentication',
        price: 10,
        description: 'Basic card authentication service',
        features: ['Card Authentication', 'Basic Protection', 'Standard Report'],
        turnaroundTime: '3-5 business days',
        isActive: true,
        popularity: 25,
        lastUpdated: '2024-01-15T10:30:00Z'
      },
      {
        id: 'bulk',
        name: 'Bulk Grading',
        price: 12,
        description: 'Cost-effective grading for large quantities',
        features: ['Professional Grading', 'Bulk Pricing', 'Secure Storage', 'Digital Certificate'],
        turnaroundTime: '2-3 weeks',
        minimumCards: 50,
        isActive: true,
        popularity: 40,
        lastUpdated: '2024-01-14T14:20:00Z'
      },
      {
        id: 'standard',
        name: 'Standard',
        price: 15,
        description: 'Professional grading service',
        features: ['Professional Grading', 'Tamper-Evident Case', 'Digital Certificate', 'Insurance'],
        turnaroundTime: '7-10 business days',
        isActive: true,
        popularity: 55,
        lastUpdated: '2024-01-13T09:15:00Z'
      },
      {
        id: 'express',
        name: 'Express',
        price: 20,
        description: 'Fast-track grading service',
        features: ['Priority Processing', 'Professional Grading', 'Premium Case', 'Insurance', 'Express Shipping'],
        turnaroundTime: '3-5 business days',
        isActive: true,
        popularity: 30,
        lastUpdated: '2024-01-12T16:45:00Z'
      }
    ];

    const categoryPricing = [
      { category: 'pokemon', multiplier: 1.0, name: 'Pokemon' },
      { category: 'yugioh', multiplier: 0.8, name: 'Yu-Gi-Oh' },
      { category: 'mtg', multiplier: 1.2, name: 'Magic: The Gathering' },
      { category: 'sports', multiplier: 1.1, name: 'Sports Cards' }
    ];

    return NextResponse.json({ 
      packages: packagePricing,
      categoryPricing,
      lastUpdated: '2024-01-15T10:00:00Z'
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

    const { type, data } = await request.json();

    if (type === 'tier') {
      // Update pricing tier
      const { tierId, ...updateData } = data;
      
      return NextResponse.json({ 
        success: true,
        tier: {
          id: tierId,
          ...updateData,
          updatedAt: new Date().toISOString()
        }
      });
    } else if (type === 'category') {
      // Update category pricing
      const { category, multiplier } = data;
      
      return NextResponse.json({ 
        success: true,
        categoryPricing: {
          category,
          multiplier,
          updatedAt: new Date().toISOString()
        }
      });
    }

    return NextResponse.json({ error: 'Invalid update type' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}