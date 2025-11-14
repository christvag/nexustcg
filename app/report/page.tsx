'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

export default function ReportPage() {
  const [reportType, setReportType] = useState('grading')
  const [dateRange, setDateRange] = useState('last30days')

  const stats = {
    totalCardsGraded: 15420,
    averageGrade: 8.2,
    topGame: 'Pokemon',
    monthlyGrowth: '+12%',
  }

  const recentActivity = [
    { date: '2024-01-15', cards: 145, package: 'Standard', status: 'Completed' },
    { date: '2024-01-14', cards: 89, package: 'Express', status: 'Completed' },
    { date: '2024-01-13', cards: 256, package: 'Bulk', status: 'In Progress' },
    { date: '2024-01-12', cards: 67, package: 'Authentication', status: 'Completed' },
    { date: '2024-01-11', cards: 178, package: 'Standard', status: 'Completed' },
  ]

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-4">
            <span className="text-gradient">Grading Reports</span>
          </h1>
          <p className="text-gray-300">
            Track your grading history and statistics
          </p>
        </motion.div>

        {/* Report Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col md:flex-row gap-4 mb-8"
        >
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-gaming-primary focus:outline-none"
          >
            <option value="grading">Grading History</option>
            <option value="authentication">Authentication History</option>
            <option value="financial">Financial Summary</option>
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-gaming-primary focus:outline-none"
          >
            <option value="last7days">Last 7 Days</option>
            <option value="last30days">Last 30 Days</option>
            <option value="last90days">Last 90 Days</option>
            <option value="yeartodate">Year to Date</option>
          </select>

          <button className="px-6 py-2 bg-gradient-to-r from-gaming-primary to-gaming-secondary text-white rounded-lg font-medium hover:scale-105 transition-transform">
            Export Report
          </button>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {[
            {
              label: 'Total Cards Graded',
              value: stats.totalCardsGraded.toLocaleString(),
              icon: '🎴',
              color: 'from-blue-500 to-blue-600',
            },
            {
              label: 'Average Grade',
              value: stats.averageGrade.toFixed(1),
              icon: '⭐',
              color: 'from-yellow-500 to-yellow-600',
            },
            {
              label: 'Top Game',
              value: stats.topGame,
              icon: '🏆',
              color: 'from-purple-500 to-purple-600',
            },
            {
              label: 'Monthly Growth',
              value: stats.monthlyGrowth,
              icon: '📈',
              color: 'from-green-500 to-green-600',
            },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 + 0.2 }}
              className="bg-gray-900 rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">{stat.icon}</span>
                <div
                  className={`h-2 w-2 rounded-full bg-gradient-to-r ${stat.color}`}
                />
              </div>
              <p className="text-2xl font-bold mb-1">{stat.value}</p>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Activity Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-900 rounded-xl shadow-lg overflow-hidden"
        >
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-2xl font-bold">Recent Activity</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Cards
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Package
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {recentActivity.map((activity, index) => (
                  <tr key={index} className="hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {activity.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {activity.cards}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {activity.package}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          activity.status === 'Completed'
                            ? 'bg-green-900 text-green-200'
                            : 'bg-yellow-900 text-yellow-200'
                        }`}
                      >
                        {activity.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  )
}