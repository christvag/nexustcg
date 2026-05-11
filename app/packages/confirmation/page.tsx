'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface ConfirmationData {
  orderNumber: string
  orderDate: string
  packageName: string
  totalCards: number
  total: number
  customerInfo: {
    name: string
    email: string
    phone: string
    address: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  cards: any[]
}

export default function ConfirmationPage() {
  const router = useRouter()
  const [confirmationData, setConfirmationData] = useState<ConfirmationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const data = localStorage.getItem('confirmationData')
    if (!data) {
      router.push('/packages')
      return
    }
    setConfirmationData(JSON.parse(data))
    setIsLoading(false)
    
    // Clear the confirmation data after displaying
    setTimeout(() => {
      localStorage.removeItem('confirmationData')
    }, 5000)
  }, [router])

  if (isLoading || !confirmationData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gaming-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="flex justify-center mb-8"
        >
          <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold mb-4">
            <span className="text-gradient">Order Confirmed!</span>
          </h1>
          <p className="text-xl text-gray-300">
            Thank you for choosing TCG Grading Service
          </p>
        </motion.div>

        {/* Order Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-900 rounded-xl shadow-lg p-8 mb-8"
        >
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm text-gray-400 mb-1">Order Number</h3>
              <p className="font-semibold text-lg">{confirmationData.orderNumber}</p>
            </div>
            <div>
              <h3 className="text-sm text-gray-400 mb-1">Order Date</h3>
              <p className="font-semibold text-lg">
                {new Date(confirmationData.orderDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <h3 className="text-sm text-gray-400 mb-1">Package</h3>
              <p className="font-semibold text-lg">{confirmationData.packageName}</p>
            </div>
            <div>
              <h3 className="text-sm text-gray-400 mb-1">Total Cards</h3>
              <p className="font-semibold text-lg">{confirmationData.totalCards}</p>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-semibold mb-4">Shipping Address</h3>
            <p className="text-gray-400">
              {confirmationData.customerInfo.name}<br />
              {confirmationData.customerInfo.address}<br />
              {confirmationData.customerInfo.city}, {confirmationData.customerInfo.state} {confirmationData.customerInfo.zipCode}<br />
              {confirmationData.customerInfo.country}
            </p>
          </div>

          <div className="border-t border-gray-700 pt-6 mt-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Total Paid</h3>
              <p className="text-2xl font-bold text-gradient">
                ${confirmationData.total.toFixed(2)}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-blue-900/20 border border-blue-800 rounded-xl p-6 mb-8"
        >
          <h3 className="text-lg font-semibold mb-4 text-blue-100">
            What Happens Next?
          </h3>
          <ol className="space-y-3 text-blue-200">
            <li className="flex items-start">
              <span className="font-semibold mr-2">1.</span>
              <span>Check your email for order confirmation and shipping instructions</span>
            </li>
            <li className="flex items-start">
              <span className="font-semibold mr-2">2.</span>
              <span>Package your cards securely following our guidelines</span>
            </li>
            <li className="flex items-start">
              <span className="font-semibold mr-2">3.</span>
              <span>Ship your cards to our grading facility using the provided label</span>
            </li>
            <li className="flex items-start">
              <span className="font-semibold mr-2">4.</span>
              <span>Track your order status online using your order number</span>
            </li>
            <li className="flex items-start">
              <span className="font-semibold mr-2">5.</span>
              <span>Receive your professionally graded cards in protective slabs</span>
            </li>
          </ol>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-gaming-primary to-gaming-secondary text-white rounded-lg font-medium hover:scale-105 transition-transform"
          >
            Return to Home
          </Link>
          <Link
            href="/packages"
            className="inline-flex items-center justify-center px-6 py-3 border-2 border-gray-700 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Submit Another Order
          </Link>
        </motion.div>

        {/* Contact Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-12 text-sm text-gray-400"
        >
          <p>
            Need help? Contact us at{' '}
            <a href="mailto:support@tcggrading.com" className="text-gaming-primary hover:underline">
              support@tcggrading.com
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  )
}