import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import sqlite3 from 'sqlite3'
import path from 'path'

// id: api-admin-packages-v2-001
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

// GET - Fetch all packages (admin view - includes inactive)
export async function GET(request: NextRequest) {
  const auth = checkAdminAuth(request)
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const packages = await runQuery<any[]>(`
      SELECT * FROM packages_v2 ORDER BY display_order ASC
    `)

    const features = await runQuery<any[]>(`
      SELECT * FROM package_features_v2 ORDER BY display_order ASC
    `)

    const featureValues = await runQuery<any[]>(`
      SELECT * FROM package_feature_values_v2
    `)

    const settings = await runQuery<any[]>(`
      SELECT * FROM packages_v2_settings
    `)

    return NextResponse.json({
      success: true,
      packages,
      features,
      featureValues,
      settings
    })
  } catch (error) {
    console.error('[API /api/admin/packages-v2] GET Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data' },
      { status: 500 }
    )
  }
}

// POST - Create a new package
export async function POST(request: NextRequest) {
  const auth = checkAdminAuth(request)
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const body = await request.json()
    const {
      name,
      slug,
      price,
      price_suffix = '/card',
      cta_text = 'Get Started',
      cta_url,
      description,
      long_description,
      icon_url,
      image_url,
      highlight_color = '#d83f0a',
      is_featured = false,
      is_active = true,
      display_order = 0
    } = body

    if (!name || !slug || price === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, slug, price' },
        { status: 400 }
      )
    }

    const result = await runQuery<any>(`
      INSERT INTO packages_v2 (name, slug, price, price_suffix, cta_text, cta_url, description, long_description, icon_url, image_url, highlight_color, is_featured, is_active, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, slug, price, price_suffix, cta_text, cta_url, description, long_description, icon_url, image_url, highlight_color, is_featured ? 1 : 0, is_active ? 1 : 0, display_order])

    // Create default feature values for the new package
    const features = await runQuery<any[]>('SELECT id FROM package_features_v2')
    for (const feat of features) {
      await runQuery(`
        INSERT INTO package_feature_values_v2 (package_id, feature_id, value_type, is_checked)
        VALUES (?, ?, 'check', 0)
      `, [result.lastID, feat.id])
    }

    return NextResponse.json({
      success: true,
      message: 'Package created successfully',
      packageId: result.lastID
    }, { status: 201 })
  } catch (error: any) {
    console.error('[API /api/admin/packages-v2] POST Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create package' },
      { status: 500 }
    )
  }
}

// PUT - Update a package
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
        { success: false, error: 'Package ID is required' },
        { status: 400 }
      )
    }

    const fields = []
    const values = []

    if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name) }
    if (updates.slug !== undefined) { fields.push('slug = ?'); values.push(updates.slug) }
    if (updates.price !== undefined) { fields.push('price = ?'); values.push(updates.price) }
    if (updates.price_suffix !== undefined) { fields.push('price_suffix = ?'); values.push(updates.price_suffix) }
    if (updates.cta_text !== undefined) { fields.push('cta_text = ?'); values.push(updates.cta_text) }
    if (updates.cta_url !== undefined) { fields.push('cta_url = ?'); values.push(updates.cta_url) }
    if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description) }
    if (updates.long_description !== undefined) { fields.push('long_description = ?'); values.push(updates.long_description) }
    if (updates.icon_url !== undefined) { fields.push('icon_url = ?'); values.push(updates.icon_url) }
    if (updates.image_url !== undefined) { fields.push('image_url = ?'); values.push(updates.image_url) }
    if (updates.highlight_color !== undefined) { fields.push('highlight_color = ?'); values.push(updates.highlight_color) }
    if (updates.is_featured !== undefined) { fields.push('is_featured = ?'); values.push(updates.is_featured ? 1 : 0) }
    if (updates.is_active !== undefined) { fields.push('is_active = ?'); values.push(updates.is_active ? 1 : 0) }
    if (updates.display_order !== undefined) { fields.push('display_order = ?'); values.push(updates.display_order) }

    if (fields.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      )
    }

    values.push(id)
    await runQuery(`UPDATE packages_v2 SET ${fields.join(', ')} WHERE id = ?`, values)

    return NextResponse.json({
      success: true,
      message: 'Package updated successfully'
    })
  } catch (error: any) {
    console.error('[API /api/admin/packages-v2] PUT Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update package' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a package
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
        { success: false, error: 'Package ID is required' },
        { status: 400 }
      )
    }

    await runQuery('DELETE FROM packages_v2 WHERE id = ?', [id])

    return NextResponse.json({
      success: true,
      message: 'Package deleted successfully'
    })
  } catch (error: any) {
    console.error('[API /api/admin/packages-v2] DELETE Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete package' },
      { status: 500 }
    )
  }
}
