import { NextRequest, NextResponse } from 'next/server'
import sqlite3 from 'sqlite3'
import path from 'path'

// id: api-packages-v2-slug-001
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

// GET - Fetch a single package by slug with its features
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Fetch the package
    const packages = await runQuery<any[]>(`
      SELECT * FROM packages_v2
      WHERE slug = ? AND is_active = 1
    `, [slug])

    if (packages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Package not found' },
        { status: 404 }
      )
    }

    const pkg = packages[0]

    // Fetch all active features with their values for this package
    const features = await runQuery<any[]>(`
      SELECT
        f.id,
        f.name,
        f.description,
        f.category,
        pfv.value_type,
        pfv.is_checked,
        pfv.text_value,
        pfv.dropdown_options,
        pfv.dropdown_selected
      FROM package_features_v2 f
      LEFT JOIN package_feature_values_v2 pfv ON f.id = pfv.feature_id AND pfv.package_id = ?
      WHERE f.is_active = 1
      ORDER BY f.display_order ASC
    `, [pkg.id])

    // Build the response
    const packageDetail = {
      id: pkg.id,
      name: pkg.name,
      slug: pkg.slug,
      price: pkg.price,
      priceSuffix: pkg.price_suffix,
      ctaText: pkg.cta_text,
      ctaUrl: pkg.cta_url,
      description: pkg.description,
      longDescription: pkg.long_description,
      iconUrl: pkg.icon_url,
      imageUrl: pkg.image_url,
      highlightColor: pkg.highlight_color,
      isFeatured: pkg.is_featured === 1,
      features: features
        .filter(f => f.is_checked === 1 || f.value_type === 'text' || f.value_type === 'dropdown')
        .map(f => {
          let displayValue = f.name
          if (f.value_type === 'text' && f.text_value) {
            displayValue = `${f.name}: ${f.text_value}`
          } else if (f.value_type === 'dropdown' && f.dropdown_selected) {
            displayValue = `${f.name}: ${f.dropdown_selected}`
          }
          return {
            id: f.id,
            name: f.name,
            description: f.description,
            valueType: f.value_type,
            isChecked: f.is_checked === 1,
            textValue: f.text_value,
            dropdownOptions: f.dropdown_options ? JSON.parse(f.dropdown_options) : [],
            dropdownSelected: f.dropdown_selected,
            displayValue
          }
        })
    }

    return NextResponse.json({
      success: true,
      package: packageDetail
    })
  } catch (error) {
    console.error('[API /api/packages-v2/[slug]] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch package' },
      { status: 500 }
    )
  }
}
