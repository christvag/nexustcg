import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
})

export async function POST(request: NextRequest) {
  try {
    const { amount, currency, customerInfo, orderData } = await request.json()

    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: {
        order_number: `TCG-${Date.now()}`,
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        package_name: orderData.packageName,
        total_cards: orderData.totalCards.toString()
      },
      receipt_email: customerInfo.email,
      shipping: {
        name: customerInfo.name,
        phone: customerInfo.phone,
        address: {
          line1: customerInfo.address,
          city: customerInfo.city,
          state: customerInfo.state,
          postal_code: customerInfo.zipCode,
          country: customerInfo.country === 'United States' ? 'US' : 'US'
        }
      }
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret
    })

  } catch (error) {
    console.error('Payment intent creation failed:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}