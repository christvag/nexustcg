'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

interface Package {
  id: string
  name: string
  slug: string
  price: number
  description: string
  features: string[]
  processing_time: string
  min_cards?: number
  is_popular?: boolean
  icon_name?: string
  icon_url?: string
  image_url?: string
}

export default function PackagesPage() {
  const router = useRouter()
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPackages()
  }, [])

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/packages')
      const data = await response.json()
      if (data.success) {
        setPackages(data.packages)
      }
    } catch (error) {
      console.error('Error fetching packages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPackage = (packageSlug: string) => {
    setSelectedPackage(packageSlug)
    setTimeout(() => {
      router.push(`/packages/${packageSlug}`)
    }, 300)
  }

  if (loading) {
    return (
      <div id="packages-loading" className="min-h-screen flex items-center justify-center bg-[#0b0b0b]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d83f0a] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading packages...</p>
        </div>
      </div>
    )
  }

  return (
    <div id="packages-page" className="min-h-screen py-20 px-4 bg-[#0b0b0b]">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-[#d83f0a] to-[#d66a0a] bg-clip-text text-transparent">
              Choose Your Package
            </span>
          </h1>
          <p className="text-xl text-gray-300">
            Select the service that best fits your needs
          </p>
        </motion.div>

        <div id="packages-grid" className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          {packages.map((pkg, index) => (
            <motion.div
              key={pkg.id}
              id={`package-card-${pkg.slug}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative bg-[#171717] rounded-2xl shadow-xl overflow-hidden border ${
                selectedPackage === pkg.slug ? 'ring-4 ring-[#d83f0a]' : ''
              } ${pkg.is_popular ? 'border-[#d83f0a]' : 'border-gray-800'}`}
            >
              {!!pkg.is_popular && (
                <div id={`popular-badge-${pkg.slug}`} className="absolute top-0 right-0 bg-gradient-to-r from-[#d83f0a] to-[#d66a0a] text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  POPULAR
                </div>
              )}

              <div className="p-6">
                {/* Icon Display */}
                {pkg.icon_url && (
                  <div id={`package-icon-${pkg.slug}`} className="mb-4 flex justify-center">
                    <img
                      src={pkg.icon_url}
                      alt={`${pkg.name} icon`}
                      className="h-16 w-16 object-contain"
                    />
                  </div>
                )}

                <h3 id={`package-title-${pkg.slug}`} className="text-2xl font-bold mb-2 text-white text-center">
                  {pkg.name}
                </h3>
                <p id={`package-description-${pkg.slug}`} className="text-gray-400 mb-4 text-center">
                  {pkg.description}
                </p>

                <div id={`package-price-${pkg.slug}`} className="mb-6 text-center">
                  <span className="text-5xl font-bold bg-gradient-to-r from-[#d83f0a] to-[#d66a0a] bg-clip-text text-transparent">
                    ${pkg.price}
                  </span>
                  <span className="text-gray-400 text-lg ml-2">/card</span>
                </div>

                <div className="space-y-3 mb-6">
                  {pkg.features.map((feature, i) => (
                    <div key={i} className="flex items-start">
                      <svg
                        className="h-5 w-5 text-[#d83f0a] mt-0.5 mr-2 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-sm text-gray-300">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="text-sm text-gray-400 mb-6">
                  <div className="flex items-center">
                    <svg
                      className="h-4 w-4 mr-2 text-[#d83f0a]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {pkg.processing_time}
                  </div>
                  {pkg.min_cards != null && pkg.min_cards >= 1 && (
                    <div id={`min-cards-indicator-${pkg.slug}`} className="flex items-center mt-2">
                      <svg
                        className="h-4 w-4 mr-2 text-[#d83f0a]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        />
                      </svg>
                      Min. {pkg.min_cards} {pkg.min_cards === 1 ? 'card' : 'cards'}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleSelectPackage(pkg.slug)}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                    pkg.is_popular
                      ? 'bg-gradient-to-r from-[#d83f0a] to-[#d66a0a] text-white hover:opacity-90 hover:scale-105'
                      : 'bg-[#0b0b0b] border border-gray-700 text-white hover:bg-gray-800'
                  }`}
                >
                  Select Package
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {packages.length === 0 && !loading && (
          <div id="no-packages-message" className="text-center py-12 bg-[#171717] border border-gray-800 rounded-lg">
            <p className="text-gray-400">No packages available at the moment.</p>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-gray-400">
            All packages include free return shipping and insurance
          </p>
        </motion.div>
      </div>
    </div>
  )
}