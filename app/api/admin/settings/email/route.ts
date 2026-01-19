import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { runQuery, runQuerySingle, initializeDatabase } from '@/lib/user-database'

// Disable caching for this route
export const dynamic = 'force-dynamic'

const JWT_SECRET = process.env.JWT_SECRET || 'nexus-tcgrading-secret-key-2024'

function verifyAdminToken(request: NextRequest): { valid: boolean; error?: string; status?: number } {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return { valid: false, error: 'No authentication token provided', status: 401 }
    }

    const decoded = verify(token, JWT_SECRET) as any

    // Handle both token formats
    const role = decoded.role || decoded.user?.role

    if (!role) {
      return { valid: false, error: 'Invalid token format', status: 401 }
    }

    if (role !== 'admin') {
      return { valid: false, error: 'Access denied. Admin role required.', status: 403 }
    }

    return { valid: true }
  } catch (error) {
    console.error('Token verification error:', error)
    return { valid: false, error: 'Invalid or expired token', status: 401 }
  }
}

// GET - Get email settings
export async function GET(req: NextRequest) {
  try {
    const authCheck = verifyAdminToken(req)
    if (!authCheck.valid) {
      return NextResponse.json({
        success: false,
        error: authCheck.error
      }, { status: authCheck.status })
    }

    await initializeDatabase()

    // Get email settings from email_settings table
    const settings = await runQuerySingle(
      `SELECT * FROM email_settings ORDER BY id DESC LIMIT 1`
    )

    if (settings) {
      return NextResponse.json({
        success: true,
        settings: {
          smtp_host: settings.smtp_host || '',
          smtp_port: settings.smtp_port || 587,
          smtp_username: settings.smtp_username || '',
          smtp_password: settings.smtp_password ? '••••••••' : '',
          from_name: settings.from_name || 'Nexus TCGrading',
          from_email: settings.from_email || '',
          enable_ssl: settings.enable_ssl === 1
        }
      })
    }

    // Return default settings if none exist
    return NextResponse.json({
      success: true,
      settings: {
        smtp_host: '',
        smtp_port: 587,
        smtp_username: '',
        smtp_password: '',
        from_name: 'Nexus TCGrading',
        from_email: '',
        enable_ssl: true
      }
    })

  } catch (error: any) {
    console.error('Error fetching email settings:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// POST - Save email settings
export async function POST(req: NextRequest) {
  try {
    const authCheck = verifyAdminToken(req)
    if (!authCheck.valid) {
      return NextResponse.json({
        success: false,
        error: authCheck.error
      }, { status: authCheck.status })
    }

    const body = await req.json()
    const { smtp_host, smtp_port, smtp_username, smtp_password, from_name, from_email, enable_ssl } = body

    if (!smtp_host || !smtp_port || !smtp_username || !from_email) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: smtp_host, smtp_port, smtp_username, and from_email are required'
      }, { status: 400 })
    }

    await initializeDatabase()

    // Check if settings exist
    const existing = await runQuerySingle(
      `SELECT * FROM email_settings ORDER BY id DESC LIMIT 1`
    )

    // If password is masked, get the existing password
    let finalPassword = smtp_password
    if (smtp_password === '••••••••' && existing) {
      finalPassword = existing.smtp_password
    }

    if (!finalPassword && !existing?.smtp_password) {
      return NextResponse.json({
        success: false,
        error: 'SMTP password is required'
      }, { status: 400 })
    }

    const enableSslValue = enable_ssl === true || enable_ssl === 1 ? 1 : 0

    if (existing) {
      // Update existing settings
      await runQuery(
        `UPDATE email_settings
         SET smtp_host = ?, smtp_port = ?, smtp_username = ?, smtp_password = ?,
             from_name = ?, from_email = ?, enable_ssl = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [smtp_host, parseInt(smtp_port), smtp_username, finalPassword,
         from_name || 'Nexus TCGrading', from_email, enableSslValue, existing.id]
      )
    } else {
      // Insert new settings
      await runQuery(
        `INSERT INTO email_settings (smtp_host, smtp_port, smtp_username, smtp_password, from_name, from_email, enable_ssl, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [smtp_host, parseInt(smtp_port), smtp_username, finalPassword,
         from_name || 'Nexus TCGrading', from_email, enableSslValue]
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Email settings saved successfully'
    })

  } catch (error: any) {
    console.error('Error saving email settings:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
