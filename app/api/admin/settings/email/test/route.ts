import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { emailService, SMTPSettings } from '@/lib/email-service'
import { runQuerySingle, initializeDatabase } from '@/lib/user-database'

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

// POST - Test email settings by sending a test email
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
    const { test_email } = body

    if (!test_email) {
      return NextResponse.json({
        success: false,
        error: 'Test email address is required'
      }, { status: 400 })
    }

    await initializeDatabase()

    // Get email settings from database
    const settingsRow = await runQuerySingle(
      `SELECT * FROM email_settings ORDER BY id DESC LIMIT 1`
    )

    if (!settingsRow) {
      return NextResponse.json({
        success: false,
        error: 'SMTP settings not configured. Please save your SMTP settings first.'
      }, { status: 400 })
    }

    if (!settingsRow.smtp_host || !settingsRow.smtp_username || !settingsRow.smtp_password) {
      return NextResponse.json({
        success: false,
        error: 'SMTP settings are incomplete. Please configure all required fields.'
      }, { status: 400 })
    }

    const settings: SMTPSettings = {
      smtp_host: settingsRow.smtp_host,
      smtp_port: settingsRow.smtp_port || 587,
      smtp_username: settingsRow.smtp_username,
      smtp_password: settingsRow.smtp_password,
      from_name: settingsRow.from_name || 'Nexus TCGrading',
      from_email: settingsRow.from_email,
      enable_ssl: settingsRow.enable_ssl === 1
    }

    // Configure email service with saved settings
    await emailService.configure(settings)

    // Test the connection first
    const connectionTest = await emailService.testConnection()
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        error: `SMTP connection failed: ${connectionTest.message}`
      }, { status: 400 })
    }

    // Send test email
    const result = await emailService.sendTestEmail(test_email)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${test_email}`
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.message
      }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Error testing email:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to send test email',
      details: error.message
    }, { status: 500 })
  }
}
