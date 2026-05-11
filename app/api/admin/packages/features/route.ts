import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import Database from 'better-sqlite3'
import path from 'path'

// id: api-admin-packages-features-001
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

// GET - Fetch all features
export async function GET(request: NextRequest) {
  const auth = checkAdminAuth(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const db = getDb()
  try {
    const features = db.prepare('SELECT * FROM package_features ORDER BY display_order ASC').all()
    return NextResponse.json({ success: true, features })
  } catch (error: any) {
    console.error('[API /api/admin/packages/features] GET Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch features' }, { status: 500 })
  } finally {
    db.close()
  }
}

// POST - Create a new feature, then default-fill values for all existing packages
export async function POST(request: NextRequest) {
  const auth = checkAdminAuth(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const db = getDb()
  try {
    const body = await request.json()
    const { name, description, category = 'general', display_order = 0, is_active = true } = body

    if (!name) {
      return NextResponse.json({ success: false, error: 'Feature name is required' }, { status: 400 })
    }

    const insertFeature = db.prepare(`
      INSERT INTO package_features (name, description, category, display_order, is_active)
      VALUES (?, ?, ?, ?, ?)
    `)
    const insertValue = db.prepare(`
      INSERT INTO package_feature_values (package_id, feature_id, value_type, is_checked)
      VALUES (?, ?, 'check', 0)
    `)

    const featureId = db.transaction(() => {
      const info = insertFeature.run(name, description, category, display_order, is_active ? 1 : 0)
      const newId = Number(info.lastInsertRowid)
      const packages = db.prepare('SELECT id FROM packages').all() as { id: number }[]
      for (const pkg of packages) insertValue.run(pkg.id, newId)
      return newId
    })()

    return NextResponse.json(
      { success: true, message: 'Feature created successfully', featureId },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[API /api/admin/packages/features] POST Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create feature' },
      { status: 500 }
    )
  } finally {
    db.close()
  }
}

// PUT - Update a feature
export async function PUT(request: NextRequest) {
  const auth = checkAdminAuth(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const db = getDb()
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'Feature ID is required' }, { status: 400 })
    }

    const fields: string[] = []
    const values: any[] = []
    const setField = (col: string, value: any) => { fields.push(`${col} = ?`); values.push(value) }

    if (updates.name !== undefined) setField('name', updates.name)
    if (updates.description !== undefined) setField('description', updates.description)
    if (updates.category !== undefined) setField('category', updates.category)
    if (updates.display_order !== undefined) setField('display_order', updates.display_order)
    if (updates.is_active !== undefined) setField('is_active', updates.is_active ? 1 : 0)

    if (fields.length === 0) {
      return NextResponse.json({ success: false, error: 'No fields to update' }, { status: 400 })
    }

    values.push(id)
    db.prepare(`UPDATE package_features SET ${fields.join(', ')} WHERE id = ?`).run(...values)

    return NextResponse.json({ success: true, message: 'Feature updated successfully' })
  } catch (error: any) {
    console.error('[API /api/admin/packages/features] PUT Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update feature' },
      { status: 500 }
    )
  } finally {
    db.close()
  }
}

// DELETE - Delete a feature
export async function DELETE(request: NextRequest) {
  const auth = checkAdminAuth(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const db = getDb()
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'Feature ID is required' }, { status: 400 })
    }

    db.prepare('DELETE FROM package_features WHERE id = ?').run(id)

    return NextResponse.json({ success: true, message: 'Feature deleted successfully' })
  } catch (error: any) {
    console.error('[API /api/admin/packages/features] DELETE Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete feature' },
      { status: 500 }
    )
  } finally {
    db.close()
  }
}
