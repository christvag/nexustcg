import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import Database from 'better-sqlite3'
import path from 'path'

// id: api-admin-packages-values-001
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

// GET - Fetch all feature values
export async function GET(request: NextRequest) {
  const auth = checkAdminAuth(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const db = getDb()
  try {
    const values = db.prepare(`
      SELECT pfv.*, p.name as package_name, p.slug as package_slug, f.name as feature_name
      FROM package_feature_values pfv
      JOIN packages p ON pfv.package_id = p.id
      JOIN package_features f ON pfv.feature_id = f.id
      ORDER BY p.display_order, f.display_order
    `).all()

    return NextResponse.json({ success: true, values })
  } catch (error: any) {
    console.error('[API /api/admin/packages/values] GET Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch values' }, { status: 500 })
  } finally {
    db.close()
  }
}

// PUT - Upsert a single feature value
export async function PUT(request: NextRequest) {
  const auth = checkAdminAuth(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const db = getDb()
  try {
    const body = await request.json()
    const {
      package_id,
      feature_id,
      value_type = 'check',
      is_checked = false,
      text_value,
      dropdown_options,
      dropdown_selected,
    } = body

    if (!package_id || !feature_id) {
      return NextResponse.json(
        { success: false, error: 'package_id and feature_id are required' },
        { status: 400 }
      )
    }

    const dropdownOptionsJson = dropdown_options ? JSON.stringify(dropdown_options) : null
    upsertValue(db, {
      package_id,
      feature_id,
      value_type,
      is_checked: is_checked ? 1 : 0,
      text_value,
      dropdown_options: dropdownOptionsJson,
      dropdown_selected,
    })

    return NextResponse.json({ success: true, message: 'Feature value updated successfully' })
  } catch (error: any) {
    console.error('[API /api/admin/packages/values] PUT Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update value' },
      { status: 500 }
    )
  } finally {
    db.close()
  }
}

// POST - Bulk upsert feature values
export async function POST(request: NextRequest) {
  const auth = checkAdminAuth(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const db = getDb()
  try {
    const body = await request.json()
    const { values } = body

    if (!values || !Array.isArray(values)) {
      return NextResponse.json(
        { success: false, error: 'values array is required' },
        { status: 400 }
      )
    }

    db.transaction(() => {
      for (const value of values) {
        const {
          package_id,
          feature_id,
          value_type = 'check',
          is_checked = false,
          text_value,
          dropdown_options,
          dropdown_selected,
        } = value
        if (!package_id || !feature_id) continue

        upsertValue(db, {
          package_id,
          feature_id,
          value_type,
          is_checked: is_checked ? 1 : 0,
          text_value,
          dropdown_options: dropdown_options ? JSON.stringify(dropdown_options) : null,
          dropdown_selected,
        })
      }
    })()

    return NextResponse.json({ success: true, message: 'Feature values updated successfully' })
  } catch (error: any) {
    console.error('[API /api/admin/packages/values] POST Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update values' },
      { status: 500 }
    )
  } finally {
    db.close()
  }
}

function upsertValue(
  db: Database.Database,
  v: {
    package_id: number
    feature_id: number
    value_type: string
    is_checked: number
    text_value: string | null | undefined
    dropdown_options: string | null
    dropdown_selected: string | null | undefined
  }
) {
  const existing = db.prepare(
    'SELECT id FROM package_feature_values WHERE package_id = ? AND feature_id = ?'
  ).get(v.package_id, v.feature_id) as { id: number } | undefined

  if (existing) {
    db.prepare(`
      UPDATE package_feature_values
      SET value_type = ?, is_checked = ?, text_value = ?, dropdown_options = ?, dropdown_selected = ?, updated_at = CURRENT_TIMESTAMP
      WHERE package_id = ? AND feature_id = ?
    `).run(v.value_type, v.is_checked, v.text_value, v.dropdown_options, v.dropdown_selected, v.package_id, v.feature_id)
  } else {
    db.prepare(`
      INSERT INTO package_feature_values (package_id, feature_id, value_type, is_checked, text_value, dropdown_options, dropdown_selected)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(v.package_id, v.feature_id, v.value_type, v.is_checked, v.text_value, v.dropdown_options, v.dropdown_selected)
  }
}
