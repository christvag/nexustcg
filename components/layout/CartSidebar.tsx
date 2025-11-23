'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShoppingCart, Plus, Minus, Trash2, Package as PackageIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface CartItem {
  packageId: string
  packageName: string
  price: number
  quantity: number
}

interface CartSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  useEffect(() => {
    if (isOpen) {
      loadCart()
    }
  }, [isOpen])

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = () => {
      loadCart()
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const loadCart = () => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      setCartItems(JSON.parse(savedCart))
    } else {
      setCartItems([])
    }
  }

  const updateCart = (newCart: CartItem[]) => {
    setCartItems(newCart)
    localStorage.setItem('cart', JSON.stringify(newCart))
    // Dispatch event to update cart badge
    window.dispatchEvent(new Event('cartUpdated'))
  }

  const handleQuantityChange = (packageId: string, delta: number) => {
    const newCart = cartItems.map(item => {
      if (item.packageId === packageId) {
        const newQuantity = Math.max(1, item.quantity + delta)
        return { ...item, quantity: newQuantity }
      }
      return item
    })
    updateCart(newCart)
  }

  const handleRemoveItem = (packageId: string) => {
    const newCart = cartItems.filter(item => item.packageId !== packageId)
    updateCart(newCart)
  }

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const tax = subtotal * 0.08
  const total = subtotal + tax

  const handleProceedToCheckout = () => {
    if (cartItems.length === 0) return

    // Create paymentData for payment page
    const paymentData = {
      packageId: cartItems.map(item => item.packageId).join(','),
      packageName: cartItems.map(item => item.packageName).join(', '),
      packagePrice: cartItems.length > 0 ? cartItems[0].price : 0,
      cards: cartItems.map(item => ({
        packageId: item.packageId,
        packageName: item.packageName,
        quantity: item.quantity,
        price: item.price
      })),
      totalCards: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: subtotal,
      tax: tax,
      shipping: 0,
      total: total
    }

    localStorage.setItem('paymentData', JSON.stringify(paymentData))

    onClose()
    router.push('/packages/payment')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            id="cart-sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Sidebar */}
          <motion.div
            id="cart-sidebar"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0b0b0b] border-l border-gray-800 z-50 flex flex-col"
          >
            {/* Header */}
            <div id="cart-sidebar-header" className="flex items-center justify-between p-6 border-b border-gray-800">
              <div className="flex items-center space-x-3">
                <ShoppingCart className="h-6 w-6 text-[#d83f0a]" />
                <h2 className="text-xl font-bold text-white">Your Cart</h2>
                <span className="bg-[#d83f0a] text-white text-xs font-bold px-2 py-1 rounded-full">
                  {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
              <button
                id="cart-sidebar-close-btn"
                onClick={onClose}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="h-6 w-6 text-gray-400" />
              </button>
            </div>

            {/* Cart Items */}
            <div id="cart-sidebar-items" className="flex-1 overflow-y-auto p-6">
              {cartItems.length === 0 ? (
                <div id="cart-sidebar-empty" className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingCart className="h-16 w-16 text-gray-600 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Your cart is empty</h3>
                  <p className="text-gray-400 mb-6">Add some grading packages to get started!</p>
                  <Link
                    href="/packages"
                    onClick={onClose}
                    className="px-6 py-3 bg-gradient-to-r from-[#d83f0a] to-[#d66a0a] text-white rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Browse Packages
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div
                      key={item.packageId}
                      id={`cart-sidebar-item-${item.packageId}`}
                      className="bg-[#171717] border border-gray-800 rounded-lg p-4"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#d83f0a] to-[#d66a0a] rounded-lg flex items-center justify-center flex-shrink-0">
                          <PackageIcon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-semibold truncate">{item.packageName}</h4>
                          <p className="text-sm text-gray-400">${item.price.toFixed(2)} / card</p>
                        </div>
                        <button
                          id={`cart-remove-item-${item.packageId}`}
                          onClick={() => handleRemoveItem(item.packageId)}
                          className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center space-x-2">
                          <button
                            id={`cart-decrease-${item.packageId}`}
                            onClick={() => handleQuantityChange(item.packageId, -1)}
                            className="p-1 bg-[#0b0b0b] border border-gray-700 rounded text-white hover:bg-gray-800"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="text-white font-medium w-8 text-center">{item.quantity}</span>
                          <button
                            id={`cart-increase-${item.packageId}`}
                            onClick={() => handleQuantityChange(item.packageId, 1)}
                            className="p-1 bg-[#0b0b0b] border border-gray-700 rounded text-white hover:bg-gray-800"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <span className="text-[#d83f0a] font-bold">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with Summary */}
            {cartItems.length > 0 && (
              <div id="cart-sidebar-footer" className="border-t border-gray-800 p-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-400">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Tax (8%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-gray-800">
                    <span>Total</span>
                    <span className="text-[#d83f0a]">${total.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  id="cart-sidebar-checkout-btn"
                  onClick={handleProceedToCheckout}
                  className="w-full py-4 bg-gradient-to-r from-[#d83f0a] to-[#d66a0a] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
                >
                  Proceed to Checkout
                </button>

                <Link
                  href="/cart"
                  onClick={onClose}
                  className="block text-center text-gray-400 hover:text-white transition-colors"
                >
                  View Full Cart
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
