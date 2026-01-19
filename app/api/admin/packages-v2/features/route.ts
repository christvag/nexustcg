import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import sqlite3 from 'sqlite3'
import path from 'path'

// id: api-admin-packages-v2-features-001
const dbPath = path.join(process.cwd(), 'database', 'user-management.db')
const JWT_SECRET = process.env.JWT_SECRET || 'nexus-tcgrading-secret-key-2024'

export const dynamic = 'force-dynamic'

function checkAdminAuth(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return { error: 'Unauthorized', status: 401 }

  try {
    const decoded = verify(token, JWT_SECRET) as any
    if (decoded.role !== 'admin') return { error: 'Forbidden', status: 403 }
    return { user: decoded }
  } catch {
    return { error: 'Invalid token', status: 401 }
  }
}

function runQuery<T>(query: string, params: any[] = []): Promise<T> {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath)
    if (query.trim().toUpperCase().startsWith('SELECT')) {
      db.all(query, params, (err, rows) => {
        db.close()
        if (err) reject(err)
        else resolve(rows as T)
      })
    } else {
      db.run(query, params, function(err) {
        db.close()
        if (err) reject(err)
        else resolve({ lastID: this.lastID, changes: this.changes } as T)
      })
    }
  })
}

// GET - Fetch all features
export async function GET(request: NextRequest) {
  const auth = checkAdminAuth(request)
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const features = await runQuery<any[]>(`
      SELECT * FROM package_features_v2 ORDER BY display_order ASC
    `)

    return NextResponse.json({
      success: true,
      features
    })
  } catch (error) {
    console.error('[API /api/admin/packages-v2/features] GET Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch features' },
      { status: 500 }
    )
  }
}

// POST - Create a new feature
export async function POST(request: NextRequest) {
  const auth = checkAdminAuth(request)
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const body = await request.json()
    const {
      name,
      description,
      category = 'general',
      display_order = 0,
      is_active = true
    } = body

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Feature name is required' },
        { status: 400 }
      )
    }

    const result = await runQuery<any>(`
      INSERT INTO package_features_v2 (name, description, category, display_order, is_active)
      VALUES (?, ?, ?, ?, ?)
    `, [name, description, category, display_order, is_active ? 1 : 0])

    // Create default feature values for all existing packages
    const packages = await runQuery<any[]>('SELECT id FROM packages_v2')
    for (const pkg of packages) {
      await runQuery(`
        INSERT INTO package_feature_values_v2 (package_id, feature_id, value_type, is_checked)
        VALUES (?, ?, 'check', 0)
      `, [pkg.id, result.lastID])
    }

    return NextResponse.json({
      success: true,
      message: 'Feature created successfully',
      featureId: result.lastID
    }, { status: 201 })
  } catch (error: any) {
    console.error('[API /api/admin/packages-v2/features] POST Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create feature' },
      { status: 500 }
    )
  }
}

// PUT - Update a feature
export async function PUT(request: NextRequest) {
  const auth = checkAdminAuth(request)
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Feature ID is required' },
        { status: 400 }
      )
    }

    const fields = []
    const values = []

    if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name) }
    if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description) }
    if (updates.category !== undefined) { fields.push('category = ?'); values.push(updates.category) }
    if (updates.display_order !== undefined) { fields.push('display_order = ?'); values.push(updates.display_order) }
    if (updates.is_active !== undefined) { fields.push('is_active = ?'); values.push(updates.is_active ? 1 : 0) }

    if (fields.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      )
    }

    values.push(id)
    await runQuery(`UPDATE package_features_v2 SET ${fields.join(', ')} WHERE id = ?`, values)

    return NextResponse.json({
      success: true,
      message: 'Feature updated successfully'
    })
  } catch (error: any) {
    console.error('[API /api/admin/packages-v2/features] PUT Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update feature' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a feature
export async function DELETE(request: NextRequest) {
  const auth = checkAdminAuth(request)
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Feature ID is required' },
        { status: 400 }
      )
    }

    await runQuery('DELETE FROM package_features_v2 WHERE id = ?', [id])

    return NextResponse.json({
      success: true,
      message: 'Feature deleted successfully'
    })
  } catch (error: any) {
    console.error('[API /api/admin/packages-v2/features] DELETE Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete feature' },
      { status: 500 }
    )
  }
}
