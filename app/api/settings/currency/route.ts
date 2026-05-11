import { NextRequest, NextResponse } from 'next/server'
import sqlite3 from 'sqlite3'
import path from 'path'

// id: api-settings-currency-public-001
const dbPath = path.join(process.cwd(), 'database', 'user-management.db')

export const dynamic = 'force-dynamic'

function runQuery<T>(query: string, params: any[] = []): Promise<T> {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath)
    db.all(query, params, (err, rows) => {
      db.close()
      if (err) reject(err)
      else resolve(rows as T)
    })
  })
}

// GET - Public endpoint to fetch currency settings
export async function GET(request: NextRequest) {
  try {
    const settings = await runQuery<any[]>(`
      SELECT setting_key, setting_value
      FROM global_settings
      WHERE category = 'currency'
    `)

    const currencySettings: Record<string, string> = {}
    settings.forEach(s => {
      currencySettings[s.setting_key] = s.setting_value
    })

    return NextResponse.json({
      success: true,
      currency: {
        code: currencySettings.currency_code || 'GBP',
        symbol: currencySettings.currency_symbol || '£',
        position: currencySettings.currency_position || 'before'
      }
    })
  } catch (error) {
    console.error('[API /api/settings/currency] Error:', error)
    // Return default currency on error
    return NextResponse.json({
      success: true,
      currency: {
        code: 'GBP',
        symbol: '£',
        position: 'before'
      }
    })
  }
}
