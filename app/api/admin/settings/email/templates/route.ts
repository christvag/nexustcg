import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware } from '@/lib/middleware/auth'
import fs from 'fs'
import path from 'path'

const TEMPLATES_FILE = path.join(process.cwd(), 'database', 'email-templates.json')

// Default templates
const defaultTemplates = [
  {
    id: 'order_confirmation',
    name: 'Order Confirmation',
    description: 'Sent when a customer places a new order',
    subject: 'Order Confirmation - #{order_number}',
    body: `Dear {customer_name},

Thank you for your order with Nexus TCGrading!

Order Details:
- Order Number: #{order_number}
- Order Date: {order_date}
- Total Items: {total_items}
- Total Amount: \${total_amount}

What's Next?
1. Please ship your cards to our grading facility
2. We'll notify you once we receive your package
3. Grading typically takes 5-10 business days

If you have any questions, please contact us at support@nexusgrading.com.

Best regards,
The Nexus TCGrading Team`,
    isEnabled: true,
    triggerEvent: 'order.created',
    category: 'order',
    variables: ['customer_name', 'order_number', 'order_date', 'total_items', 'total_amount']
  },
  {
    id: 'cards_received',
    name: 'Cards Received',
    description: 'Sent when cards are received at the grading facility',
    subject: 'Your Cards Have Been Received - Order #{order_number}',
    body: `Dear {customer_name},

Great news! We have received your cards for Order #{order_number}.

Your cards are now being prepared for the grading process.

Thank you for choosing Nexus TCGrading!

Best regards,
The Nexus TCGrading Team`,
    isEnabled: true,
    triggerEvent: 'order.cards_received',
    category: 'order',
    variables: ['customer_name', 'order_number', 'total_cards', 'received_date']
  },
  {
    id: 'grading_complete',
    name: 'Grading Complete',
    description: 'Sent when all cards have been graded',
    subject: 'Grading Complete - Order #{order_number}',
    body: `Dear {customer_name},

The grading for your Order #{order_number} has been completed!

Your graded cards are now being prepared for shipping.

Thank you for trusting Nexus TCGrading with your valuable cards!

Best regards,
The Nexus TCGrading Team`,
    isEnabled: true,
    triggerEvent: 'order.grading_complete',
    category: 'grading',
    variables: ['customer_name', 'order_number', 'total_cards', 'average_grade']
  },
  {
    id: 'population_report_published',
    name: 'Population Report Published',
    description: 'Sent when cards are added to the population report',
    subject: 'Your Cards Are Now in the Population Report!',
    body: `Dear {customer_name},

Your graded cards from Order #{order_number} are now officially part of the Nexus TCGrading Population Report!

Thank you for being part of the Nexus TCGrading community!

Best regards,
The Nexus TCGrading Team`,
    isEnabled: true,
    triggerEvent: 'cards.population_published',
    category: 'grading',
    variables: ['customer_name', 'order_number', 'cards_list']
  },
  {
    id: 'order_shipped',
    name: 'Order Shipped',
    description: 'Sent when the graded cards are shipped back',
    subject: 'Your Graded Cards Are On The Way! - Order #{order_number}',
    body: `Dear {customer_name},

Your graded cards from Order #{order_number} have been shipped!

Tracking Number: {tracking_number}

Thank you for choosing Nexus TCGrading!

Best regards,
The Nexus TCGrading Team`,
    isEnabled: true,
    triggerEvent: 'order.shipped',
    category: 'order',
    variables: ['customer_name', 'order_number', 'tracking_number', 'shipping_carrier']
  },
  {
    id: 'order_cancelled',
    name: 'Order Cancelled',
    description: 'Sent when an order is cancelled',
    subject: 'Order Cancelled - #{order_number}',
    body: `Dear {customer_name},

Your Order #{order_number} has been cancelled.

If you did not request this cancellation, please contact us immediately.

Best regards,
The Nexus TCGrading Team`,
    isEnabled: true,
    triggerEvent: 'order.cancelled',
    category: 'order',
    variables: ['customer_name', 'order_number', 'cancellation_reason']
  }
]

// GET - Retrieve email templates
export async function GET(request: NextRequest) {
  try {
    // Authenticate admin user
    const authResult = await authMiddleware(request, 'admin')

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }

    // Try to read templates from file
    let templates = defaultTemplates

    try {
      if (fs.existsSync(TEMPLATES_FILE)) {
        const fileContent = fs.readFileSync(TEMPLATES_FILE, 'utf-8')
        templates = JSON.parse(fileContent)
      }
    } catch (readError) {
      console.log('[email-templates] Using default templates')
    }

    return NextResponse.json({
      success: true,
      templates
    })

  } catch (error) {
    console.error('[email-templates] GET Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve email templates' },
      { status: 500 }
    )
  }
}

// POST - Save email templates
export async function POST(request: NextRequest) {
  try {
    // Authenticate admin user
    const authResult = await authMiddleware(request, 'admin')

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }

    const body = await request.json()
    const { templates } = body

    if (!templates || !Array.isArray(templates)) {
      return NextResponse.json(
        { success: false, error: 'Invalid templates data' },
        { status: 400 }
      )
    }

    // Ensure database directory exists
    const dbDir = path.dirname(TEMPLATES_FILE)
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }

    // Save templates to file
    fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(templates, null, 2))

    return NextResponse.json({
      success: true,
      message: 'Email templates saved successfully'
    })

  } catch (error) {
    console.error('[email-templates] POST Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save email templates' },
      { status: 500 }
    )
  }
}
