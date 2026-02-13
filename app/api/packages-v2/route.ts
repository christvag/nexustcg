import { NextRequest, NextResponse } from 'next/server'
import sqlite3 from 'sqlite3'
import path from 'path'

// id: api-packages-v2-public-001
const dbPath = path.join(process.cwd(), 'database', 'user-management.db')

export const dynamic = 'force-dynamic'

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

// GET - Public endpoint to fetch all packages v2 data for the pricing table
export async function GET(request: NextRequest) {
  try {
    // Fetch all active packages
    const packages = await runQuery<any[]>(`
      SELECT * FROM packages_v2
      WHERE is_active = 1
      ORDER BY display_order ASC
    `)

    // Fetch all active features
    const features = await runQuery<any[]>(`
      SELECT * FROM package_features_v2
      WHERE is_active = 1
      ORDER BY display_order ASC
    `)

    // Fetch all feature values
    const featureValues = await runQuery<any[]>(`
      SELECT pfv.*, p.slug as package_slug, f.name as feature_name
      FROM package_feature_values_v2 pfv
      JOIN packages_v2 p ON pfv.package_id = p.id
      JOIN package_features_v2 f ON pfv.feature_id = f.id
      WHERE p.is_active = 1 AND f.is_active = 1
    `)

    // Fetch settings
    const settings = await runQuery<any[]>(`
      SELECT setting_key, setting_value FROM packages_v2_settings
    `)

    // Transform settings into object
    const settingsObj = settings.reduce((acc, s) => {
      acc[s.setting_key] = s.setting_value
      return acc
    }, {} as Record<string, string>)

    // Build the pricing table structure
    const pricingTable = {
      packages: packages.map(pkg => ({
        id: pkg.id,
        name: pkg.name,
        slug: pkg.slug,
        price: pkg.price,
        priceSuffix: pkg.price_suffix,
        ctaText: pkg.cta_text,
        ctaUrl: pkg.cta_url || `/packages-v2/${pkg.slug}`,
        description: pkg.description,
        longDescription: pkg.long_description,
        iconUrl: pkg.icon_url,
        imageUrl: pkg.image_url,
        highlightColor: pkg.highlight_color,
        isFeatured: pkg.is_featured === 1
      })),
      features: features.map(feat => {
        const values: Record<string, any> = {}

        featureValues
          .filter(fv => fv.feature_id === feat.id)
          .forEach(fv => {
            values[fv.package_slug] = {
              valueType: fv.value_type,
              isChecked: fv.is_checked === 1,
              textValue: fv.text_value,
              dropdownOptions: fv.dropdown_options ? JSON.parse(fv.dropdown_options) : [],
              dropdownSelected: fv.dropdown_selected
            }
          })

        return {
          id: feat.id,
          name: feat.name,
          description: feat.description,
          category: feat.category,
          values
        }
      }),
      settings: settingsObj
    }

    return NextResponse.json({
      success: true,
      data: pricingTable
    })
  } catch (error) {
    console.error('[API /api/packages-v2] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch packages v2 data' },
      { status: 500 }
    )
  }
}
