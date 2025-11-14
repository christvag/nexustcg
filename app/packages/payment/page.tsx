'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import StripeCheckout from './components/StripeCheckout'

interface PaymentData {
  packageId: string
  packageName: string
  packagePrice: number
  cards: any[]
  totalCards: number
  subtotal: number
  tax: number
  shipping: number
  total: number
}

export default function PaymentPage() {
  const router = useRouter()
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
  })

  useEffect(() => {
    const data = localStorage.getItem('paymentData')
    if (!data) {
      router.push('/packages')
      return
    }
    setPaymentData(JSON.parse(data))
    setIsLoading(false)
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handlePaymentSuccess = async (paymentIntent: any) => {
    try {
      // Save order to database if user is authenticated
      const userData = JSON.parse(localStorage.getItem('paymentData') || '{}')
      
      if (userData.user && userData.user.id !== 999999) {
        const orderResponse = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userData.user.id,
            package_id: paymentData!.packageId,
            package_name: paymentData!.packageName,
            package_price: paymentData!.packagePrice,
            total_cards: paymentData!.totalCards,
            subtotal: paymentData!.subtotal,
            tax: paymentData!.tax,
            shipping: paymentData!.shipping,
            total: paymentData!.total,
            cards: paymentData!.cards,
            payment_intent_id: paymentIntent.id,
            payment_status: 'paid',
            customer_info: formData
          })
        })

        const orderResult = await orderResponse.json()
        console.log('Order saved:', orderResult)
      }

      // Payment successful - redirect to confirmation
      const confirmationData = {
        ...paymentData,
        customerInfo: formData,
        paymentMethod: 'stripe',
        orderNumber: paymentIntent.metadata?.order_number || `TCG-${Date.now()}`,
        orderDate: new Date().toISOString(),
        paymentIntentId: paymentIntent.id,
        status: 'success'
      }
      
      localStorage.setItem('confirmationData', JSON.stringify(confirmationData))
      localStorage.removeItem('orderData')
      localStorage.removeItem('paymentData')
      router.push('/packages/confirmation')
      
    } catch (error) {
      console.error('Post-payment processing error:', error)
      // Still redirect to confirmation since payment succeeded
      const confirmationData = {
        ...paymentData,
        customerInfo: formData,
        paymentMethod: 'stripe',
        orderNumber: `TCG-${Date.now()}`,
        orderDate: new Date().toISOString(),
        paymentIntentId: paymentIntent.id,
        status: 'success'
      }
      
      localStorage.setItem('confirmationData', JSON.stringify(confirmationData))
      localStorage.removeItem('orderData')
      localStorage.removeItem('paymentData')
      router.push('/packages/confirmation')
    }
  }

  const handlePaymentError = (error: string) => {
    alert('Payment failed: ' + error)
    setIsProcessing(false)
  }

  const handlePayPalPayment = () => {
    // Similar to Stripe, but using PayPal SDK
    alert('PayPal integration would be implemented here')
  }

  if (isLoading || !paymentData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gaming-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-gradient">Payment Information</span>
          </h1>
          <p className="text-gray-300">
            Enter your details to complete your order
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-900 rounded-xl shadow-lg p-6"
            >
              <h2 className="text-2xl font-bold mb-6">Customer Information</h2>
              
              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-gaming-primary focus:outline-none bg-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-gaming-primary focus:outline-none bg-gray-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-gaming-primary focus:outline-none bg-gray-800"
                  />
                </div>

                <h3 className="text-lg font-semibold mt-6">Shipping Address</h3>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Street Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-gaming-primary focus:outline-none bg-gray-800"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-gaming-primary focus:outline-none bg-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-gaming-primary focus:outline-none bg-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">ZIP Code</label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-gaming-primary focus:outline-none bg-gray-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Country</label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-gaming-primary focus:outline-none bg-gray-800"
                  >
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Australia">Australia</option>
                  </select>
                </div>
              </form>
            </motion.div>
          </div>

          {/* Order Summary & Payment Options */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-900 rounded-xl shadow-lg p-6 sticky top-24"
            >
              <h2 className="text-2xl font-bold mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-400">Package</span>
                  <span className="font-medium">{paymentData.packageName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Cards</span>
                  <span className="font-medium">{paymentData.totalCards}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="font-medium">${paymentData.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tax</span>
                  <span className="font-medium">${paymentData.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Shipping</span>
                  <span className="font-medium">
                    {paymentData.shipping === 0 ? 'FREE' : `$${paymentData.shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="border-t border-gray-700 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-2xl font-bold text-gradient">
                      ${paymentData.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-3">Payment Method</h3>
                {formData.name && formData.email && formData.address ? (
                  <StripeCheckout
                    paymentData={paymentData}
                    customerInfo={formData}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                ) : (
                  <div className="p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                    <p className="text-yellow-200 text-sm">
                      Please fill out all required customer information fields above to enable payment.
                    </p>
                  </div>
                )}
                
                <div className="text-center">
                  <p className="text-sm text-gray-400 mb-2">Or</p>
                  <button
                    onClick={handlePayPalPayment}
                    disabled={isProcessing || !formData.name || !formData.email}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Pay with PayPal (Coming Soon)
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-400 mt-4 text-center">
                Your payment information is secure and encrypted
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}