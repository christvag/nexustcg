'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  Truck,
  Star,
  TrendingUp,
  Calendar,
  DollarSign,
  Eye,
  ShoppingBag,
  CheckCircle,
  Clock,
  AlertCircle,
  Settings
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function UserDashboard() {
  const [currentUser, setCurrentUser] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [spendingData, setSpendingData] = useState([])

  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    completedOrders: 0,
    wishlistItems: 0,
    loyaltyPoints: 0
  })

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      const user = JSON.parse(savedUser)
      setCurrentUser(user)
      fetchUserData(user.id)
    } else {
      setIsLoading(false)
    }
  }, [])

  const fetchUserData = async (userId: number) => {
    try {
      // Fetch user orders
      const ordersResponse = await fetch(`/api/orders?user_id=${userId}&limit=3`)
      const ordersData = await ordersResponse.json()
      
      if (ordersResponse.ok && ordersData.orders) {
        setRecentOrders(ordersData.orders.slice(0, 3))
        
        // Calculate stats from orders
        const totalOrders = ordersData.orders.length
        const totalSpent = ordersData.orders.reduce((sum: number, order: any) => sum + parseFloat(order.total), 0)
        const completedOrders = ordersData.orders.filter((order: any) => 
          ['completed', 'delivered', 'shipped'].includes(order.status)
        ).length
        
        setStats({
          totalOrders,
          totalSpent,
          completedOrders,
          wishlistItems: 0,
          loyaltyPoints: Math.floor(totalSpent * 0.5) // 0.5 points per dollar
        })
        
        // Generate spending data from recent months
        const monthlySpending = generateMonthlySpending(ordersData.orders)
        setSpendingData(monthlySpending)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateMonthlySpending = (orders: any[]) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const currentDate = new Date()
    const months = []
    
    for (let i = 3; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthName = monthNames[date.getMonth()]
      
      const monthTotal = orders
        .filter(order => order.created_at.startsWith(monthKey))
        .reduce((sum, order) => sum + parseFloat(order.total), 0)
      
      months.push({ month: monthName, amount: monthTotal })
    }
    
    return months
  }

  const getOrderStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'received':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'in_progress':
      case 'processing':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'grading':
        return <Star className="h-4 w-4 text-purple-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'shipped':
        return <Truck className="h-4 w-4 text-indigo-500" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Package className="h-4 w-4 text-gray-500" />;
    }
  };

  const getOrderStatusClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'received':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
      case 'processing':
        return 'bg-orange-100 text-orange-800';
      case 'grading':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOrderStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'received':
        return 'Received';
      case 'in_progress':
        return 'In Progress';
      case 'grading':
        return 'Grading';
      case 'completed':
        return 'Completed';
      case 'shipped':
        return 'Shipped';
      case 'delivered':
        return 'Delivered';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
    }
  };

  // Show login required message if no user
  if (!isLoading && !currentUser) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Welcome to Nexus TCG!</h2>
          <p className="text-blue-100">
            Please log in to access your personalized dashboard and manage your card grading orders.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="max-w-md mx-auto">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Login Required</h3>
            <p className="text-gray-600 mb-6">
              You need to be logged in to view your dashboard. Please log in or create an account to get started.
            </p>
            <div className="space-y-3">
              <Link
                href="/login"
                className="block w-full bg-gaming-primary text-white py-2 px-4 rounded-lg hover:bg-gaming-primary/90 transition-colors"
              >
                Login / Create Account
              </Link>
              <Link
                href="/packages"
                className="block w-full text-gaming-primary border border-gaming-primary py-2 px-4 rounded-lg hover:bg-gaming-primary/5 transition-colors"
              >
                Browse Packages
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          Welcome back, {currentUser ? `${currentUser.first_name}!` : 'Guest!'}
        </h2>
        <p className="text-blue-100">
          Manage your orders, track shipments, and stay connected with our community.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <Package className="h-8 w-8 text-blue-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{stats.totalOrders}</div>
          <div className="text-sm text-gray-600">Total Orders</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <DollarSign className="h-8 w-8 text-green-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">${stats.totalSpent.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Total Spent</div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 text-center">
          <CheckCircle className="h-8 w-8 text-purple-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{stats.completedOrders}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{stats.wishlistItems}</div>
          <div className="text-sm text-gray-600">Wishlist</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <TrendingUp className="h-8 w-8 text-indigo-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{stats.loyaltyPoints}</div>
          <div className="text-sm text-gray-600">Points</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
              <Link 
                href="/user/dashboard/orders"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All
              </Link>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-5 h-5 bg-gray-300 rounded"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
                          <div className="h-3 bg-gray-300 rounded w-32 mb-1"></div>
                          <div className="h-3 bg-gray-300 rounded w-20"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getOrderStatusIcon(order.status)}
                      <div>
                        <div className="font-medium text-gray-900">{order.order_number}</div>
                        <div className="text-sm text-gray-500">
                          {order.total_cards} items • ${parseFloat(order.total).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getOrderStatusClass(order.status)}`}>
                        {getOrderStatusText(order.status)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {!isLoading && recentOrders.length === 0 && (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                <p className="text-gray-500 mb-4">Start your card grading journey today</p>
                <Link
                  href="/packages"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Browse Packages
                </Link>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Spending Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending Overview</h3>
        {isLoading ? (
          <div className="animate-pulse h-48 bg-gray-300 rounded"></div>
        ) : spendingData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={spendingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
              <Line type="monotone" dataKey="amount" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <TrendingUp className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p>No spending data available yet</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Link
            href="/user/dashboard/orders"
            className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Package className="h-8 w-8 text-blue-500 mb-2" />
            <span className="text-sm font-medium text-gray-900">Track Orders</span>
          </Link>

          <Link
            href="/user/dashboard/profile"
            className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Settings className="h-8 w-8 text-purple-500 mb-2" />
            <span className="text-sm font-medium text-gray-900">Settings</span>
          </Link>

          <Link
            href="/packages"
            className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ShoppingBag className="h-8 w-8 text-orange-500 mb-2" />
            <span className="text-sm font-medium text-gray-900">Browse Packages</span>
          </Link>
        </div>
      </div>
    </div>
  );
}