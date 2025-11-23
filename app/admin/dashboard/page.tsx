'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  MessageSquare,
  Award,
  Trophy,
  Star
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#d83f0a', '#d66a0a', '#FF8042', '#FFBB28', '#8884d8', '#82ca9d'];

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    activeUsers: 0,
    totalGraded: 0,
    averageGrade: 0,
    grade10Count: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [revenueData, setRevenueData] = useState([]);
  const [orderStatusData, setOrderStatusData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    fetchAdminStats()
  }, [])

  const fetchAdminStats = async () => {
    try {
      // Fetch all orders
      const ordersResponse = await fetch('/api/orders')
      const ordersData = await ordersResponse.json()
      
      // Fetch all users
      const usersResponse = await fetch('/api/users')
      const usersData = await usersResponse.json()
      
      // Fetch grading report data
      const gradingResponse = await fetch('/api/admin/grading-report')
      const gradingData = await gradingResponse.json()
      
      if (ordersResponse.ok && usersResponse.ok) {
        const orders = ordersData.orders || []
        const users = usersData.users || []
        const gradingStats = gradingData.success ? gradingData.stats : {
          totalGraded: 0,
          averageGrade: 0,
          grade10Count: 0
        }
        
        // Calculate stats
        const totalOrders = orders.length
        const pendingOrders = orders.filter(order => order.status === 'pending').length
        const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0)
        const totalUsers = users.length
        const activeUsers = users.filter(user => user.is_active).length
        
        setStats({
          totalOrders,
          pendingOrders,
          totalRevenue,
          totalUsers,
          activeUsers,
          totalGraded: gradingStats.totalGraded,
          averageGrade: gradingStats.averageGrade,
          grade10Count: gradingStats.grade10Count
        })
        
        // Set recent orders (last 5)
        const sortedOrders = orders
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5)
          .map(order => {
            const user = users.find(u => u.id === order.user_id)
            return {
              id: order.order_number,
              customer: user ? `${user.first_name} ${user.last_name}` : 'Unknown',
              total: parseFloat(order.total),
              status: order.status,
              date: order.created_at
            }
          })
        
        setRecentOrders(sortedOrders)
        
        // Generate order status data
        const statusCounts = orders.reduce((acc, order) => {
          acc[order.status] = (acc[order.status] || 0) + 1
          return acc
        }, {})
        
        const statusData = Object.entries(statusCounts).map(([status, count]) => ({
          name: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
          value: count
        }))
        
        setOrderStatusData(statusData)
        
        // Generate revenue data for last 6 months
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const currentDate = new Date()
        const monthlyData = []
        
        for (let i = 5; i >= 0; i--) {
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          const monthName = monthNames[date.getMonth()]
          
          const monthOrders = orders.filter(order => order.created_at.startsWith(monthKey))
          const monthRevenue = monthOrders.reduce((sum, order) => sum + parseFloat(order.total), 0)
          
          monthlyData.push({
            name: monthName,
            revenue: monthRevenue,
            orders: monthOrders.length
          })
        }
        
        setRevenueData(monthlyData)
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'received':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'in_progress':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'grading':
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'shipped':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'received':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-orange-100 text-orange-800';
      case 'grading':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div id="admin-dashboard-loading" className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>

        {/* Loading Stats Cards */}
        <div id="loading-stats-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} id={`loading-stat-card-${i}`} className="bg-[#171717] border border-gray-800 rounded-lg shadow p-6 animate-pulse">
              <div className="flex items-center">
                <div className="p-2 bg-gray-800 rounded-lg">
                  <div className="h-6 w-6 bg-gray-700 rounded"></div>
                </div>
                <div className="ml-4 flex-1">
                  <div className="h-4 bg-gray-800 rounded w-16 mb-2"></div>
                  <div className="h-8 bg-gray-700 rounded w-20"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Loading Charts */}
        <div id="loading-charts-grid" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div id="loading-chart-1" className="bg-[#171717] border border-gray-800 rounded-lg shadow p-6 animate-pulse">
            <div className="h-6 bg-gray-800 rounded w-32 mb-4"></div>
            <div className="h-64 bg-gray-800 rounded"></div>
          </div>
          <div id="loading-chart-2" className="bg-[#171717] border border-gray-800 rounded-lg shadow p-6 animate-pulse">
            <div className="h-6 bg-gray-800 rounded w-32 mb-4"></div>
            <div className="h-64 bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div id="admin-dashboard-main" className="space-y-6">
      <div id="dashboard-header" className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <div className="text-sm text-gray-400">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Stats Cards */}
      <div id="stats-cards-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div id="stat-card-total-orders" className="bg-[#171717] border border-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-[#d83f0a]/20 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-[#d83f0a]" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Total Orders</p>
              <div className="flex items-center">
                <p className="text-2xl font-semibold text-white">{stats.totalOrders}</p>
              </div>
            </div>
          </div>
        </div>

        <div id="stat-card-pending-orders" className="bg-[#171717] border border-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-900/20 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Pending Orders</p>
              <div className="flex items-center">
                <p className="text-2xl font-semibold text-white">{stats.pendingOrders}</p>
              </div>
            </div>
          </div>
        </div>

        <div id="stat-card-revenue" className="bg-[#171717] border border-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-900/20 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Total Revenue</p>
              <div className="flex items-center">
                <p className="text-2xl font-semibold text-white">${stats.totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        <div id="stat-card-graded" className="bg-[#171717] border border-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-[#d66a0a]/20 rounded-lg">
              <Award className="h-6 w-6 text-[#d66a0a]" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Cards Graded</p>
              <div className="flex items-center">
                <p className="text-2xl font-semibold text-white">{stats.totalGraded}</p>
                {stats.averageGrade > 0 && (
                  <span className="text-sm text-[#d83f0a] ml-2">Avg: {stats.averageGrade.toFixed(1)}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div id="charts-section" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div id="revenue-chart-container" className="bg-[#171717] border border-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-white mb-4">Revenue & Orders</h3>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis yAxisId="left" stroke="#9CA3AF" />
                <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F3F4F6' }} />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" fill="#d83f0a" name="Revenue ($)" />
                <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#d66a0a" strokeWidth={2} name="Orders" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-white mb-2">No Revenue Data</h4>
                <p className="text-gray-400">Revenue charts will appear once orders are placed</p>
              </div>
            </div>
          )}
        </div>

        {/* Order Status Distribution */}
        <div id="order-status-chart-container" className="bg-[#171717] border border-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-white mb-4">Order Status Distribution</h3>
          {orderStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F3F4F6' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <Package className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-white mb-2">No Order Data</h4>
                <p className="text-gray-400">Order status distribution will appear once orders are placed</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div id="recent-orders-section" className="bg-[#171717] border border-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="text-lg font-medium text-white">Recent Orders</h3>
        </div>
        <div className="overflow-x-auto">
          <table id="recent-orders-table" className="min-w-full divide-y divide-gray-800">
            <thead className="bg-[#0b0b0b]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-[#171717] divide-y divide-gray-800">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <tr key={order.id} id={`order-row-${order.id}`} className="hover:bg-[#1f1f1f]">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      {order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {order.customer}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      ${order.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1">{order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(order.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <ShoppingCart className="h-12 w-12 text-gray-600 mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">No Orders Yet</h3>
                      <p className="text-gray-400 mb-4">Orders will appear here once customers start placing them</p>
                      <div className="text-sm text-gray-500">
                        Customers can browse packages and place orders through the website
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div id="quick-actions-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div id="quick-action-grading" className="bg-[#171717] border border-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-[#d66a0a]/20 rounded-lg">
              <svg className="h-6 w-6 text-[#d66a0a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h4 className="text-lg font-medium text-white">Grading Report</h4>
              <p className="text-sm text-gray-400">View all graded cards</p>
            </div>
          </div>
          <div className="mt-4">
            <a href="/admin/dashboard/grading-report" className="text-[#d83f0a] hover:text-[#d66a0a] font-medium text-sm">
              View Grading Report →
            </a>
          </div>
        </div>

        <div id="quick-action-orders" className="bg-[#171717] border border-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-900/20 rounded-lg">
              <Package className="h-6 w-6 text-green-500" />
            </div>
            <div className="ml-4">
              <h4 className="text-lg font-medium text-white">Manage Orders</h4>
              <p className="text-sm text-gray-400">Process and track orders</p>
            </div>
          </div>
          <div className="mt-4">
            <a href="/admin/dashboard/orders" className="text-green-500 hover:text-green-400 font-medium text-sm">
              View Orders →
            </a>
          </div>
        </div>

        <div id="quick-action-population" className="bg-[#171717] border border-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-[#d83f0a]/20 rounded-lg">
              <svg className="h-6 w-6 text-[#d83f0a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
            <div className="ml-4">
              <h4 className="text-lg font-medium text-white">Population Report</h4>
              <p className="text-sm text-gray-400">Manage graded cards database</p>
            </div>
          </div>
          <div className="mt-4">
            <a href="/admin/dashboard/population-report" className="text-[#d83f0a] hover:text-[#d66a0a] font-medium text-sm">
              Manage Cards →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}