'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentFormProps {
  paymentData: any
  customerInfo: any
  onSuccess: (paymentIntent: any) => void
  onError: (error: string) => void
}

function PaymentForm({ paymentData, customerInfo, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)

    try {
      // Create payment intent
      const response = await fetch('/api/payments/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(paymentData.total * 100), // Convert to cents
          currency: 'usd',
          customerInfo,
          orderData: paymentData
        })
      })

      const { clientSecret, error: backendError } = await response.json()

      if (backendError) {
        onError(backendError)
        setIsProcessing(false)
        return
      }

      // Confirm payment with card element
      const cardElement = elements.getElement(CardElement)
      
      if (!cardElement) {
        onError('Card element not found')
        setIsProcessing(false)
        return
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: customerInfo.name,
            email: customerInfo.email,
            phone: customerInfo.phone,
            address: {
              line1: customerInfo.address,
              city: customerInfo.city,
              state: customerInfo.state,
              postal_code: customerInfo.zipCode,
              country: customerInfo.country === 'United States' ? 'US' : 'CA'
            }
          }
        }
      })

      if (error) {
        onError(error.message || 'Payment failed')
      } else if (paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent)
      }
    } catch (err) {
      onError('Payment failed. Please try again.')
    }

    setIsProcessing(false)
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#d1d5db', // text-gray-300
        '::placeholder': {
          color: '#9ca3af', // text-gray-400
        },
        backgroundColor: 'transparent',
      },
      invalid: {
        color: '#f87171', // text-red-400
      },
    },
    hidePostalCode: true,
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 border border-gray-700 rounded-lg bg-gray-800">
        <label className="block text-sm font-medium mb-3 text-gray-300">
          Card Details
        </label>
        <CardElement options={cardElementOptions} />
      </div>
      
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-gradient-to-r from-gaming-primary to-gaming-secondary text-white py-3 rounded-lg font-medium hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Processing Payment...
          </>
        ) : (
          `Pay $${paymentData.total.toFixed(2)}`
        )}
      </button>
    </form>
  )
}

export default function StripeCheckout({ paymentData, customerInfo, onSuccess, onError }: PaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm 
        paymentData={paymentData}
        customerInfo={customerInfo}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  )
}