'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  ArrowRight,
  Package as PackageIcon
} from 'lucide-react'

interface CartItem {
  packageId: string
  packageName: string
  price: number
  quantity: number
}

export default function CartPage() {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCart()
  }, [])

  const loadCart = () => {
    const existingCart = localStorage.getItem('cart')
    if (existingCart) {
      setCart(JSON.parse(existingCart))
    }
    setLoading(false)
  }

  const saveCart = (newCart: CartItem[]) => {
    localStorage.setItem('cart', JSON.stringify(newCart))
    setCart(newCart)
  }

  const updateQuantity = (packageId: string, delta: number) => {
    const newCart = cart.map(item => {
      if (item.packageId === packageId) {
        const newQuantity = Math.max(1, item.quantity + delta)
        return { ...item, quantity: newQuantity }
      }
      return item
    })
    saveCart(newCart)
  }

  const removeItem = (packageId: string) => {
    const newCart = cart.filter(item => item.packageId !== packageId)
    saveCart(newCart)
  }

  const clearCart = () => {
    if (confirm('Are you sure you want to clear your cart?')) {
      saveCart([])
    }
  }

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  const calculateTax = (subtotal: number) => {
    return subtotal * 0.08 // 8% tax
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const tax = calculateTax(subtotal)
    return subtotal + tax
  }

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Your cart is empty!')
      return
    }

    // Create paymentData for payment page
    const paymentData = {
      packageId: cart.map(item => item.packageId).join(','),
      packageName: cart.map(item => item.packageName).join(', '),
      packagePrice: cart.length > 0 ? cart[0].price : 0,
      cards: cart.map(item => ({
        packageId: item.packageId,
        packageName: item.packageName,
        quantity: item.quantity,
        price: item.price
      })),
      totalCards: cart.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: subtotal,
      tax: tax,
      shipping: 0,
      total: total
    }

    localStorage.setItem('paymentData', JSON.stringify(paymentData))

    router.push('/packages/payment')
  }

  if (loading) {
    return (
      <div id="cart-loading" className="min-h-screen flex items-center justify-center bg-[#0b0b0b]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d83f0a] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading cart...</p>
        </div>
      </div>
    )
  }

  const subtotal = calculateSubtotal()
  const tax = calculateTax(subtotal)
  const total = calculateTotal()

  return (
    <div id="cart-page" className="min-h-screen bg-[#0b0b0b] py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div id="cart-header" className="mb-8">
          <button
            onClick={() => router.push('/packages')}
            className="flex items-center space-x-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Continue Shopping</span>
          </button>

          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-white">Shopping Cart</h1>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-red-500 hover:text-red-400 text-sm flex items-center space-x-1"
              >
                <Trash2 className="h-4 w-4" />
                <span>Clear Cart</span>
              </button>
            )}
          </div>
        </div>

        {cart.length === 0 ? (
          /* Empty Cart */
          <motion.div
            id="empty-cart-message"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 bg-[#171717] border border-gray-800 rounded-lg"
          >
            <ShoppingCart className="h-24 w-24 text-gray-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2">Your cart is empty</h2>
            <p className="text-gray-400 mb-6">Add some packages to get started!</p>
            <button
              onClick={() => router.push('/packages')}
              className="px-6 py-3 bg-gradient-to-r from-[#d83f0a] to-[#d66a0a] text-white rounded-lg hover:opacity-90"
            >
              Browse Packages
            </button>
          </motion.div>
        ) : (
          /* Cart with Items */
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div id="cart-items-section" className="lg:col-span-2 space-y-4">
              {cart.map((item, index) => (
                <motion.div
                  key={item.packageId}
                  id={`cart-item-${item.packageId}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-[#171717] border border-gray-800 rounded-lg p-6"
                >
                  <div className="flex items-center space-x-6">
                    {/* Package Icon */}
                    <div className="w-20 h-20 bg-gradient-to-br from-[#d83f0a] to-[#d66a0a] rounded-lg flex items-center justify-center flex-shrink-0">
                      <PackageIcon className="h-10 w-10 text-white" />
                    </div>

                    {/* Package Info */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">{item.packageName}</h3>
                      <p className="text-gray-400 text-sm mb-3">${item.price.toFixed(2)} per card</p>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => updateQuantity(item.packageId, -1)}
                          disabled={item.quantity <= 1}
                          className="p-2 bg-[#0b0b0b] border border-gray-700 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800"
                        >
                          <Minus className="h-4 w-4" />
                        </button>

                        <span className="text-white font-semibold w-12 text-center">
                          {item.quantity}
                        </span>

                        <button
                          onClick={() => updateQuantity(item.packageId, 1)}
                          className="p-2 bg-[#0b0b0b] border border-gray-700 rounded text-white hover:bg-gray-800"
                        >
                          <Plus className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => removeItem(item.packageId)}
                          className="ml-auto p-2 text-red-500 hover:text-red-400"
                          title="Remove from cart"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {/* Item Total */}
                    <div className="text-right">
                      <div className="text-sm text-gray-400 mb-1">Subtotal</div>
                      <div className="text-2xl font-bold bg-gradient-to-r from-[#d83f0a] to-[#d66a0a] bg-clip-text text-transparent">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Order Summary */}
            <div id="order-summary-section" className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#171717] border border-gray-800 rounded-lg p-6 sticky top-24"
              >
                <h2 className="text-2xl font-bold text-white mb-6">Order Summary</h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-300">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-gray-300">
                    <span>Tax (8%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-gray-300">
                    <span>Shipping</span>
                    <span className="text-green-500">FREE</span>
                  </div>

                  <div className="border-t border-gray-800 pt-4">
                    <div className="flex justify-between items-baseline">
                      <span className="text-lg text-white font-semibold">Total</span>
                      <span className="text-3xl font-bold bg-gradient-to-r from-[#d83f0a] to-[#d66a0a] bg-clip-text text-transparent">
                        ${total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  id="proceed-checkout-btn"
                  onClick={handleCheckout}
                  className="w-full py-4 bg-gradient-to-r from-[#d83f0a] to-[#d66a0a] text-white font-semibold rounded-lg hover:opacity-90 transition-all flex items-center justify-center space-x-2"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="h-5 w-5" />
                </button>

                <p className="text-sm text-gray-500 mt-4 text-center">
                  Free return shipping and insurance included
                </p>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
