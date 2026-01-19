'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Check, X, ChevronDown } from 'lucide-react'

// id: packages-v2-public-page-001

interface Package {
  id: number
  name: string
  slug: string
  price: number
  priceSuffix: string
  ctaText: string
  ctaUrl: string
  description: string
  iconUrl: string | null
  imageUrl: string | null
  highlightColor: string
  isFeatured: boolean
}

interface CurrencySettings {
  code: string
  symbol: string
  position: string
}

interface FeatureValue {
  valueType: 'check' | 'dropdown' | 'text'
  isChecked: boolean
  textValue: string | null
  dropdownOptions: string[]
  dropdownSelected: string | null
}

interface Feature {
  id: number
  name: string
  description: string
  category: string
  values: Record<string, FeatureValue>
}

interface PricingData {
  packages: Package[]
  features: Feature[]
  settings: Record<string, string>
}

export default function PackagesV2Page() {
  const router = useRouter()
  const [data, setData] = useState<PricingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDropdowns, setSelectedDropdowns] = useState<Record<string, string>>({})
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [currency, setCurrency] = useState<CurrencySettings>({ code: 'GBP', symbol: '£', position: 'before' })

  useEffect(() => {
    fetchPricingData()
    fetchCurrency()
  }, [])

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

  const fetchPricingData = async () => {
    try {
      const response = await fetch('/api/packages-v2')
      const result = await response.json()
      if (result.success) {
        setData(result.data)
        // Initialize dropdown selections
        const initialSelections: Record<string, string> = {}
        result.data.features.forEach((feature: Feature) => {
          Object.entries(feature.values).forEach(([pkgSlug, value]) => {
            if (value.valueType === 'dropdown' && value.dropdownSelected) {
              initialSelections[`${feature.id}-${pkgSlug}`] = value.dropdownSelected
            }
          })
        })
        setSelectedDropdowns(initialSelections)
      }
    } catch (error) {
      console.error('Error fetching pricing data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPackage = (pkg: Package) => {
    router.push(pkg.ctaUrl || `/packages-v2/${pkg.slug}`)
  }

  const handleDropdownSelect = (featureId: number, pkgSlug: string, value: string) => {
    setSelectedDropdowns(prev => ({
      ...prev,
      [`${featureId}-${pkgSlug}`]: value
    }))
    setOpenDropdown(null)
  }

  const renderFeatureValue = (feature: Feature, pkg: Package) => {
    const value = feature.values[pkg.slug]
    if (!value) {
      return <X id={`feature-value-empty-${feature.id}-${pkg.slug}`} className="h-5 w-5 text-gray-600 mx-auto" />
    }

    const key = `${feature.id}-${pkg.slug}`

    switch (value.valueType) {
      case 'check':
        return value.isChecked ? (
          <Check id={`feature-value-check-${key}`} className="h-6 w-6 text-[#d83f0a] mx-auto" />
        ) : (
          <X id={`feature-value-x-${key}`} className="h-5 w-5 text-gray-600 mx-auto" />
        )

      case 'text':
        return (
          <span id={`feature-value-text-${key}`} className="text-sm text-gray-300 text-center block">
            {value.textValue || '-'}
          </span>
        )

      case 'dropdown':
        const options = value.dropdownOptions || []
        const selected = selectedDropdowns[key] || value.dropdownSelected || options[0] || ''

        return (
          <div id={`feature-value-dropdown-${key}`} className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === key ? null : key)}
              className="flex items-center justify-center gap-1 text-sm text-gray-300 hover:text-white transition-colors mx-auto"
            >
              <span>{selected}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${openDropdown === key ? 'rotate-180' : ''}`} />
            </button>
            {openDropdown === key && options.length > 0 && (
              <div
                id={`dropdown-menu-${key}`}
                className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-xl z-20 min-w-[120px]"
              >
                {options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleDropdownSelect(feature.id, pkg.slug, option)}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-[#252525] transition-colors ${
                      selected === option ? 'text-[#d83f0a]' : 'text-gray-300'
                    } ${idx === 0 ? 'rounded-t-lg' : ''} ${idx === options.length - 1 ? 'rounded-b-lg' : ''}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        )

      default:
        return <X className="h-5 w-5 text-gray-600 mx-auto" />
    }
  }

  if (loading) {
    return (
      <div id="packages-v2-loading" className="min-h-screen flex items-center justify-center bg-[#0b0b0b]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d83f0a] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading pricing...</p>
        </div>
      </div>
    )
  }

  if (!data || data.packages.length === 0) {
    return (
      <div id="packages-v2-empty" className="min-h-screen flex items-center justify-center bg-[#0b0b0b]">
        <div className="text-center">
          <p className="text-gray-400">No pricing packages available at the moment.</p>
        </div>
      </div>
    )
  }

  return (
    <div id="packages-v2-page" className="min-h-screen py-20 px-4 bg-[#0b0b0b]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          id="packages-v2-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-[#d83f0a] to-[#d66a0a] bg-clip-text text-transparent">
              {data.settings?.title || 'Our Pricing Plans'}
            </span>
          </h1>
          <p className="text-xl text-gray-300">
            {data.settings?.subtitle || 'Select the service that best fits your needs'}
          </p>
        </motion.div>

        {/* Pricing Table */}
        <motion.div
          id="packages-v2-table-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="overflow-x-auto"
        >
          <table id="packages-v2-table" className="w-full border-collapse">
            {/* Package Headers */}
            <thead>
              <tr>
                <th id="table-header-features" className="text-right p-4 bg-[#171717] border-b border-gray-800 min-w-[200px] align-middle">
                  <span className="text-lg font-semibold text-gray-400">Features</span>
                </th>
                {data.packages.map((pkg, index) => (
                  <th
                    key={pkg.id}
                    id={`table-header-${pkg.slug}`}
                    className={`p-6 text-center min-w-[200px] align-top ${
                      pkg.isFeatured
                        ? 'bg-gradient-to-b from-[#1a1a1a] to-[#171717] border-t-4'
                        : 'bg-[#171717]'
                    } border-b border-gray-800`}
                    style={pkg.isFeatured ? { borderTopColor: pkg.highlightColor || '#d83f0a' } : {}}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex flex-col h-full"
                    >
                      {pkg.isFeatured && (
                        <span
                          id={`featured-badge-${pkg.slug}`}
                          className="inline-block px-3 py-1 text-xs font-bold text-white rounded-full mb-2 self-center"
                          style={{ backgroundColor: pkg.highlightColor || '#d83f0a' }}
                        >
                          POPULAR
                        </span>
                      )}
                      {!pkg.isFeatured && (
                        <div className="h-[26px] mb-2"></div>
                      )}
                      {pkg.iconUrl && (
                        <div id={`package-icon-${pkg.slug}`} className="mb-3 flex justify-center">
                          <img
                            src={pkg.iconUrl}
                            alt={`${pkg.name} icon`}
                            className="h-12 w-12 object-contain"
                          />
                        </div>
                      )}
                      <h3 id={`package-name-${pkg.slug}`} className="text-xl font-bold text-white mb-2">
                        {pkg.name}
                      </h3>
                      <div id={`package-price-${pkg.slug}`} className="mb-2">
                        <span
                          className="text-4xl font-bold"
                          style={{ color: pkg.highlightColor || '#d83f0a' }}
                        >
                          {formatPrice(pkg.price)}
                        </span>
                        <span className="text-gray-400 text-sm ml-1">{pkg.priceSuffix}</span>
                      </div>
                      <p id={`package-desc-${pkg.slug}`} className="text-sm text-gray-500 mb-4 min-h-[40px]">
                        {pkg.description || '\u00A0'}
                      </p>
                      <button
                        id={`header-cta-${pkg.slug}`}
                        onClick={() => handleSelectPackage(pkg)}
                        className={`w-full py-2.5 px-4 rounded-lg font-medium transition-all hover:scale-105 text-sm ${
                          pkg.isFeatured
                            ? 'text-white shadow-lg hover:opacity-90'
                            : 'bg-[#0b0b0b] border border-gray-700 text-white hover:bg-gray-800'
                        }`}
                        style={pkg.isFeatured ? {
                          background: `linear-gradient(135deg, ${pkg.highlightColor || '#d83f0a'}, ${pkg.highlightColor ? pkg.highlightColor + 'cc' : '#d66a0a'})`
                        } : {}}
                      >
                        {pkg.ctaText || 'Get Started'}
                      </button>
                    </motion.div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Feature Rows */}
            <tbody>
              {data.features.map((feature, index) => (
                <motion.tr
                  key={feature.id}
                  id={`feature-row-${feature.id}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className="border-b border-gray-800 hover:bg-[#1a1a1a] transition-colors"
                >
                  <td id={`feature-name-${feature.id}`} className="p-4 bg-[#171717] text-right">
                    <div className="font-medium text-white">{feature.name}</div>
                    {feature.description && (
                      <>
                        <div className="w-16 h-px bg-gray-700 ml-auto my-2"></div>
                        <div className="text-sm text-gray-500">{feature.description}</div>
                      </>
                    )}
                  </td>
                  {data.packages.map(pkg => (
                    <td
                      key={pkg.id}
                      id={`feature-cell-${feature.id}-${pkg.slug}`}
                      className={`p-4 text-center ${pkg.isFeatured ? 'bg-[#1a1a1a]/50' : ''}`}
                    >
                      {renderFeatureValue(feature, pkg)}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </tbody>

            {/* CTA Row */}
            <tfoot>
              <tr>
                <td className="p-4 bg-[#171717]"></td>
                {data.packages.map(pkg => (
                  <td
                    key={pkg.id}
                    id={`cta-cell-${pkg.slug}`}
                    className={`p-6 text-center ${pkg.isFeatured ? 'bg-[#1a1a1a]/50' : ''}`}
                  >
                    <button
                      id={`cta-button-${pkg.slug}`}
                      onClick={() => handleSelectPackage(pkg)}
                      className={`w-full py-3 px-6 rounded-lg font-medium transition-all hover:scale-105 ${
                        pkg.isFeatured
                          ? 'text-white shadow-lg hover:opacity-90'
                          : 'bg-[#0b0b0b] border border-gray-700 text-white hover:bg-gray-800'
                      }`}
                      style={pkg.isFeatured ? {
                        background: `linear-gradient(135deg, ${pkg.highlightColor || '#d83f0a'}, ${pkg.highlightColor ? pkg.highlightColor + 'cc' : '#d66a0a'})`
                      } : {}}
                    >
                      {pkg.ctaText || 'Get Started'}
                    </button>
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </motion.div>

        {/* Mobile Cards View (for small screens) */}
        <div id="packages-v2-mobile" className="md:hidden mt-8 space-y-6">
          {data.packages.map((pkg, index) => (
            <motion.div
              key={pkg.id}
              id={`mobile-card-${pkg.slug}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative bg-[#171717] rounded-2xl shadow-xl overflow-hidden border ${
                pkg.isFeatured ? 'border-2' : 'border-gray-800'
              }`}
              style={pkg.isFeatured ? { borderColor: pkg.highlightColor || '#d83f0a' } : {}}
            >
              {pkg.isFeatured && (
                <div
                  id={`mobile-featured-badge-${pkg.slug}`}
                  className="absolute top-0 right-0 text-white text-xs font-bold px-3 py-1 rounded-bl-lg"
                  style={{ backgroundColor: pkg.highlightColor || '#d83f0a' }}
                >
                  POPULAR
                </div>
              )}

              <div className="p-6">
                {pkg.iconUrl && (
                  <div id={`mobile-package-icon-${pkg.slug}`} className="mb-4 flex justify-center">
                    <img
                      src={pkg.iconUrl}
                      alt={`${pkg.name} icon`}
                      className="h-16 w-16 object-contain"
                    />
                  </div>
                )}
                <h3 id={`mobile-package-name-${pkg.slug}`} className="text-2xl font-bold mb-2 text-white text-center">
                  {pkg.name}
                </h3>
                {pkg.description && (
                  <p id={`mobile-package-desc-${pkg.slug}`} className="text-gray-400 mb-4 text-center text-sm">
                    {pkg.description}
                  </p>
                )}

                <div id={`mobile-package-price-${pkg.slug}`} className="mb-6 text-center">
                  <span
                    className="text-5xl font-bold"
                    style={{ color: pkg.highlightColor || '#d83f0a' }}
                  >
                    {formatPrice(pkg.price)}
                  </span>
                  <span className="text-gray-400 text-lg ml-2">{pkg.priceSuffix}</span>
                </div>

                <div id={`mobile-features-${pkg.slug}`} className="space-y-3 mb-6">
                  {data.features.map(feature => {
                    const value = feature.values[pkg.slug]
                    if (!value) return null

                    let displayValue: React.ReactNode = null
                    if (value.valueType === 'check') {
                      if (!value.isChecked) return null
                      displayValue = <Check className="h-5 w-5 text-[#d83f0a] flex-shrink-0" />
                    } else if (value.valueType === 'text') {
                      displayValue = <span className="text-sm text-gray-400">{value.textValue}</span>
                    } else if (value.valueType === 'dropdown') {
                      const selected = selectedDropdowns[`${feature.id}-${pkg.slug}`] || value.dropdownSelected || value.dropdownOptions?.[0]
                      displayValue = <span className="text-sm text-gray-400">{selected}</span>
                    }

                    return (
                      <div key={feature.id} id={`mobile-feature-${feature.id}-${pkg.slug}`} className="flex items-center gap-3">
                        {displayValue}
                        <span className="text-sm text-gray-300">{feature.name}</span>
                      </div>
                    )
                  })}
                </div>

                <button
                  id={`mobile-cta-${pkg.slug}`}
                  onClick={() => handleSelectPackage(pkg)}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                    pkg.isFeatured
                      ? 'text-white hover:opacity-90 hover:scale-105'
                      : 'bg-[#0b0b0b] border border-gray-700 text-white hover:bg-gray-800'
                  }`}
                  style={pkg.isFeatured ? {
                    background: `linear-gradient(135deg, ${pkg.highlightColor || '#d83f0a'}, ${pkg.highlightColor ? pkg.highlightColor + 'cc' : '#d66a0a'})`
                  } : {}}
                >
                  {pkg.ctaText || 'Get Started'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer Note */}
        <motion.div
          id="packages-v2-footer"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-gray-400">
            {data.settings?.footer_note || 'All packages include free return shipping and insurance'}
          </p>
        </motion.div>
      </div>

      {/* Click outside to close dropdown */}
      {openDropdown && (
        <div
          id="dropdown-overlay"
          className="fixed inset-0 z-10"
          onClick={() => setOpenDropdown(null)}
        />
      )}
    </div>
  )
}
