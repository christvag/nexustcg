import { emailService, SMTPSettings } from '@/lib/email-service'
import Database from 'better-sqlite3'
import path from 'path'

let cachedSettings: SMTPSettings | null = null
let cacheTimestamp = 0
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

function getDb() {
  const dbPath = path.join(process.cwd(), 'database', 'user-management.db')
  const db = new Database(dbPath)
  db.pragma('foreign_keys = ON')
  return db
}

function loadSmtpSettings(): SMTPSettings | null {
  // Return cached settings if still fresh
  if (cachedSettings && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return cachedSettings
  }

  const db = getDb()
  try {
    const row = db.prepare('SELECT * FROM email_settings ORDER BY id DESC LIMIT 1').get() as any
    db.close()

    if (!row || !row.smtp_host || !row.smtp_username || !row.smtp_password) {
      return null
    }

    cachedSettings = {
      smtp_host: row.smtp_host,
      smtp_port: row.smtp_port || 587,
      smtp_username: row.smtp_username,
      smtp_password: row.smtp_password,
      from_name: row.from_name || 'Nexus TCGrading',
      from_email: row.from_email,
      enable_ssl: row.enable_ssl === 1
    }
    cacheTimestamp = Date.now()
    return cachedSettings
  } catch (error) {
    console.error('[Email Trigger] Failed to load SMTP settings:', error)
    db.close()
    return null
  }
}

/**
 * Fire-and-forget email trigger for order status updates.
 * Logs errors but never throws - email failure must NOT block API responses.
 */
export async function triggerOrderEmail(
  customerEmail: string,
  orderNumber: string,
  status: string,
  customerName: string
): Promise<void> {
  try {
    if (!customerEmail) {
      console.log('[Email Trigger] No customer email provided, skipping email')
      return
    }

    const settings = loadSmtpSettings()
    if (!settings) {
      console.log('[Email Trigger] SMTP not configured, skipping email')
      return
    }

    await emailService.configure(settings)
    const result = await emailService.sendOrderStatusEmail(
      customerEmail,
      orderNumber,
      status,
      customerName
    )

    if (result.success) {
      console.log(`[Email Trigger] Status email sent to ${customerEmail} for order ${orderNumber} (${status})`)
    } else {
      console.error(`[Email Trigger] Failed to send email: ${result.message}`)
    }
  } catch (error) {
    console.error('[Email Trigger] Unexpected error sending email:', error)
  }
}

/**
 * Clear the cached SMTP settings (useful after admin updates settings).
 */
export function clearEmailSettingsCache(): void {
  cachedSettings = null
  cacheTimestamp = 0
}
