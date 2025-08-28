'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface UserStats {
  totalOrders: number
  pendingOrders: number
  completedOrders: number
  recentOrders: any[]
}

export default function UserDashboard() {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    fetchUserStats()
  }, [])

  const fetchUserStats = async () => {
    try {
      // Check if user is logged in
      const savedUser = localStorage.getItem('currentUser')
      if (!savedUser) {
        setIsLoading(false)
        return
      }
      
      const user = JSON.parse(savedUser)
      setCurrentUser(user)
      
      const response = await fetch(`/api/orders?user_id=${user.id}`)

      if (response.ok) {
        const data = await response.json()
        const orders = data.orders || []
        
        setStats({
          totalOrders: orders.length,
          pendingOrders: orders.filter((o: any) => ['pending', 'received', 'in_progress', 'grading'].includes(o.status)).length,
          completedOrders: orders.filter((o: any) => ['completed', 'shipped', 'delivered'].includes(o.status)).length,
          recentOrders: orders.slice(0, 5)
        })
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Welcome to Nexus TCG!</h2>
          <p className="text-blue-100">
            Please log in to access your personalized dashboard and manage your card grading orders.
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Login Required</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              You need to be logged in to view your dashboard. Please log in or create an account to get started.
            </p>
            <div className="space-y-3">
              <Link
                href="/packages/checkout"
                className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Login / Create Account
              </Link>
              <Link
                href="/packages"
                className="block w-full text-blue-600 border border-blue-600 py-3 px-4 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors font-medium"
              >
                Browse Packages
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: '📦',
      color: 'from-blue-500 to-blue-600',
      href: '/dashboard/orders'
    },
    {
      title: 'In Progress',
      value: stats?.pendingOrders || 0,
      icon: '⏳',
      color: 'from-yellow-500 to-yellow-600',
      href: '/dashboard/orders?status=pending'
    },
    {
      title: 'Completed',
      value: stats?.completedOrders || 0,
      icon: '✅',
      color: 'from-green-500 to-green-600',
      href: '/dashboard/orders?status=completed'
    }
  ]

  return (
    <div className="space-y-8 pb-20 lg:pb-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {currentUser?.first_name}!
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Track your orders and manage your account
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link href={card.href}>
              <div className={`bg-gradient-to-r ${card.color} rounded-2xl p-6 text-white cursor-pointer transform transition-transform hover:scale-105`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm font-medium">{card.title}</p>
                    <p className="text-3xl font-bold">{card.value}</p>
                  </div>
                  <div className="text-4xl opacity-80">{card.icon}</div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Recent Orders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Orders</h2>
            <Link
              href="/dashboard/orders"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              View All →
            </Link>
          </div>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {stats?.recentOrders?.length > 0 ? (
            stats.recentOrders.map((order: any) => (
              <div key={order.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <Link href={`/dashboard/orders/${order.id}`} className="text-blue-600 hover:text-blue-700 font-medium">
                          {order.order_number}
                        </Link>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {order.package_name} • {order.total_cards} cards
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-white">${order.total}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                      order.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      order.status === 'in_progress' || order.status === 'grading' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      order.status === 'pending' || order.status === 'received' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      order.status === 'shipped' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <div className="text-4xl mb-4">📦</div>
              <p className="text-lg mb-2">No orders yet</p>
              <p className="text-sm">Start by submitting your first order!</p>
              <Link
                href="/packages"
                className="inline-flex items-center mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Order
              </Link>
            </div>
          )}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link href="/packages" className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <span className="mr-3 text-xl">➕</span>
              <div>
                <span className="font-medium">Submit New Order</span>
                <p className="text-sm text-gray-500 dark:text-gray-400">Start a new grading request</p>
              </div>
            </Link>
            <Link href="/dashboard/chat" className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <span className="mr-3 text-xl">💬</span>
              <div>
                <span className="font-medium">Chat Support</span>
                <p className="text-sm text-gray-500 dark:text-gray-400">Get help from our staff</p>
              </div>
            </Link>
            <Link href="/dashboard/profile" className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <span className="mr-3 text-xl">👤</span>
              <div>
                <span className="font-medium">Update Profile</span>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage your account</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Need Help?</h3>
          <div className="space-y-4">
            <div className="flex items-start">
              <span className="mr-3 text-xl">📋</span>
              <div>
                <h4 className="font-medium">Grading Guide</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Learn about our grading process</p>
                <Link href="/about" className="text-blue-600 hover:text-blue-700 text-sm">
                  Learn More →
                </Link>
              </div>
            </div>
            <div className="flex items-start">
              <span className="mr-3 text-xl">📞</span>
              <div>
                <h4 className="font-medium">Contact Support</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Get in touch with our team</p>
                <p className="text-sm text-blue-600">support@tcggrading.com</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}