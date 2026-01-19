import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import sqlite3 from 'sqlite3'
import path from 'path'

// id: api-admin-settings-general-001
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

// Currency options
const CURRENCIES = [
  { code: 'GBP', symbol: '£', name: 'British Pound Sterling' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' }
]

// GET - Fetch all global settings
export async function GET(request: NextRequest) {
  const auth = checkAdminAuth(request)
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const settings = await runQuery<any[]>(`
      SELECT setting_key, setting_value, setting_type, category, description
      FROM global_settings
      ORDER BY category, setting_key
    `)

    // Transform to object
    const settingsObj: Record<string, any> = {}
    settings.forEach(s => {
      let value: any = s.setting_value
      if (s.setting_type === 'boolean') {
        value = s.setting_value === 'true'
      } else if (s.setting_type === 'number') {
        value = parseFloat(s.setting_value)
      }
      settingsObj[s.setting_key] = value
    })

    return NextResponse.json({
      success: true,
      settings: settingsObj,
      currencies: CURRENCIES
    })
  } catch (error) {
    console.error('[API /api/admin/settings/general] GET Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// PUT - Update global settings
export async function PUT(request: NextRequest) {
  const auth = checkAdminAuth(request)
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const body = await request.json()
    const { settings } = body

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Settings object is required' },
        { status: 400 }
      )
    }

    // Update each setting
    for (const [key, value] of Object.entries(settings)) {
      const stringValue = typeof value === 'boolean' ? String(value) : String(value)
      await runQuery(`
        UPDATE global_settings
        SET setting_value = ?, updated_at = CURRENT_TIMESTAMP
        WHERE setting_key = ?
      `, [stringValue, key])
    }

    // If currency_code was updated, also update the symbol
    if (settings.currency_code) {
      const currency = CURRENCIES.find(c => c.code === settings.currency_code)
      if (currency) {
        await runQuery(`
          UPDATE global_settings
          SET setting_value = ?, updated_at = CURRENT_TIMESTAMP
          WHERE setting_key = 'currency_symbol'
        `, [currency.symbol])
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully'
    })
  } catch (error: any) {
    console.error('[API /api/admin/settings/general] PUT Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update settings' },
      { status: 500 }
    )
  }
}
