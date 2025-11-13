'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CartItem } from '@/lib/types'
import Image from 'next/image'

interface OrderData {
  packageId: string
  packageName: string
  packagePrice: number
  cards: CartItem[]
  totalCards: number
  totalPrice: number
}

export default function CheckoutPage() {
  const router = useRouter()
  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasAccount, setHasAccount] = useState(false)
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)
  const [userForm, setUserForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  })
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [formErrors, setFormErrors] = useState<string[]>([])

  useEffect(() => {
    const data = localStorage.getItem('orderData')
    if (!data) {
      router.push('/packages')
      return
    }
    setOrderData(JSON.parse(data))
    setIsLoading(false)
  }, [router])

  // Check if user is already logged in
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser))
    }
  }, [])

  if (isLoading || !orderData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gaming-primary"></div>
      </div>
    )
  }

  const subtotal = orderData.totalPrice
  const tax = Math.round(subtotal * 0.08 * 100) / 100
  const shipping = orderData.totalCards > 10 ? 0 : 9.99
  const total = subtotal + tax + shipping

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormErrors([])
    
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'login',
          ...loginForm
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setCurrentUser(data.user)
        localStorage.setItem('currentUser', JSON.stringify(data.user))
      } else {
        setFormErrors([data.error || 'Login failed'])
      }
    } catch (error) {
      setFormErrors(['Login failed. Please try again.'])
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormErrors([])
    
    // Basic validation
    const errors = []
    if (userForm.password !== userForm.confirmPassword) {
      errors.push('Passwords do not match')
    }
    if (userForm.password.length < 6) {
      errors.push('Password must be at least 6 characters')
    }
    if (!userForm.first_name || !userForm.last_name || !userForm.email) {
      errors.push('Please fill in all required fields')
    }
    
    if (errors.length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      setIsCreatingAccount(true)
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'register',
          ...userForm
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setCurrentUser(data.user)
        localStorage.setItem('currentUser', JSON.stringify(data.user))
      } else {
        setFormErrors([data.error || 'Registration failed'])
      }
    } catch (error) {
      setFormErrors(['Registration failed. Please try again.'])
    } finally {
      setIsCreatingAccount(false)
    }
  }

  const handleProceedToPayment = async () => {
    if (!currentUser) {
      setFormErrors(['Please login or create an account to continue'])
      return
    }

    try {
      // Create order in database
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: currentUser.id,
          package_id: orderData.packageId,
          package_name: orderData.packageName,
          package_price: orderData.packagePrice,
          total_cards: orderData.totalCards,
          subtotal,
          tax,
          shipping,
          total,
          cards: orderData.cards
        })
      })

      const orderResult = await orderResponse.json()

      if (orderResponse.ok && orderResult.success) {
        const paymentData = {
          ...orderData,
          subtotal,
          tax,
          shipping,
          total,
          user: currentUser,
          order_id: orderResult.order.id
        }
        localStorage.setItem('paymentData', JSON.stringify(paymentData))
        router.push('/packages/payment')
      } else {
        setFormErrors(['Failed to create order. Please try again.'])
      }
    } catch (error) {
      setFormErrors(['Failed to create order. Please try again.'])
    }
  }

  const handleFormChange = (form: 'user' | 'login', field: string, value: string) => {
    if (form === 'user') {
      setUserForm(prev => ({ ...prev, [field]: value }))
    } else {
      setLoginForm(prev => ({ ...prev, [field]: value }))
    }
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-gradient">Review Your Order</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Please review your order details before proceeding to payment
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Account Section */}
            {!currentUser ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6"
              >
                <h2 className="text-2xl font-bold mb-4">Account Information</h2>
                
                {formErrors.length > 0 && (
                  <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                    {formErrors.map((error, index) => (
                      <p key={index} className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                    ))}
                  </div>
                )}

                <div className="flex gap-4 mb-6">
                  <button
                    onClick={() => setHasAccount(false)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      !hasAccount 
                        ? 'bg-gaming-primary text-white' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Create Account
                  </button>
                  <button
                    onClick={() => setHasAccount(true)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      hasAccount 
                        ? 'bg-gaming-primary text-white' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Login
                  </button>
                </div>

                {hasAccount ? (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <input
                        type="email"
                        value={loginForm.email}
                        onChange={(e) => handleFormChange('login', 'email', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-gaming-primary focus:outline-none dark:bg-gray-800"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Password</label>
                      <input
                        type="password"
                        value={loginForm.password}
                        onChange={(e) => handleFormChange('login', 'password', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-gaming-primary focus:outline-none dark:bg-gray-800"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-gaming-primary to-gaming-secondary text-white py-3 rounded-lg font-medium hover:scale-105 transition-transform"
                    >
                      Login
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">First Name *</label>
                        <input
                          type="text"
                          value={userForm.first_name}
                          onChange={(e) => handleFormChange('user', 'first_name', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-gaming-primary focus:outline-none dark:bg-gray-800"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Last Name *</label>
                        <input
                          type="text"
                          value={userForm.last_name}
                          onChange={(e) => handleFormChange('user', 'last_name', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-gaming-primary focus:outline-none dark:bg-gray-800"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email *</label>
                      <input
                        type="email"
                        value={userForm.email}
                        onChange={(e) => handleFormChange('user', 'email', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-gaming-primary focus:outline-none dark:bg-gray-800"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Phone (Optional)</label>
                      <input
                        type="tel"
                        value={userForm.phone}
                        onChange={(e) => handleFormChange('user', 'phone', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-gaming-primary focus:outline-none dark:bg-gray-800"
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Password *</label>
                        <input
                          type="password"
                          value={userForm.password}
                          onChange={(e) => handleFormChange('user', 'password', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-gaming-primary focus:outline-none dark:bg-gray-800"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Confirm Password *</label>
                        <input
                          type="password"
                          value={userForm.confirmPassword}
                          onChange={(e) => handleFormChange('user', 'confirmPassword', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-gaming-primary focus:outline-none dark:bg-gray-800"
                          required
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isCreatingAccount}
                      className="w-full bg-gradient-to-r from-gaming-primary to-gaming-secondary text-white py-3 rounded-lg font-medium hover:scale-105 transition-transform disabled:opacity-50"
                    >
                      {isCreatingAccount ? 'Creating Account...' : 'Create Account'}
                    </button>
                  </form>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6"
              >
                <h2 className="text-2xl font-bold mb-4">Account Information</h2>
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">
                      Logged in as {currentUser.first_name} {currentUser.last_name}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">{currentUser.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentUser(null)
                      localStorage.removeItem('currentUser')
                    }}
                    className="text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
                  >
                    Logout
                  </button>
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6"
            >
              <h2 className="text-2xl font-bold mb-4">Order Details</h2>
              
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">{orderData.packageName} Package</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  ${orderData.packagePrice} per card
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Cards to be Graded ({orderData.totalCards})</h3>
                {orderData.cards.map((item) => (
                  <div
                    key={item.card.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-20 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden relative">
                        {item.card.imageUrl ? (
                          <Image
                            src={item.card.imageUrl}
                            alt={item.card.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              target.parentElement!.innerHTML = `<div class="absolute inset-0 flex items-center justify-center text-gray-400 text-xs p-1 text-center">${item.card.name}</div>`
                            }}
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs p-1 text-center">
                            {item.card.name}
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium">{item.card.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.card.game} • {item.selectedRarity || item.card.rarity}
                        </p>
                        <p className="text-sm text-gray-500">#{item.card.number}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">Qty: {item.quantity}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        ${orderData.packagePrice * item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Order Summary */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 sticky top-24"
            >
              <h2 className="text-2xl font-bold mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tax (8%)</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                  <span className="font-medium">
                    {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                {shipping === 0 && (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Free shipping on orders with 10+ cards!
                  </p>
                )}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-2xl font-bold text-gradient">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleProceedToPayment}
                disabled={!currentUser}
                className={`w-full py-3 rounded-lg font-medium transition-transform ${
                  currentUser 
                    ? 'bg-gradient-to-r from-gaming-primary to-gaming-secondary text-white hover:scale-105' 
                    : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                {currentUser ? 'Proceed to Payment' : 'Login Required'}
              </button>

              <button
                onClick={() => router.back()}
                className="w-full mt-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                ← Back to Card Selection
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}