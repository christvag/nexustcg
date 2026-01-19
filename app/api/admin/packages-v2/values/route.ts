import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import sqlite3 from 'sqlite3'
import path from 'path'

// id: api-admin-packages-v2-values-001
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

// GET - Fetch all feature values
export async function GET(request: NextRequest) {
  const auth = checkAdminAuth(request)
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const values = await runQuery<any[]>(`
      SELECT pfv.*, p.name as package_name, p.slug as package_slug, f.name as feature_name
      FROM package_feature_values_v2 pfv
      JOIN packages_v2 p ON pfv.package_id = p.id
      JOIN package_features_v2 f ON pfv.feature_id = f.id
      ORDER BY p.display_order, f.display_order
    `)

    return NextResponse.json({
      success: true,
      values
    })
  } catch (error) {
    console.error('[API /api/admin/packages-v2/values] GET Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch values' },
      { status: 500 }
    )
  }
}

// PUT - Update a feature value (or create if doesn't exist)
export async function PUT(request: NextRequest) {
  const auth = checkAdminAuth(request)
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const body = await request.json()
    const {
      package_id,
      feature_id,
      value_type = 'check',
      is_checked = false,
      text_value,
      dropdown_options,
      dropdown_selected
    } = body

    if (!package_id || !feature_id) {
      return NextResponse.json(
        { success: false, error: 'package_id and feature_id are required' },
        { status: 400 }
      )
    }

    // Check if value exists
    const existing = await runQuery<any[]>(
      'SELECT id FROM package_feature_values_v2 WHERE package_id = ? AND feature_id = ?',
      [package_id, feature_id]
    )

    const dropdownOptionsJson = dropdown_options ? JSON.stringify(dropdown_options) : null

    if (existing.length > 0) {
      // Update existing
      await runQuery(`
        UPDATE package_feature_values_v2
        SET value_type = ?, is_checked = ?, text_value = ?, dropdown_options = ?, dropdown_selected = ?
        WHERE package_id = ? AND feature_id = ?
      `, [value_type, is_checked ? 1 : 0, text_value, dropdownOptionsJson, dropdown_selected, package_id, feature_id])
    } else {
      // Create new
      await runQuery(`
        INSERT INTO package_feature_values_v2 (package_id, feature_id, value_type, is_checked, text_value, dropdown_options, dropdown_selected)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [package_id, feature_id, value_type, is_checked ? 1 : 0, text_value, dropdownOptionsJson, dropdown_selected])
    }

    return NextResponse.json({
      success: true,
      message: 'Feature value updated successfully'
    })
  } catch (error: any) {
    console.error('[API /api/admin/packages-v2/values] PUT Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update value' },
      { status: 500 }
    )
  }
}

// POST - Bulk update feature values
export async function POST(request: NextRequest) {
  const auth = checkAdminAuth(request)
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const body = await request.json()
    const { values } = body

    if (!values || !Array.isArray(values)) {
      return NextResponse.json(
        { success: false, error: 'values array is required' },
        { status: 400 }
      )
    }

    for (const value of values) {
      const {
        package_id,
        feature_id,
        value_type = 'check',
        is_checked = false,
        text_value,
        dropdown_options,
        dropdown_selected
      } = value

      if (!package_id || !feature_id) continue

      const dropdownOptionsJson = dropdown_options ? JSON.stringify(dropdown_options) : null

      // Upsert
      const existing = await runQuery<any[]>(
        'SELECT id FROM package_feature_values_v2 WHERE package_id = ? AND feature_id = ?',
        [package_id, feature_id]
      )

      if (existing.length > 0) {
        await runQuery(`
          UPDATE package_feature_values_v2
          SET value_type = ?, is_checked = ?, text_value = ?, dropdown_options = ?, dropdown_selected = ?
          WHERE package_id = ? AND feature_id = ?
        `, [value_type, is_checked ? 1 : 0, text_value, dropdownOptionsJson, dropdown_selected, package_id, feature_id])
      } else {
        await runQuery(`
          INSERT INTO package_feature_values_v2 (package_id, feature_id, value_type, is_checked, text_value, dropdown_options, dropdown_selected)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [package_id, feature_id, value_type, is_checked ? 1 : 0, text_value, dropdownOptionsJson, dropdown_selected])
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Feature values updated successfully'
    })
  } catch (error: any) {
    console.error('[API /api/admin/packages-v2/values] POST Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update values' },
      { status: 500 }
    )
  }
}
