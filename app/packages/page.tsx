'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Package {
  id: string
  name: string
  price: number
  description: string
  features: string[]
  processingTime: string
  minCards?: number
  popular?: boolean
}

const packages: Package[] = [
  {
    id: 'authentication',
    name: 'Authentication',
    price: 10,
    description: 'Card authentication only',
    features: [
      'Professional authentication',
      'Bulk pricing available',
      'Unlimited cards',
      'Certificate of authenticity',
    ],
    processingTime: 'Standard processing',
  },
  {
    id: 'bulk',
    name: 'Bulk Grading',
    price: 12,
    description: 'High volume grading service',
    features: [
      'Minimum 50 cards',
      'Professional grading',
      'Bulk discount pricing',
      'Protective slabs included',
    ],
    processingTime: '5-6 business days',
    minCards: 50,
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 15,
    description: 'Our most popular service',
    features: [
      'Unlimited cards',
      'Professional grading',
      'Protective slabs included',
      'Online tracking',
    ],
    processingTime: '5-6 business days',
    popular: true,
  },
  {
    id: 'express',
    name: 'Express',
    price: 20,
    description: 'Fast turnaround service',
    features: [
      'Priority processing',
      'Professional grading',
      'Protective slabs included',
      'Express shipping',
    ],
    processingTime: '2-3 business days',
  },
]

export default function PackagesPage() {
  const router = useRouter()
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)

  const handleSelectPackage = (packageId: string) => {
    setSelectedPackage(packageId)
    setTimeout(() => {
      router.push(`/packages/card-selection?package=${packageId}`)
    }, 300)
  }

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-gradient">Choose Your Package</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Select the service that best fits your needs
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {packages.map((pkg, index) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden ${
                selectedPackage === pkg.id ? 'ring-4 ring-gaming-primary' : ''
              } ${pkg.popular ? 'gradient-border dark:gradient-border' : 'border border-gray-200 dark:border-gray-800'}`}
            >
              {pkg.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-gaming-primary to-gaming-secondary text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  POPULAR
                </div>
              )}

              <div className="p-6">
                <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                  {pkg.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {pkg.description}
                </p>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-gradient">${pkg.price}</span>
                  <span className="text-gray-600 dark:text-gray-400">/card</span>
                </div>

                <div className="space-y-3 mb-6">
                  {pkg.features.map((feature, i) => (
                    <div key={i} className="flex items-start">
                      <svg
                        className="h-5 w-5 text-gaming-primary mt-0.5 mr-2 flex-shrink-0"
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
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  <div className="flex items-center">
                    <svg
                      className="h-4 w-4 mr-2"
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
                    {pkg.processingTime}
                  </div>
                  {pkg.minCards && (
                    <div className="flex items-center mt-2">
                      <svg
                        className="h-4 w-4 mr-2"
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
                      Min. {pkg.minCards} cards
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleSelectPackage(pkg.id)}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                    pkg.popular
                      ? 'bg-gradient-to-r from-gaming-primary to-gaming-secondary text-white hover:scale-105'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  Select Package
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-gray-600 dark:text-gray-400">
            All packages include free return shipping and insurance
          </p>
        </motion.div>
      </div>
    </div>
  )
}