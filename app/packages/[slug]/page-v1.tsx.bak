'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ShoppingCart,
  Check,
  Clock,
  Shield,
  ArrowLeft,
  Plus,
  Minus,
  Package as PackageIcon,
  Star,
  Zap
} from 'lucide-react'

interface PackageDetail {
  id: string
  name: string
  slug: string
  price: number
  description: string
  long_description: string
  features: string[]
  specifications: Array<{ spec_key: string; spec_value: string }>
  trust_indicators?: Array<{ label: string; icon: string }>
  processing_time: string
  min_cards?: number
  max_cards?: number
  is_popular?: boolean
  icon_name?: string
  image_url?: string
}

interface CartItem {
  packageId: string
  packageName: string
  price: number
  quantity: number
}

export default function PackageDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [packageData, setPackageData] = useState<PackageDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)

  useEffect(() => {
    if (slug) {
      fetchPackageDetails()
    }
  }, [slug])

  const fetchPackageDetails = async () => {
    try {
      const response = await fetch(`/api/packages/${slug}`)
      const data = await response.json()
      if (data.success) {
        setPackageData(data.package)
        if (data.package.min_cards) {
          setQuantity(data.package.min_cards)
        }
      } else {
        // Package not found, redirect to packages page
        router.push('/packages')
      }
    } catch (error) {
      console.error('Error fetching package:', error)
      router.push('/packages')
    } finally {
      setLoading(false)
    }
  }

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta
    const minCards = packageData?.min_cards || 1

    if (newQuantity >= minCards) {
      setQuantity(newQuantity)
    }
  }

  const handleAddToCart = () => {
    if (!packageData) return

    // Get existing cart from localStorage
    const existingCart = localStorage.getItem('cart')
    let cart: CartItem[] = existingCart ? JSON.parse(existingCart) : []

    // Check if package already in cart
    const existingItemIndex = cart.findIndex(item => item.packageId === packageData.id)

    if (existingItemIndex > -1) {
      // Update quantity
      cart[existingItemIndex].quantity += quantity
    } else {
      // Add new item
      cart.push({
        packageId: packageData.id,
        packageName: packageData.name,
        price: packageData.price,
        quantity: quantity
      })
    }

    // Save to localStorage
    localStorage.setItem('cart', JSON.stringify(cart))

    // Dispatch event to update cart badge in header
    window.dispatchEvent(new Event('cartUpdated'))

    // Show success message
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 3000)
  }

  const handleProceedToCheckout = () => {
    if (!packageData) return

    // Get existing cart from localStorage
    const existingCart = localStorage.getItem('cart')
    let cart: CartItem[] = existingCart ? JSON.parse(existingCart) : []

    // Check if package already in cart
    const existingItemIndex = cart.findIndex(item => item.packageId === packageData.id)

    if (existingItemIndex === -1) {
      // Only add if not already in cart
      cart.push({
        packageId: packageData.id,
        packageName: packageData.name,
        price: packageData.price,
        quantity: quantity
      })
      localStorage.setItem('cart', JSON.stringify(cart))
      // Dispatch event to update cart badge
      window.dispatchEvent(new Event('cartUpdated'))
    }

    // Calculate totals from cart
    const updatedCart = existingItemIndex === -1 ? cart : cart
    const subtotal = updatedCart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const tax = subtotal * 0.08
    const totalCards = updatedCart.reduce((sum, item) => sum + item.quantity, 0)

    // Create paymentData for payment page
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

    // Navigate to payment page
    router.push('/packages/payment')
  }

  if (loading) {
    return (
      <div id="package-detail-loading" className="min-h-screen flex items-center justify-center bg-[#0b0b0b]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d83f0a] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading package details...</p>
        </div>
      </div>
    )
  }

  if (!packageData) {
    return (
      <div id="package-not-found" className="min-h-screen flex items-center justify-center bg-[#0b0b0b]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Package Not Found</h2>
          <button
            onClick={() => router.push('/packages')}
            className="px-6 py-3 bg-gradient-to-r from-[#d83f0a] to-[#d66a0a] text-white rounded-lg hover:opacity-90"
          >
            Back to Packages
          </button>
        </div>
      </div>
    )
  }

  const totalPrice = packageData.price * quantity

  return (
    <div id="package-detail-page" className="min-h-screen bg-[#0b0b0b] py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          id="back-to-packages-btn"
          onClick={() => router.push('/packages')}
          className="flex items-center space-x-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Packages</span>
        </button>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Column - Package Image/Icon */}
          <div id="package-visual-section">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#171717] border border-gray-800 rounded-2xl p-12 flex items-start justify-center"
            >
              {packageData.image_url ? (
                <img
                  src={packageData.image_url}
                  alt={packageData.name}
                  className="max-w-full h-auto rounded-lg"
                />
              ) : packageData.icon_url ? (
                <div className="text-center">
                  <div className="w-48 h-48 mx-auto mb-6 flex items-center justify-center">
                    <img
                      src={packageData.icon_url}
                      alt={`${packageData.name} icon`}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <h3 className="text-2xl font-bold text-white">{packageData.name}</h3>
                  {!!packageData.is_popular && (
                    <span className="inline-block mt-3 px-4 py-1 bg-gradient-to-r from-[#d83f0a] to-[#d66a0a] text-white text-sm font-bold rounded-full">
                      MOST POPULAR
                    </span>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-48 h-48 mx-auto mb-6 bg-gradient-to-br from-[#d83f0a] to-[#d66a0a] rounded-full flex items-center justify-center">
                    <PackageIcon className="h-24 w-24 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">{packageData.name}</h3>
                  {!!packageData.is_popular && (
                    <span className="inline-block mt-3 px-4 py-1 bg-gradient-to-r from-[#d83f0a] to-[#d66a0a] text-white text-sm font-bold rounded-full">
                      MOST POPULAR
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column - Package Details */}
          <div id="package-info-section">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Package Header */}
              <div id="package-header">
                <h1 className="text-4xl font-bold text-white mb-2">{packageData.name}</h1>
                <p className="text-xl text-gray-400">{packageData.description}</p>
              </div>

              {/* Pricing */}
              <div id="package-pricing" className="bg-[#171717] border border-gray-800 rounded-lg p-6">
                <div className="flex items-baseline space-x-2">
                  <span className="text-5xl font-bold bg-gradient-to-r from-[#d83f0a] to-[#d66a0a] bg-clip-text text-transparent">
                    ${packageData.price}
                  </span>
                  <span className="text-gray-400 text-lg">/card</span>
                </div>
                <p className="text-gray-500 mt-2">
                  <Clock className="inline h-4 w-4 mr-1" />
                  {packageData.processing_time}
                </p>
              </div>

              {/* Long Description */}
              {packageData.long_description && (
                <div id="package-description" className="bg-[#171717] border border-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-3">About This Package</h3>
                  <p className="text-gray-300 leading-relaxed">{packageData.long_description}</p>
                </div>
              )}

              {/* Features */}
              <div id="package-features" className="bg-[#171717] border border-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">What's Included</h3>
                <div className="grid grid-cols-1 gap-3">
                  {packageData.features.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="mt-1 bg-[#d83f0a]/20 rounded-full p-1">
                        <Check className="h-4 w-4 text-[#d83f0a]" />
                      </div>
                      <span className="text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Specifications */}
              {packageData.specifications && packageData.specifications.length > 0 && (
                <div id="package-specs" className="bg-[#171717] border border-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Specifications</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {packageData.specifications.map((spec, index) => (
                      <div key={index} className="border-b border-gray-800 pb-2">
                        <dt className="text-sm text-gray-400">{spec.spec_key}</dt>
                        <dd className="text-white font-medium">{spec.spec_value}</dd>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Selector & Add to Cart */}
              <div id="package-cart-section" className="bg-[#171717] border border-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Select Quantity</h3>

                {packageData.min_cards != null && packageData.min_cards > 1 && (
                  <p id={`min-cards-requirement-${packageData.slug}`} className="text-sm text-gray-400 mb-3">
                    Minimum {packageData.min_cards} cards required
                  </p>
                )}

                {/* Quantity Controls */}
                <div className="flex items-center space-x-4 mb-6">
                  <button
                    id="decrease-quantity-btn"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= (packageData.min_cards || 1)}
                    className="p-3 bg-[#0b0b0b] border border-gray-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800"
                  >
                    <Minus className="h-5 w-5" />
                  </button>

                  <input
                    id="quantity-input"
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1
                      const minCards = packageData.min_cards || 1
                      setQuantity(Math.max(minCards, val))
                    }}
                    className="w-24 text-center text-2xl font-bold bg-[#0b0b0b] border border-gray-700 rounded-lg text-white py-2"
                  />

                  <button
                    id="increase-quantity-btn"
                    onClick={() => handleQuantityChange(1)}
                    className="p-3 bg-[#0b0b0b] border border-gray-700 rounded-lg text-white hover:bg-gray-800"
                  >
                    <Plus className="h-5 w-5" />
                  </button>

                  <div className="flex-1 text-right">
                    <div className="text-sm text-gray-400">Total</div>
                    <div className="text-2xl font-bold bg-gradient-to-r from-[#d83f0a] to-[#d66a0a] bg-clip-text text-transparent">
                      ${totalPrice.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    id="add-to-cart-btn"
                    onClick={handleAddToCart}
                    className="w-full py-4 bg-[#0b0b0b] border-2 border-[#d83f0a] text-white font-semibold rounded-lg hover:bg-[#171717] transition-all flex items-center justify-center space-x-2"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    <span>{addedToCart ? 'Added to Cart!' : 'Add to Cart'}</span>
                  </button>

                  <button
                    id="proceed-checkout-btn"
                    onClick={handleProceedToCheckout}
                    className="w-full py-4 bg-gradient-to-r from-[#d83f0a] to-[#d66a0a] text-white font-semibold rounded-lg hover:opacity-90 transition-all flex items-center justify-center space-x-2"
                  >
                    <span>Proceed to Checkout</span>
                  </button>
                </div>

                {addedToCart && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 bg-green-900/20 border border-green-700 rounded-lg text-green-400 text-center"
                  >
                    ✓ Successfully added to cart!
                  </motion.div>
                )}
              </div>

              {/* Trust Indicators */}
              {packageData.trust_indicators && packageData.trust_indicators.length > 0 && (
                <div id="trust-indicators" className="grid grid-cols-3 gap-4">
                  {packageData.trust_indicators.map((indicator, index) => {
                    const iconMap: { [key: string]: any } = {
                      shield: Shield,
                      package: PackageIcon,
                      check: Check,
                      star: Star,
                      clock: Clock,
                      zap: Zap
                    };
                    const IconComponent = iconMap[indicator.icon] || Check;

                    return (
                      <div key={index} className="text-center p-4 bg-[#171717] border border-gray-800 rounded-lg">
                        <IconComponent className="h-6 w-6 text-[#d83f0a] mx-auto mb-2" />
                        <p className="text-xs text-gray-400">{indicator.label}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
