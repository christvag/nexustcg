'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ShoppingCart,
  Check,
  ArrowLeft,
  Plus,
  Minus,
  Package as PackageIcon
} from 'lucide-react'

// id: packages-v2-detail-page-001

interface CurrencySettings {
  code: string
  symbol: string
  position: string
}

interface PackageFeature {
  id: number
  name: string
  description: string | null
  valueType: 'check' | 'dropdown' | 'text'
  isChecked: boolean
  textValue: string | null
  dropdownOptions: string[]
  dropdownSelected: string | null
  displayValue: string
}

interface PackageDetail {
  id: number
  name: string
  slug: string
  price: number
  priceSuffix: string
  ctaText: string
  ctaUrl: string | null
  description: string | null
  longDescription: string | null
  iconUrl: string | null
  imageUrl: string | null
  highlightColor: string
  isFeatured: boolean
  features: PackageFeature[]
}

interface CartItem {
  packageId: string
  packageName: string
  price: number
  quantity: number
}

export default function PackageV2DetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [packageData, setPackageData] = useState<PackageDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)
  const [currency, setCurrency] = useState<CurrencySettings>({ code: 'GBP', symbol: '£', position: 'before' })

  useEffect(() => {
    fetchCurrency()
    if (slug) {
      fetchPackageDetails()
    }
  }, [slug])

  const fetchCurrency = async () => {
    try {
      const response = await fetch('/api/settings/currency')
      const result = await response.json()
      if (result.success) {
        setCurrency(result.currency)
      }
    } catch (error) {
      console.error('Error fetching currency:', error)
    }
  }

  const formatPrice = (price: number) => {
    const formatted = price.toFixed(2)
    return currency.position === 'before'
      ? `${currency.symbol}${formatted}`
      : `${formatted}${currency.symbol}`
  }

  const fetchPackageDetails = async () => {
    try {
      const response = await fetch(`/api/packages-v2/${slug}`)
      const data = await response.json()
      if (data.success) {
        setPackageData(data.package)
      } else {
        router.push('/packages-v2')
      }
    } catch (error) {
      console.error('Error fetching package:', error)
      router.push('/packages-v2')
    } finally {
      setLoading(false)
    }
  }

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta
    if (newQuantity >= 1) {
      setQuantity(newQuantity)
    }
  }

  const handleAddToCart = () => {
    if (!packageData) return

    const existingCart = localStorage.getItem('cart')
    let cart: CartItem[] = existingCart ? JSON.parse(existingCart) : []

    const existingItemIndex = cart.findIndex(item => item.packageId === String(packageData.id))

    if (existingItemIndex > -1) {
      cart[existingItemIndex].quantity += quantity
    } else {
      cart.push({
        packageId: String(packageData.id),
        packageName: packageData.name,
        price: packageData.price,
        quantity: quantity
      })
    }

    localStorage.setItem('cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('cartUpdated'))

    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 3000)
  }

  const handleProceedToCheckout = () => {
    if (!packageData) return

    const existingCart = localStorage.getItem('cart')
    let cart: CartItem[] = existingCart ? JSON.parse(existingCart) : []

    const existingItemIndex = cart.findIndex(item => item.packageId === String(packageData.id))

    if (existingItemIndex === -1) {
      cart.push({
        packageId: String(packageData.id),
        packageName: packageData.name,
        price: packageData.price,
        quantity: quantity
      })
      localStorage.setItem('cart', JSON.stringify(cart))
      window.dispatchEvent(new Event('cartUpdated'))
    }

    const updatedCart = existingItemIndex === -1 ? cart : cart
    const subtotal = updatedCart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const tax = subtotal * 0.08
    const totalCards = updatedCart.reduce((sum, item) => sum + item.quantity, 0)

    const paymentData = {
      packageId: updatedCart.map(item => item.packageId).join(','),
      packageName: updatedCart.map(item => item.packageName).join(', '),
      packagePrice: updatedCart.length > 0 ? updatedCart[0].price : 0,
      cards: updatedCart.map(item => ({
        packageId: item.packageId,
        packageName: item.packageName,
        quantity: item.quantity,
        price: item.price
      })),
      totalCards: totalCards,
      subtotal: subtotal,
      tax: tax,
      shipping: 0,
      total: subtotal + tax
    }

    localStorage.setItem('paymentData', JSON.stringify(paymentData))
    router.push('/packages/payment')
  }

  if (loading) {
    return (
      <div id="package-v2-detail-loading" className="min-h-screen flex items-center justify-center bg-[#0b0b0b]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d83f0a] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading package details...</p>
        </div>
      </div>
    )
  }

  if (!packageData) {
    return (
      <div id="package-v2-not-found" className="min-h-screen flex items-center justify-center bg-[#0b0b0b]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Package Not Found</h2>
          <button
            onClick={() => router.push('/packages-v2')}
            className="px-6 py-3 bg-gradient-to-r from-[#d83f0a] to-[#d66a0a] text-white rounded-lg hover:opacity-90"
          >
            Back to Packages
          </button>
        </div>
      </div>
    )
  }

  const totalPrice = packageData.price * quantity
  const highlightColor = packageData.highlightColor || '#d83f0a'

  return (
    <div id="package-v2-detail-page" className="min-h-screen bg-[#0b0b0b] py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          id="back-to-packages-v2-btn"
          onClick={() => router.push('/packages-v2')}
          className="flex items-center space-x-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Packages</span>
        </button>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Column - Package Visual */}
          <div id="package-v2-visual-section">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#171717] border border-gray-800 rounded-2xl p-12 flex items-start justify-center"
              style={{ borderTopColor: highlightColor, borderTopWidth: packageData.isFeatured ? '4px' : '1px' }}
            >
              <div className="text-center w-full">
                {packageData.imageUrl ? (
                  <div className="mb-6">
                    <img
                      id="package-v2-image"
                      src={packageData.imageUrl}
                      alt={packageData.name}
                      className="w-full h-auto rounded-lg mx-auto"
                    />
                  </div>
                ) : packageData.iconUrl ? (
                  <div className="w-48 h-48 mx-auto mb-6 flex items-center justify-center">
                    <img
                      id="package-v2-icon"
                      src={packageData.iconUrl}
                      alt={`${packageData.name} icon`}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ) : (
                  <div
                    className="w-48 h-48 mx-auto mb-6 rounded-full flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${highlightColor}, ${highlightColor}99)` }}
                  >
                    <PackageIcon className="h-24 w-24 text-white" />
                  </div>
                )}
                <h3 id="package-v2-visual-name" className="text-2xl font-bold text-white">{packageData.name}</h3>
                {packageData.isFeatured && (
                  <span
                    id="package-v2-featured-badge"
                    className="inline-block mt-3 px-4 py-1 text-white text-sm font-bold rounded-full"
                    style={{ backgroundColor: highlightColor }}
                  >
                    MOST POPULAR
                  </span>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Package Details */}
          <div id="package-v2-info-section">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Package Header */}
              <div id="package-v2-header">
                <h1 className="text-4xl font-bold text-white mb-2">{packageData.name}</h1>
                {packageData.description && (
                  <p className="text-xl text-gray-400">{packageData.description}</p>
                )}
              </div>

              {/* Pricing */}
              <div id="package-v2-pricing" className="bg-[#171717] border border-gray-800 rounded-lg p-6">
                <div className="flex items-baseline space-x-2">
                  <span
                    className="text-5xl font-bold"
                    style={{ color: highlightColor }}
                  >
                    {formatPrice(packageData.price)}
                  </span>
                  <span className="text-gray-400 text-lg">{packageData.priceSuffix}</span>
                </div>
              </div>

              {/* Long Description */}
              {packageData.longDescription && (
                <div id="package-v2-long-description" className="bg-[#171717] border border-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-3">About This Package</h3>
                  <p className="text-gray-300 leading-relaxed">{packageData.longDescription}</p>
                </div>
              )}

              {/* Features */}
              {packageData.features && packageData.features.length > 0 && (
                <div id="package-v2-features" className="bg-[#171717] border border-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">What's Included</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {packageData.features.map((feature) => (
                      <div key={feature.id} id={`package-v2-feature-${feature.id}`} className="flex items-start space-x-3">
                        <div
                          className="mt-1 rounded-full p-1"
                          style={{ backgroundColor: `${highlightColor}33` }}
                        >
                          <Check className="h-4 w-4" style={{ color: highlightColor }} />
                        </div>
                        <div>
                          <span className="text-gray-300">{feature.name}</span>
                          {feature.valueType === 'text' && feature.textValue && (
                            <span className="text-gray-500 ml-2">({feature.textValue})</span>
                          )}
                          {feature.valueType === 'dropdown' && feature.dropdownSelected && (
                            <span className="text-gray-500 ml-2">({feature.dropdownSelected})</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Selector & Add to Cart */}
              <div id="package-v2-cart-section" className="bg-[#171717] border border-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Select Quantity</h3>

                {/* Quantity Controls */}
                <div className="flex items-center space-x-4 mb-6">
                  <button
                    id="package-v2-decrease-quantity-btn"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="p-3 bg-[#0b0b0b] border border-gray-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800"
                  >
                    <Minus className="h-5 w-5" />
                  </button>

                  <input
                    id="package-v2-quantity-input"
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1
                      setQuantity(Math.max(1, val))
                    }}
                    className="w-24 text-center text-2xl font-bold bg-[#0b0b0b] border border-gray-700 rounded-lg text-white py-2"
                  />

                  <button
                    id="package-v2-increase-quantity-btn"
                    onClick={() => handleQuantityChange(1)}
                    className="p-3 bg-[#0b0b0b] border border-gray-700 rounded-lg text-white hover:bg-gray-800"
                  >
                    <Plus className="h-5 w-5" />
                  </button>

                  <div className="flex-1 text-right">
                    <div className="text-sm text-gray-400">Total</div>
                    <div
                      className="text-2xl font-bold"
                      style={{ color: highlightColor }}
                    >
                      {formatPrice(totalPrice)}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    id="package-v2-add-to-cart-btn"
                    onClick={handleAddToCart}
                    className="w-full py-4 bg-[#0b0b0b] border-2 text-white font-semibold rounded-lg hover:bg-[#171717] transition-all flex items-center justify-center space-x-2"
                    style={{ borderColor: highlightColor }}
                  >
                    <ShoppingCart className="h-5 w-5" />
                    <span>{addedToCart ? 'Added to Cart!' : 'Add to Cart'}</span>
                  </button>

                  <button
                    id="package-v2-proceed-checkout-btn"
                    onClick={handleProceedToCheckout}
                    className="w-full py-4 text-white font-semibold rounded-lg hover:opacity-90 transition-all flex items-center justify-center space-x-2"
                    style={{ background: `linear-gradient(135deg, ${highlightColor}, ${highlightColor}cc)` }}
                  >
                    <span>{packageData.ctaText || 'Proceed to Checkout'}</span>
                  </button>
                </div>

                {addedToCart && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 bg-green-900/20 border border-green-700 rounded-lg text-green-400 text-center"
                  >
                    Successfully added to cart!
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
