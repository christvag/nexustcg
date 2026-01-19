'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { CreditCard, Calendar, Lock } from 'lucide-react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

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
  const [cardError, setCardError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (stripe && elements) {
      setIsReady(true)
    }
  }, [stripe, elements])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setCardError(null)

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

      // Confirm payment with card number element
      const cardNumberElement = elements.getElement(CardNumberElement)

      if (!cardNumberElement) {
        onError('Card element not found')
        setIsProcessing(false)
        return
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardNumberElement,
          billing_details: {
            name: customerInfo.name,
            email: customerInfo.email,
            phone: customerInfo.phone,
            address: {
              line1: customerInfo.address,
              city: customerInfo.city,
              state: customerInfo.state,
              postal_code: customerInfo.zipCode,
              country: customerInfo.country === 'United States' ? 'US' :
                       customerInfo.country === 'Canada' ? 'CA' :
                       customerInfo.country === 'United Kingdom' ? 'GB' : 'AU'
            }
          }
        }
      })

      if (error) {
        setCardError(error.message || 'Payment failed')
        onError(error.message || 'Payment failed')
      } else if (paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent)
      }
    } catch (err) {
      setCardError('Payment failed. Please try again.')
      onError('Payment failed. Please try again.')
    }

    setIsProcessing(false)
  }

  const elementStyle = {
    style: {
      base: {
        fontSize: '16px',
        color: '#1f2937',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSmoothing: 'antialiased',
        '::placeholder': {
          color: '#6b7280',
        },
        iconColor: '#d83f0a',
      },
      invalid: {
        color: '#dc2626',
        iconColor: '#dc2626',
      },
      complete: {
        color: '#059669',
        iconColor: '#059669',
      },
    },
  }

  const handleCardChange = (event: any) => {
    if (event.error) {
      setCardError(event.error.message)
    } else {
      setCardError(null)
    }
  }

  if (!isReady) {
    return (
      <div id="stripe-loading" className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d83f0a] mx-auto mb-2"></div>
        <p className="text-gray-400 text-sm">Loading payment form...</p>
      </div>
    )
  }

  return (
    <form id="stripe-payment-form" onSubmit={handleSubmit} className="space-y-4">
      {/* Credit Card Form Container - White Background */}
      <div id="credit-card-form-container" className="bg-white rounded-xl p-5 shadow-sm">
        <h4 className="text-gray-800 font-semibold mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-[#d83f0a]" />
          Card Details
        </h4>

        {/* Card Number */}
        <div id="card-number-container" className="mb-4">
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Card Number
          </label>
          <div className="relative flex items-center border border-gray-300 rounded-lg bg-gray-50 hover:border-gray-400 focus-within:border-[#d83f0a] focus-within:ring-2 focus-within:ring-[#d83f0a]/20 transition-all">
            <div className="flex-1 p-3 pl-4">
              <CardNumberElement
                options={{
                  ...elementStyle,
                  showIcon: true,
                }}
                onChange={handleCardChange}
              />
            </div>
          </div>
        </div>

        {/* Expiry and CVC Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Expiry Date */}
          <div id="card-expiry-container">
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Expiry Date
            </label>
            <div className="relative flex items-center border border-gray-300 rounded-lg bg-gray-50 hover:border-gray-400 focus-within:border-[#d83f0a] focus-within:ring-2 focus-within:ring-[#d83f0a]/20 transition-all">
              <div className="pl-3 text-gray-400">
                <Calendar className="h-5 w-5" />
              </div>
              <div className="flex-1 p-3">
                <CardExpiryElement
                  options={elementStyle}
                  onChange={handleCardChange}
                />
              </div>
            </div>
          </div>

          {/* CVC */}
          <div id="card-cvc-container">
            <label className="block text-sm font-medium mb-2 text-gray-700">
              CVC
            </label>
            <div className="relative flex items-center border border-gray-300 rounded-lg bg-gray-50 hover:border-gray-400 focus-within:border-[#d83f0a] focus-within:ring-2 focus-within:ring-[#d83f0a]/20 transition-all">
              <div className="pl-3 text-gray-400">
                <Lock className="h-5 w-5" />
              </div>
              <div className="flex-1 p-3">
                <CardCvcElement
                  options={elementStyle}
                  onChange={handleCardChange}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {cardError && (
        <div id="card-error-message" className="p-3 bg-red-50 border border-red-300 rounded-lg">
          <p className="text-red-700 text-sm">{cardError}</p>
        </div>
      )}

      {/* Test Card Info */}
      <div id="test-card-info" className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-800 text-xs">
          <strong>Test Mode:</strong> Use card 4242 4242 4242 4242, any future date, any CVC
        </p>
      </div>

      {/* Submit Button */}
      <button
        id="stripe-submit-btn"
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-gradient-to-r from-[#d83f0a] to-[#d66a0a] text-white py-4 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Processing Payment...
          </>
        ) : (
          <>
            <Lock className="h-5 w-5 mr-2" />
            Pay ${paymentData.total.toFixed(2)}
          </>
        )}
      </button>

      {/* Security Badge */}
      <div id="security-badge" className="flex items-center justify-center space-x-2 text-gray-600 text-xs">
        <Lock className="h-3 w-3" />
        <span>Secured by Stripe</span>
      </div>
    </form>
  )
}

export default function StripeCheckout({ paymentData, customerInfo, onSuccess, onError }: PaymentFormProps) {
  const [stripeLoaded, setStripeLoaded] = useState(false)

  useEffect(() => {
    // Check if Stripe key exists
    if (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      setStripeLoaded(true)
    }
  }, [])

  if (!stripeLoaded) {
    return (
      <div id="stripe-not-configured" className="p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
        <p className="text-yellow-200 text-sm">Payment system is loading...</p>
      </div>
    )
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        appearance: {
          theme: 'flat',
          variables: {
            colorPrimary: '#d83f0a',
            colorBackground: '#f9fafb',
            colorText: '#1f2937',
            colorDanger: '#dc2626',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            borderRadius: '8px',
          },
        },
      }}
    >
      <PaymentForm
        paymentData={paymentData}
        customerInfo={customerInfo}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  )
}
