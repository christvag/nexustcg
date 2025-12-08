import nodemailer from 'nodemailer'

export interface SMTPSettings {
  smtp_host: string
  smtp_port: number
  smtp_username: string
  smtp_password: string
  from_name: string
  from_email: string
  enable_ssl: boolean
}

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null
  private settings: SMTPSettings | null = null

  async configure(settings: SMTPSettings): Promise<void> {
    this.settings = settings

    this.transporter = nodemailer.createTransport({
      host: settings.smtp_host,
      port: settings.smtp_port,
      secure: settings.enable_ssl && settings.smtp_port === 465, // true for 465, false for other ports
      auth: {
        user: settings.smtp_username,
        pass: settings.smtp_password
      },
      tls: {
        rejectUnauthorized: false // Allow self-signed certificates
      }
    })
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.transporter) {
      return { success: false, message: 'Email service not configured' }
    }

    try {
      await this.transporter.verify()
      return { success: true, message: 'SMTP connection successful' }
    } catch (error: any) {
      console.error('SMTP test failed:', error)
      return {
        success: false,
        message: error.message || 'SMTP connection failed'
      }
    }
  }

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; message: string; messageId?: string }> {
    if (!this.transporter || !this.settings) {
      return { success: false, message: 'Email service not configured' }
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"${this.settings.from_name}" <${this.settings.from_email}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, '')
      })

      console.log('Email sent:', info.messageId)
      return {
        success: true,
        message: 'Email sent successfully',
        messageId: info.messageId
      }
    } catch (error: any) {
      console.error('Failed to send email:', error)
      return {
        success: false,
        message: error.message || 'Failed to send email'
      }
    }
  }

  async sendTestEmail(to: string): Promise<{ success: boolean; message: string }> {
    return this.sendEmail({
      to,
      subject: 'Test Email from Nexus TCGrading',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #d83f0a 0%, #d66a0a 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Nexus TCGrading</h1>
          </div>
          <div style="padding: 30px; background: #1f2937; color: #e5e7eb;">
            <h2 style="color: white;">Test Email Successful!</h2>
            <p>This is a test email to verify your SMTP configuration is working correctly.</p>
            <p style="color: #9ca3af; font-size: 14px;">
              Sent at: ${new Date().toISOString()}
            </p>
          </div>
          <div style="padding: 20px; background: #111827; color: #6b7280; text-align: center; font-size: 12px;">
            <p>This email was sent from Nexus TCGrading Admin Settings</p>
          </div>
        </div>
      `
    })
  }

  async sendOrderStatusEmail(to: string, orderNumber: string, status: string, customerName: string): Promise<{ success: boolean; message: string }> {
    const statusMessages: { [key: string]: string } = {
      pending: 'Your order has been received and is pending processing.',
      received: 'We have received your cards at our facility.',
      in_progress: 'Your cards are being prepared for grading.',
      grading: 'Your cards are currently being graded by our experts.',
      completed: 'Grading is complete! Your cards are ready for shipment.',
      shipped: 'Your graded cards have been shipped back to you.',
      delivered: 'Your order has been delivered successfully!'
    }

    const statusMessage = statusMessages[status] || `Your order status has been updated to: ${status}`

    return this.sendEmail({
      to,
      subject: `Order ${orderNumber} - Status Update`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #d83f0a 0%, #d66a0a 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Nexus TCGrading</h1>
          </div>
          <div style="padding: 30px; background: #1f2937; color: #e5e7eb;">
            <h2 style="color: white;">Order Status Update</h2>
            <p>Hello ${customerName},</p>
            <p>${statusMessage}</p>
            <div style="background: #374151; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0; color: #9ca3af;">Order Number</p>
              <p style="margin: 5px 0 0; font-size: 18px; font-weight: bold; color: white;">${orderNumber}</p>
              <p style="margin: 15px 0 0; color: #9ca3af;">Status</p>
              <p style="margin: 5px 0 0; font-size: 18px; font-weight: bold; color: #d83f0a;">${status.replace(/_/g, ' ').toUpperCase()}</p>
            </div>
            <p>You can track your order status in your dashboard.</p>
          </div>
          <div style="padding: 20px; background: #111827; color: #6b7280; text-align: center; font-size: 12px;">
            <p>Thank you for choosing Nexus TCGrading</p>
          </div>
        </div>
      `
    })
  }
}

export const emailService = new EmailService()
