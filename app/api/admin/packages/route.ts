import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import Database from 'better-sqlite3'
import path from 'path'

// id: api-admin-packages-001
const dbPath = path.join(process.cwd(), 'database', 'user-management.db')
const JWT_SECRET = process.env.JWT_SECRET || 'nexus-tcgrading-secret-key-2024'

export const dynamic = 'force-dynamic'

function getDb() {
  const db = new Database(dbPath)
  db.pragma('foreign_keys = ON')
  return db
}

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

// GET - Fetch all packages (admin view - includes inactive)
export async function GET(request: NextRequest) {
  const auth = checkAdminAuth(request)
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const db = getDb()
  try {
    const packages = db.prepare('SELECT * FROM packages ORDER BY display_order ASC').all()
    const features = db.prepare('SELECT * FROM package_features ORDER BY display_order ASC').all()
    const featureValues = db.prepare('SELECT * FROM package_feature_values').all()
    const settings = db.prepare('SELECT * FROM packages_settings').all()

    return NextResponse.json({
      success: true,
      packages,
      features,
      featureValues,
      settings,
    })
  } catch (error: any) {
    console.error('[API /api/admin/packages] GET Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data', detail: process.env.NODE_ENV !== 'production' ? error.message : undefined },
      { status: 500 }
    )
  } finally {
    db.close()
  }
}

// POST - Create a new package
export async function POST(request: NextRequest) {
  const auth = checkAdminAuth(request)
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const db = getDb()
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
      display_order = 0,
    } = body

    if (!name || !slug || price === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, slug, price' },
        { status: 400 }
      )
    }

    const insertPackage = db.prepare(`
      INSERT INTO packages (name, slug, price, price_suffix, cta_text, cta_url, description, long_description, icon_url, image_url, highlight_color, is_featured, is_active, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const insertFeatureValue = db.prepare(`
      INSERT INTO package_feature_values (package_id, feature_id, value_type, is_checked)
      VALUES (?, ?, 'check', 0)
    `)

    const result = db.transaction(() => {
      const info = insertPackage.run(
        name,
        slug,
        price,
        price_suffix,
        cta_text,
        cta_url,
        description,
        long_description,
        icon_url,
        image_url,
        highlight_color,
        is_featured ? 1 : 0,
        is_active ? 1 : 0,
        display_order
      )
      const newId = Number(info.lastInsertRowid)
      const features = db.prepare('SELECT id FROM package_features').all() as { id: number }[]
      for (const f of features) insertFeatureValue.run(newId, f.id)
      return newId
    })()

    return NextResponse.json(
      { success: true, message: 'Package created successfully', packageId: result },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[API /api/admin/packages] POST Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create package' },
      { status: 500 }
    )
  } finally {
    db.close()
  }
}

// PUT - Update a package
export async function PUT(request: NextRequest) {
  const auth = checkAdminAuth(request)
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const db = getDb()
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Package ID is required' },
        { status: 400 }
      )
    }

    const fields: string[] = []
    const values: any[] = []

    const setField = (col: string, value: any) => {
      fields.push(`${col} = ?`)
      values.push(value)
    }

    if (updates.name !== undefined) setField('name', updates.name)
    if (updates.slug !== undefined) setField('slug', updates.slug)
    if (updates.price !== undefined) setField('price', updates.price)
    if (updates.price_suffix !== undefined) setField('price_suffix', updates.price_suffix)
    if (updates.cta_text !== undefined) setField('cta_text', updates.cta_text)
    if (updates.cta_url !== undefined) setField('cta_url', updates.cta_url)
    if (updates.description !== undefined) setField('description', updates.description)
    if (updates.long_description !== undefined) setField('long_description', updates.long_description)
    if (updates.icon_url !== undefined) setField('icon_url', updates.icon_url)
    if (updates.image_url !== undefined) setField('image_url', updates.image_url)
    if (updates.highlight_color !== undefined) setField('highlight_color', updates.highlight_color)
    if (updates.is_featured !== undefined) setField('is_featured', updates.is_featured ? 1 : 0)
    if (updates.is_active !== undefined) setField('is_active', updates.is_active ? 1 : 0)
    if (updates.display_order !== undefined) setField('display_order', updates.display_order)

    if (fields.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      )
    }

    values.push(id)
    db.prepare(`UPDATE packages SET ${fields.join(', ')} WHERE id = ?`).run(...values)

    return NextResponse.json({ success: true, message: 'Package updated successfully' })
  } catch (error: any) {
    console.error('[API /api/admin/packages] PUT Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update package' },
      { status: 500 }
    )
  } finally {
    db.close()
  }
}

// DELETE - Delete a package
export async function DELETE(request: NextRequest) {
  const auth = checkAdminAuth(request)
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const db = getDb()
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Package ID is required' },
        { status: 400 }
      )
    }

    db.prepare('DELETE FROM packages WHERE id = ?').run(id)

    return NextResponse.json({ success: true, message: 'Package deleted successfully' })
  } catch (error: any) {
    console.error('[API /api/admin/packages] DELETE Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete package' },
      { status: 500 }
    )
  } finally {
    db.close()
  }
}
