import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database', 'user-management.db');

// Helper function to run database queries
function runQuery<T>(query: string, params: any[] = []): Promise<T> {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);

    if (query.trim().toUpperCase().startsWith('SELECT')) {
      db.all(query, params, (err, rows) => {
        db.close();
        if (err) reject(err);
        else resolve(rows as T);
      });
    } else {
      db.run(query, params, function(err) {
        db.close();
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes } as T);
      });
    }
  });
}

// Helper function to parse JSON fields
function parsePackage(pkg: any) {
  if (!pkg) return null;

  return {
    ...pkg,
    features: pkg.features ? JSON.parse(pkg.features) : [],
    specifications: pkg.specifications ? JSON.parse(pkg.specifications) : [],
    trust_indicators: pkg.trust_indicators ? JSON.parse(pkg.trust_indicators) : []
  };
}

// Get all active packages (for public)
export async function getAllPackages() {
  const packages = await runQuery<any[]>(
    `SELECT * FROM packages WHERE is_active = 1 ORDER BY display_order ASC`
  );

  return packages.map(parsePackage);
}

// Get all packages including inactive (for admin)
export async function getAllPackagesAdmin() {
  const packages = await runQuery<any[]>(
    `SELECT * FROM packages ORDER BY display_order ASC`
  );

  return packages.map(parsePackage);
}

// Get a single package by ID or slug
export async function getPackageByIdOrSlug(identifier: string) {
  const packageData = await runQuery<any[]>(
    `SELECT * FROM packages WHERE id = ? OR slug = ? LIMIT 1`,
    [identifier, identifier]
  );

  if (packageData.length === 0) return null;

  return parsePackage(packageData[0]);
}

// Create a new package
export async function createPackage(packageData: any) {
  const {
    id,
    name,
    slug,
    price,
    description,
    long_description,
    features,
    specifications,
    trust_indicators,
    icon_name,
    icon_url,
    image_url,
    processing_time,
    min_cards,
    max_cards,
    is_active,
    is_popular,
    display_order
  } = packageData;

  // Convert arrays to JSON strings
  const featuresJson = JSON.stringify(features || []);
  const specificationsJson = JSON.stringify(specifications || []);
  const trustIndicatorsJson = JSON.stringify(trust_indicators || []);

  await runQuery(
    `INSERT INTO packages (
      id, name, slug, price, description, long_description, features, specifications,
      trust_indicators, icon_name, icon_url, image_url, processing_time, min_cards, max_cards,
      is_active, is_popular, display_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, name, slug, price, description, long_description, featuresJson, specificationsJson,
      trustIndicatorsJson, icon_name, icon_url, image_url, processing_time, min_cards, max_cards,
      is_active ? 1 : 0, is_popular ? 1 : 0, display_order
    ]
  );

  return getPackageByIdOrSlug(id);
}

// Update a package
export async function updatePackage(id: string, packageData: any) {
  const {
    name,
    slug,
    price,
    description,
    long_description,
    features,
    specifications,
    trust_indicators,
    icon_name,
    icon_url,
    image_url,
    processing_time,
    min_cards,
    max_cards,
    is_active,
    is_popular,
    display_order
  } = packageData;

  // Convert arrays to JSON strings
  const featuresJson = JSON.stringify(features || []);
  const specificationsJson = JSON.stringify(specifications || []);
  const trustIndicatorsJson = JSON.stringify(trust_indicators || []);

  await runQuery(
    `UPDATE packages SET
      name = ?, slug = ?, price = ?, description = ?, long_description = ?,
      features = ?, specifications = ?, trust_indicators = ?, icon_name = ?, icon_url = ?,
      image_url = ?, processing_time = ?, min_cards = ?, max_cards = ?, is_active = ?,
      is_popular = ?, display_order = ?
    WHERE id = ?`,
    [
      name, slug, price, description, long_description, featuresJson, specificationsJson,
      trustIndicatorsJson, icon_name, icon_url, image_url, processing_time, min_cards, max_cards,
      is_active ? 1 : 0, is_popular ? 1 : 0, display_order, id
    ]
  );

  return getPackageByIdOrSlug(id);
}

// Delete a package
export async function deletePackage(id: string) {
  await runQuery(`DELETE FROM packages WHERE id = ?`, [id]);
  return { success: true };
}

// Toggle package active status
export async function togglePackageStatus(id: string) {
  await runQuery(
    `UPDATE packages SET is_active = NOT is_active WHERE id = ?`,
    [id]
  );
  return getPackageByIdOrSlug(id);
}
