'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

interface OrderItem {
  id: number
  card_name: string
  card_game: string
  card_rarity?: string
  card_number?: string
  image_url?: string
  quantity: number
  grading_status: 'pending' | 'received' | 'grading' | 'graded' | 'shipped'
  grade?: string
  grade_notes?: string
}

interface Order {
  id: number
  order_number: string
  package_name: string
  total_cards: number
  total: number
  status: 'pending' | 'received' | 'in_progress' | 'grading' | 'completed' | 'shipped' | 'delivered' | 'cancelled'
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  created_at: string
  updated_at: string
  items?: OrderItem[]
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [loadingItems, setLoadingItems] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      // Get current user from localStorage (in production, use proper auth)
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
      
      if (!currentUser.id) {
        console.log('No user found')
        setLoading(false)
        return
      }

      const response = await fetch(`/api/orders?user_id=${currentUser.id}`)
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchOrderItems = async (orderId: number) => {
    setLoadingItems(true)
    try {
      const response = await fetch(`/api/orders/${orderId}/items`)
      if (response.ok) {
        const data = await response.json()
        setSelectedOrder(prev => prev ? { ...prev, items: data.items } : null)
      }
    } catch (error) {
      console.error('Error fetching order items:', error)
    } finally {
      setLoadingItems(false)
    }
  }

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order)
    fetchOrderItems(order.id)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-900/20 text-yellow-200'
      case 'received': return 'bg-blue-900/20 text-blue-200'
      case 'in_progress': return 'bg-purple-900/20 text-purple-200'
      case 'grading': return 'bg-orange-900/20 text-orange-200'
      case 'completed': return 'bg-green-900/20 text-green-200'
      case 'shipped': return 'bg-green-900/20 text-green-200'
      case 'delivered': return 'bg-green-900/20 text-green-200'
      case 'cancelled': return 'bg-red-900/20 text-red-200'
      default: return 'bg-gray-900/20 text-gray-200'
    }
  }

  const getGradingStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-900/20 text-gray-200'
      case 'received': return 'bg-blue-900/20 text-blue-200'
      case 'grading': return 'bg-yellow-900/20 text-yellow-200'
      case 'graded': return 'bg-green-900/20 text-green-200'
      case 'shipped': return 'bg-purple-900/20 text-purple-200'
      default: return 'bg-gray-900/20 text-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gaming-primary"></div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold mb-2">
          <span className="text-gradient">My Orders</span>
        </h1>
        <p className="text-gray-300">
          Track your card grading orders and see detailed progress
        </p>
      </motion.div>

      {orders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900 rounded-xl shadow-lg p-8 text-center"
        >
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold mb-2">No Orders Yet</h2>
          <p className="text-gray-400 mb-6">
            You haven't submitted any cards for grading yet.
          </p>
          <button
            onClick={() => window.location.href = '/packages'}
            className="px-6 py-3 bg-gradient-to-r from-gaming-primary to-gaming-secondary text-white rounded-lg font-medium hover:scale-105 transition-transform"
          >
            Start Grading Cards
          </button>
        </motion.div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Orders List */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold mb-4">Your Orders</h2>
            {orders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-gray-900 rounded-xl shadow-lg p-6 cursor-pointer border-2 transition-colors ${
                  selectedOrder?.id === order.id 
                    ? 'border-gaming-primary' 
                    : 'border-transparent hover:border-gray-600'
                }`}
                onClick={() => handleOrderClick(order)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Order #{order.order_number}</h3>
                    <p className="text-sm text-gray-400">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {order.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Package:</span>
                    <p className="font-medium">{order.package_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Cards:</span>
                    <p className="font-medium">{order.total_cards}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Total:</span>
                    <p className="font-medium">${order.total.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Payment:</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      order.payment_status === 'paid' 
                        ? 'bg-green-900/20 text-green-200'
                        : 'bg-yellow-900/20 text-yellow-200'
                    }`}>
                      {order.payment_status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {selectedOrder?.id === order.id && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <p className="text-sm text-gaming-primary font-medium">
                      ← Click to view detailed progress
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Order Details */}
          <div>
            <AnimatePresence mode="wait">
              {selectedOrder ? (
                <motion.div
                  key={selectedOrder.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-gray-900 rounded-xl shadow-lg p-6 sticky top-8"
                >
                  <h2 className="text-2xl font-semibold mb-6">Order Details</h2>
                  
                  {loadingItems ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gaming-primary"></div>
                    </div>
                  ) : selectedOrder.items ? (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                      {selectedOrder.items.map((item) => (
                        <div key={item.id} className="bg-gray-800 rounded-lg p-4">
                          <div className="flex items-start gap-4">
                            {/* Card Image */}
                            <div className="w-16 h-20 bg-gray-700 rounded overflow-hidden flex-shrink-0">
                              {item.image_url ? (
                                <Image
                                  src={item.image_url}
                                  alt={item.card_name}
                                  width={64}
                                  height={80}
                                  className="object-cover w-full h-full"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs text-center p-1">
                                  {item.card_name}
                                </div>
                              )}
                            </div>

                            {/* Card Details */}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-lg mb-1">{item.card_name}</h4>
                              <p className="text-sm text-gray-400 mb-2">
                                {item.card_game} • {item.card_rarity}
                              </p>
                              {item.card_number && (
                                <p className="text-xs text-gray-500 mb-2">#{item.card_number}</p>
                              )}
                              
                              <div className="flex items-center justify-between">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getGradingStatusColor(item.grading_status)}`}>
                                  {item.grading_status.replace('_', ' ').toUpperCase()}
                                </span>
                                {item.grade && (
                                  <div className="text-right">
                                    <span className="text-lg font-bold text-gaming-primary">Grade: {item.grade}</span>
                                    {item.grade_notes && (
                                      <p className="text-xs text-gray-400">{item.grade_notes}</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">Failed to load order details.</p>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-gray-900 rounded-xl shadow-lg p-8 text-center"
                >
                  <div className="mb-4">
                    <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium mb-2">Select an Order</h3>
                  <p className="text-gray-400">
                    Click on an order to view detailed progress and grading status
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  )
}