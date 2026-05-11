import { NextRequest, NextResponse } from 'next/server'
import Database from 'better-sqlite3'
import path from 'path'

// id: api-packages-public-001
const dbPath = path.join(process.cwd(), 'database', 'user-management.db')

export const dynamic = 'force-dynamic'

function getDb() {
  const db = new Database(dbPath)
  db.pragma('foreign_keys = ON')
  return db
}

// GET - Public endpoint that returns the comparison-table pricing data.
export async function GET(_request: NextRequest) {
  const db = getDb()
  try {
    const packages = db.prepare(`
      SELECT * FROM packages
      WHERE is_active = 1
      ORDER BY display_order ASC
    `).all() as any[]

    const features = db.prepare(`
      SELECT * FROM package_features
      WHERE is_active = 1
      ORDER BY display_order ASC
    `).all() as any[]

    const featureValues = db.prepare(`
      SELECT pfv.*, p.slug as package_slug, f.name as feature_name
      FROM package_feature_values pfv
      JOIN packages p ON pfv.package_id = p.id
      JOIN package_features f ON pfv.feature_id = f.id
      WHERE p.is_active = 1 AND f.is_active = 1
    `).all() as any[]

    const settings = db.prepare(`
      SELECT setting_key, setting_value FROM packages_settings
    `).all() as any[]

    const settingsObj = settings.reduce((acc, s) => {
      acc[s.setting_key] = s.setting_value
      return acc
    }, {} as Record<string, string>)

    const pricingTable = {
      packages: packages.map(pkg => ({
        id: pkg.id,
        name: pkg.name,
        slug: pkg.slug,
        price: pkg.price,
        priceSuffix: pkg.price_suffix,
        ctaText: pkg.cta_text,
        ctaUrl: pkg.cta_url || `/packages/${pkg.slug}`,
        description: pkg.description,
        longDescription: pkg.long_description,
        iconUrl: pkg.icon_url,
        imageUrl: pkg.image_url,
        highlightColor: pkg.highlight_color,
        isFeatured: pkg.is_featured === 1,
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
              dropdownSelected: fv.dropdown_selected,
            }
          })
        return {
          id: feat.id,
          name: feat.name,
          description: feat.description,
          category: feat.category,
          values,
        }
      }),
      settings: settingsObj,
    }

    return NextResponse.json({ success: true, data: pricingTable })
  } catch (error: any) {
    console.error('[API /api/packages] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch packages data' },
      { status: 500 }
    )
  } finally {
    db.close()
  }
}
