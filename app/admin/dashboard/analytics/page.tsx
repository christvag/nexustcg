'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface DashboardStats {
  totalUsers: number
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  completedOrders: number
  cardsGraded: number
  popularCards: Array<{
    card_name: string
    card_game: string
    search_count: number
    order_count: number
  }>
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard')
      if (!response.ok) {
        throw new Error('Failed to fetch statistics')
      }
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
      setError('Failed to load dashboard statistics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gaming-primary"></div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gaming-primary text-white rounded-lg hover:bg-gaming-secondary"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const StatCard = ({ title, value, subtitle, icon, color = "blue" }: {
    title: string
    value: string | number
    subtitle?: string
    icon: string
    color?: string
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900 rounded-xl shadow-lg p-6 border-l-4"
      style={{ borderLeftColor: color === "blue" ? "#3b82f6" : color === "green" ? "#10b981" : color === "yellow" ? "#f59e0b" : "#ef4444" }}
    >
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${color === "blue" ? "bg-blue-900/20" : 
          color === "green" ? "bg-green-900/20" : 
          color === "yellow" ? "bg-yellow-900/20" : "bg-red-900/20"}`}>
          <span className="text-2xl">{icon}</span>
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-semibold text-gray-100">{title}</h3>
          <p className="text-3xl font-bold text-gray-100">{value}</p>
          {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold mb-2">
          <span className="text-gradient">Analytics Dashboard</span>
        </h1>
        <p className="text-gray-300">
          Comprehensive overview of your TCG grading business
        </p>
      </motion.div>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Users" 
          value={stats.totalUsers} 
          icon="👥" 
          color="blue"
        />
        <StatCard 
          title="Total Orders" 
          value={stats.totalOrders} 
          icon="📦" 
          color="green"
        />
        <StatCard 
          title="Total Revenue" 
          value={`$${stats.totalRevenue.toFixed(2)}`} 
          icon="💰" 
          color="green"
        />
        <StatCard 
          title="Pending Orders" 
          value={stats.pendingOrders} 
          subtitle="Awaiting processing" 
          icon="⏳" 
          color="yellow"
        />
        <StatCard 
          title="Completed Orders" 
          value={stats.completedOrders} 
          icon="✅" 
          color="green"
        />
        <StatCard 
          title="Cards Graded" 
          value={stats.cardsGraded} 
          icon="🃏" 
          color="blue"
        />
        <StatCard 
          title="Success Rate" 
          value={`${stats.totalOrders > 0 ? ((stats.completedOrders / stats.totalOrders) * 100).toFixed(1) : 0}%`}
          subtitle="Order completion" 
          icon="📈" 
          color="green"
        />
        <StatCard 
          title="Avg Order Value" 
          value={`$${stats.totalOrders > 0 ? (stats.totalRevenue / stats.totalOrders).toFixed(2) : '0.00'}`}
          icon="💳" 
          color="blue"
        />
      </div>

      {/* Popular Cards Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-900 rounded-xl shadow-lg p-6 mb-8"
      >
        <h2 className="text-2xl font-bold mb-6">Popular Cards</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 font-semibold">Card Name</th>
                <th className="text-left py-3 px-4 font-semibold">Game</th>
                <th className="text-center py-3 px-4 font-semibold">Searches</th>
                <th className="text-center py-3 px-4 font-semibold">Orders</th>
                <th className="text-center py-3 px-4 font-semibold">Conversion</th>
              </tr>
            </thead>
            <tbody>
              {stats.popularCards.map((card, index) => {
                const conversionRate = card.search_count > 0 ? (card.order_count / card.search_count * 100).toFixed(1) : '0.0'
                return (
                  <tr key={index} className="border-b border-gray-800 hover:bg-gray-800">
                    <td className="py-3 px-4 font-medium">{card.card_name}</td>
                    <td className="py-3 px-4">
                      <span className="px-3 py-1 text-xs bg-blue-900/20 text-blue-200 rounded-full">
                        {card.card_game}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">{card.search_count}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-1 text-sm bg-green-900/20 text-green-200 rounded">
                        {card.order_count}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-medium">{conversionRate}%</td>
                  </tr>
                )
              })}
              {stats.popularCards.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    No data available yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="bg-gray-900 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={() => window.location.href = '/admin/dashboard/orders'}
              className="w-full text-left px-4 py-3 bg-blue-900/20 hover:bg-blue-900/30 rounded-lg transition-colors"
            >
              <span className="font-medium">View All Orders</span>
              <p className="text-sm text-gray-400">Manage and process orders</p>
            </button>
            <button 
              onClick={() => window.location.href = '/admin/dashboard/users'}
              className="w-full text-left px-4 py-3 bg-green-900/20 hover:bg-green-900/30 rounded-lg transition-colors"
            >
              <span className="font-medium">Manage Users</span>
              <p className="text-sm text-gray-400">View and edit user accounts</p>
            </button>
            <button 
              onClick={fetchStats}
              className="w-full text-left px-4 py-3 bg-purple-900/20 hover:bg-purple-900/30 rounded-lg transition-colors"
            >
              <span className="font-medium">Refresh Data</span>
              <p className="text-sm text-gray-400">Update all statistics</p>
            </button>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">System Health</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Database</span>
              <span className="px-2 py-1 bg-green-900/20 text-green-200 rounded text-xs">
                Online
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Payment Gateway</span>
              <span className="px-2 py-1 bg-green-900/20 text-green-200 rounded text-xs">
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Card APIs</span>
              <span className="px-2 py-1 bg-yellow-900/20 text-yellow-200 rounded text-xs">
                Rate Limited
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="text-sm">
              <span className="font-medium">New user registered</span>
              <p className="text-gray-400">2 minutes ago</p>
            </div>
            <div className="text-sm">
              <span className="font-medium">Order completed</span>
              <p className="text-gray-400">15 minutes ago</p>
            </div>
            <div className="text-sm">
              <span className="font-medium">Payment processed</span>
              <p className="text-gray-400">1 hour ago</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}