'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, Minus, Trash2, Eye, EyeOff, Package as PackageIcon } from 'lucide-react'
import StripeCheckout from './components/StripeCheckout'

interface CartItem {
  packageId: string
  packageName: string
  price: number
  quantity: number
}

interface PaymentData {
  packageId: string
  packageName: string
  packagePrice: number
  cards: CartItem[]
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
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

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
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // Order summary modification functions
  const updateItemQuantity = (packageId: string, delta: number) => {
    if (!paymentData) return

    const updatedCards = paymentData.cards.map(item => {
      if (item.packageId === packageId) {
        const newQuantity = Math.max(1, item.quantity + delta)
        return { ...item, quantity: newQuantity }
      }
      return item
    })

    updatePaymentData(updatedCards)
  }

  const removeItem = (packageId: string) => {
    if (!paymentData) return

    const updatedCards = paymentData.cards.filter(item => item.packageId !== packageId)

    if (updatedCards.length === 0) {
      // Clear cart and redirect if no items left
      localStorage.removeItem('paymentData')
      localStorage.removeItem('cart')
      window.dispatchEvent(new Event('cartUpdated'))
      router.push('/packages')
      return
    }

    updatePaymentData(updatedCards)
  }

  const updatePaymentData = (updatedCards: CartItem[]) => {
    const subtotal = updatedCards.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const tax = subtotal * 0.08
    const totalCards = updatedCards.reduce((sum, item) => sum + item.quantity, 0)

    const newPaymentData: PaymentData = {
      packageId: updatedCards.map(item => item.packageId).join(','),
      packageName: updatedCards.map(item => item.packageName).join(', '),
      packagePrice: updatedCards.length > 0 ? updatedCards[0].price : 0,
      cards: updatedCards,
      totalCards: totalCards,
      subtotal: subtotal,
      tax: tax,
      shipping: 0,
      total: subtotal + tax
    }

    setPaymentData(newPaymentData)
    localStorage.setItem('paymentData', JSON.stringify(newPaymentData))

    // Also update the cart in localStorage
    localStorage.setItem('cart', JSON.stringify(updatedCards))
    window.dispatchEvent(new Event('cartUpdated'))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format'

    if (!formData.password) newErrors.password = 'Password is required'
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters'

    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password'
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'

    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required'
    if (!formData.address.trim()) newErrors.address = 'Address is required'
    if (!formData.city.trim()) newErrors.city = 'City is required'
    if (!formData.state.trim()) newErrors.state = 'State is required'
    if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP code is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handlePaymentSuccess = async (paymentIntent: any) => {
    try {
      // First, register the user
      const registerResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone
        })
      })

      const registerResult = await registerResponse.json()
      let userId = null

      if (registerResult.success) {
        userId = registerResult.user.id
        // Store user data for auto-login
        localStorage.setItem('currentUser', JSON.stringify(registerResult.user))
        if (registerResult.token) {
          localStorage.setItem('authToken', registerResult.token)
        }
      } else {
        console.error('Registration failed:', registerResult.error)
      }

      // Format cards data for order API - it expects cards with card.name and card.game
      const formattedCards = paymentData!.cards.map(item => ({
        card: {
          name: item.packageName,
          game: 'TCG Grading'
        },
        quantity: item.quantity,
        price: item.price
      }))

      // Save order to database
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          package_id: paymentData!.packageId,
          package_name: paymentData!.packageName,
          package_price: paymentData!.packagePrice,
          total_cards: paymentData!.totalCards,
          subtotal: paymentData!.subtotal,
          tax: paymentData!.tax,
          shipping: paymentData!.shipping,
          total: paymentData!.total,
          cards: formattedCards,
          payment_intent_id: paymentIntent.id,
          payment_status: 'paid',
          customer_info: {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            country: formData.country
          }
        })
      })

      const orderResult = await orderResponse.json()
      console.log('Order saved:', orderResult)

      // Payment successful - redirect to confirmation
      const confirmationData = {
        ...paymentData,
        customerInfo: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country
        },
        paymentMethod: 'stripe',
        orderNumber: paymentIntent.metadata?.order_number || `TCG-${Date.now()}`,
        orderDate: new Date().toISOString(),
        paymentIntentId: paymentIntent.id,
        status: 'success'
      }

      localStorage.setItem('confirmationData', JSON.stringify(confirmationData))
      localStorage.removeItem('orderData')
      localStorage.removeItem('paymentData')
      localStorage.removeItem('cart')
      window.dispatchEvent(new Event('cartUpdated'))
      router.push('/packages/confirmation')

    } catch (error) {
      console.error('Post-payment processing error:', error)
      // Still redirect to confirmation since payment succeeded
      const confirmationData = {
        ...paymentData,
        customerInfo: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country
        },
        paymentMethod: 'stripe',
        orderNumber: `TCG-${Date.now()}`,
        orderDate: new Date().toISOString(),
        paymentIntentId: paymentIntent.id,
        status: 'success'
      }

      localStorage.setItem('confirmationData', JSON.stringify(confirmationData))
      localStorage.removeItem('orderData')
      localStorage.removeItem('paymentData')
      localStorage.removeItem('cart')
      window.dispatchEvent(new Event('cartUpdated'))
      router.push('/packages/confirmation')
    }
  }

  const handlePaymentError = (error: string) => {
    alert('Payment failed: ' + error)
    setIsProcessing(false)
  }

  const isFormValid = () => {
    return (
      formData.firstName.trim() &&
      formData.lastName.trim() &&
      formData.email.trim() &&
      formData.password &&
      formData.password.length >= 8 &&
      formData.confirmPassword &&
      formData.password === formData.confirmPassword &&
      formData.phone.trim() &&
      formData.address.trim() &&
      formData.city.trim() &&
      formData.state.trim() &&
      formData.zipCode.trim()
    )
  }

  if (isLoading || !paymentData) {
    return (
      <div id="payment-page-loading" className="min-h-screen flex items-center justify-center bg-[#0b0b0b]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d83f0a]"></div>
      </div>
    )
  }

  return (
    <div id="payment-page" className="min-h-screen bg-[#0b0b0b] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 id="payment-page-title" className="text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-[#d83f0a] to-[#d66a0a] bg-clip-text text-transparent">Checkout</span>
          </h1>
          <p className="text-gray-400">
            Create your account and complete your order
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Registration & Shipping Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Information */}
            <motion.div
              id="account-info-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#171717] border border-gray-800 rounded-xl p-6"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Account Information</h2>

              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label id="label-firstName" className="block text-sm font-medium text-gray-300 mb-2">First Name *</label>
                    <input
                      id="input-firstName"
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#d83f0a] focus:outline-none bg-[#0b0b0b] text-white ${errors.firstName ? 'border-red-500' : 'border-gray-700'}`}
                      placeholder="John"
                    />
                    {errors.firstName && <p id="error-firstName" className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label id="label-lastName" className="block text-sm font-medium text-gray-300 mb-2">Last Name *</label>
                    <input
                      id="input-lastName"
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#d83f0a] focus:outline-none bg-[#0b0b0b] text-white ${errors.lastName ? 'border-red-500' : 'border-gray-700'}`}
                      placeholder="Doe"
                    />
                    {errors.lastName && <p id="error-lastName" className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                  </div>
                </div>

                <div>
                  <label id="label-email" className="block text-sm font-medium text-gray-300 mb-2">Email Address *</label>
                  <input
                    id="input-email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#d83f0a] focus:outline-none bg-[#0b0b0b] text-white ${errors.email ? 'border-red-500' : 'border-gray-700'}`}
                    placeholder="john@example.com"
                  />
                  {errors.email && <p id="error-email" className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label id="label-password" className="block text-sm font-medium text-gray-300 mb-2">Password *</label>
                    <div className="relative">
                      <input
                        id="input-password"
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#d83f0a] focus:outline-none bg-[#0b0b0b] text-white pr-12 ${errors.password ? 'border-red-500' : 'border-gray-700'}`}
                        placeholder="Min. 8 characters"
                      />
                      <button
                        id="toggle-password-visibility"
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.password && <p id="error-password" className="text-red-500 text-sm mt-1">{errors.password}</p>}
                  </div>
                  <div>
                    <label id="label-confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">Confirm Password *</label>
                    <div className="relative">
                      <input
                        id="input-confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#d83f0a] focus:outline-none bg-[#0b0b0b] text-white pr-12 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-700'}`}
                        placeholder="Confirm password"
                      />
                      <button
                        id="toggle-confirm-password-visibility"
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p id="error-confirmPassword" className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                  </div>
                </div>

                <div>
                  <label id="label-phone" className="block text-sm font-medium text-gray-300 mb-2">Phone Number *</label>
                  <input
                    id="input-phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#d83f0a] focus:outline-none bg-[#0b0b0b] text-white ${errors.phone ? 'border-red-500' : 'border-gray-700'}`}
                    placeholder="(555) 123-4567"
                  />
                  {errors.phone && <p id="error-phone" className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>
              </div>
            </motion.div>

            {/* Shipping Address */}
            <motion.div
              id="shipping-address-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#171717] border border-gray-800 rounded-xl p-6"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Shipping Address</h2>

              <div className="space-y-4">
                <div>
                  <label id="label-address" className="block text-sm font-medium text-gray-300 mb-2">Street Address *</label>
                  <input
                    id="input-address"
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#d83f0a] focus:outline-none bg-[#0b0b0b] text-white ${errors.address ? 'border-red-500' : 'border-gray-700'}`}
                    placeholder="123 Main Street"
                  />
                  {errors.address && <p id="error-address" className="text-red-500 text-sm mt-1">{errors.address}</p>}
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label id="label-city" className="block text-sm font-medium text-gray-300 mb-2">City *</label>
                    <input
                      id="input-city"
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#d83f0a] focus:outline-none bg-[#0b0b0b] text-white ${errors.city ? 'border-red-500' : 'border-gray-700'}`}
                      placeholder="New York"
                    />
                    {errors.city && <p id="error-city" className="text-red-500 text-sm mt-1">{errors.city}</p>}
                  </div>
                  <div>
                    <label id="label-state" className="block text-sm font-medium text-gray-300 mb-2">State *</label>
                    <input
                      id="input-state"
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#d83f0a] focus:outline-none bg-[#0b0b0b] text-white ${errors.state ? 'border-red-500' : 'border-gray-700'}`}
                      placeholder="NY"
                    />
                    {errors.state && <p id="error-state" className="text-red-500 text-sm mt-1">{errors.state}</p>}
                  </div>
                  <div>
                    <label id="label-zipCode" className="block text-sm font-medium text-gray-300 mb-2">ZIP Code *</label>
                    <input
                      id="input-zipCode"
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#d83f0a] focus:outline-none bg-[#0b0b0b] text-white ${errors.zipCode ? 'border-red-500' : 'border-gray-700'}`}
                      placeholder="10001"
                    />
                    {errors.zipCode && <p id="error-zipCode" className="text-red-500 text-sm mt-1">{errors.zipCode}</p>}
                  </div>
                </div>

                <div>
                  <label id="label-country" className="block text-sm font-medium text-gray-300 mb-2">Country</label>
                  <select
                    id="input-country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:ring-2 focus:ring-[#d83f0a] focus:outline-none bg-[#0b0b0b] text-white"
                  >
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Australia">Australia</option>
                  </select>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Order Summary - Brand Orange Accent Theme */}
          <div className="lg:col-span-1">
            <motion.div
              id="order-summary-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white border-2 border-[#d83f0a] rounded-xl p-6 sticky top-24 shadow-lg"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-[#d83f0a] to-[#d66a0a] rounded-lg flex items-center justify-center">
                  <PackageIcon className="h-5 w-5 text-white" />
                </div>
                Order Summary
              </h2>

              {/* Editable Cart Items */}
              <div id="order-items-list" className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                {paymentData.cards.map((item) => (
                  <div
                    key={item.packageId}
                    id={`order-item-${item.packageId}`}
                    className="bg-gray-50 border border-[#d83f0a]/20 rounded-lg p-3"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#d83f0a] to-[#d66a0a] rounded-lg flex items-center justify-center flex-shrink-0">
                        <PackageIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-gray-900 font-medium text-sm truncate">{item.packageName}</h4>
                        <p className="text-xs text-gray-500">${item.price.toFixed(2)} / card</p>
                      </div>
                      <button
                        id={`remove-item-${item.packageId}`}
                        onClick={() => removeItem(item.packageId)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center space-x-2">
                        <button
                          id={`decrease-qty-${item.packageId}`}
                          onClick={() => updateItemQuantity(item.packageId, -1)}
                          disabled={item.quantity <= 1}
                          className="p-1 bg-[#d83f0a]/10 border border-[#d83f0a]/30 rounded text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#d83f0a]/20"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span id={`qty-display-${item.packageId}`} className="text-gray-900 font-medium w-8 text-center text-sm">{item.quantity}</span>
                        <button
                          id={`increase-qty-${item.packageId}`}
                          onClick={() => updateItemQuantity(item.packageId, 1)}
                          className="p-1 bg-[#d83f0a]/10 border border-[#d83f0a]/30 rounded text-gray-700 hover:bg-[#d83f0a]/20"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span id={`item-total-${item.packageId}`} className="text-[#d83f0a] font-bold text-sm">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Summary */}
              <div id="price-summary" className="space-y-3 border-t border-[#d83f0a]/20 pt-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Cards</span>
                  <span id="total-cards-count" className="font-medium text-gray-900">{paymentData.totalCards}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span id="subtotal-amount" className="font-medium text-gray-900">${paymentData.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (8%)</span>
                  <span id="tax-amount" className="font-medium text-gray-900">${paymentData.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span id="shipping-amount" className="font-medium text-green-600">FREE</span>
                </div>
                <div className="border-t border-[#d83f0a]/20 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <span id="total-amount" className="text-2xl font-bold text-[#d83f0a]">
                      ${paymentData.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Section */}
              <div id="payment-methods-section" className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Payment Method</h3>
                {isFormValid() ? (
                  <StripeCheckout
                    paymentData={paymentData}
                    customerInfo={{
                      name: `${formData.firstName} ${formData.lastName}`,
                      email: formData.email,
                      phone: formData.phone,
                      address: formData.address,
                      city: formData.city,
                      state: formData.state,
                      zipCode: formData.zipCode,
                      country: formData.country
                    }}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                ) : (
                  <div id="form-incomplete-warning" className="p-4 bg-[#d83f0a]/10 border border-[#d83f0a]/30 rounded-lg">
                    <p className="text-[#d83f0a] text-sm font-medium">
                      Please fill out all required fields above to enable payment.
                    </p>
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-500 mt-4 text-center">
                Your payment information is secure and encrypted
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
