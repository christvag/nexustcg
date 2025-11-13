'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  Eye,
  Download,
  MessageSquare,
  Star,
  Search,
  Filter,
  Calendar,
  ChevronRight,
  AlertCircle,
  X
} from 'lucide-react';

interface Order {
  id: number;
  order_number: string;
  created_at: string;
  status: 'pending' | 'received' | 'in_progress' | 'grading' | 'completed' | 'shipped' | 'delivered';
  total: string;
  total_cards: number;
  package_name: string;
  items: OrderItem[];
}

interface OrderItem {
  id: number;
  card_name: string;
  card_game: string;
  card_type: string;
  card_rarity: string;
  card_number: string;
  quantity: number;
  unit_price: string;
  is_custom: boolean;
}

export default function OrderTracking() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      const user = JSON.parse(savedUser)
      setCurrentUser(user)
      fetchOrders(user.id)
    } else {
      setIsLoading(false)
    }
  }, [])

  const fetchOrders = async (userId: number) => {
    try {
      const response = await fetch(`/api/orders?user_id=${userId}`)
      const data = await response.json()
      
      if (response.ok && data.orders) {
        // Fetch order items for each order
        const ordersWithItems = await Promise.all(
          data.orders.map(async (order: any) => {
            try {
              const itemsResponse = await fetch(`/api/orders/${order.id}/items`)
              const itemsData = await itemsResponse.json()
              return {
                ...order,
                items: itemsData.items || []
              }
            } catch (error) {
              console.error('Error fetching order items:', error)
              return { ...order, items: [] }
            }
          })
        )
        
        setOrders(ordersWithItems)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'received':
        return <Package className="h-5 w-5 text-purple-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-orange-500" />;
      case 'grading':
        return <Star className="h-5 w-5 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'shipped':
        return <Truck className="h-5 w-5 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'received':
        return 'bg-purple-100 text-purple-800';
      case 'in_progress':
        return 'bg-orange-100 text-orange-800';
      case 'grading':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
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
        return 'Unknown';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.items.some(item => item.card_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const OrderDetailModal = ({ order }: { order: Order }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{order.order_number}</h3>
              <p className="text-gray-500 mt-1">Ordered on {new Date(order.created_at).toLocaleDateString()}</p>
            </div>
            <button
              onClick={() => setSelectedOrder(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Status */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {getStatusIcon(order.status)}
                <span className="ml-2">{getStatusText(order.status)}</span>
              </span>
              <div className="text-sm text-gray-600">
                Package: {order.package_name}
              </div>
            </div>
            
            {order.status === 'completed' && (
              <p className="text-sm text-green-600">
                Grading completed! Ready for shipping.
              </p>
            )}
            
            {order.status === 'delivered' && (
              <p className="text-sm text-green-600">
                Order delivered successfully!
              </p>
            )}
          </div>

          {/* Items */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Order Items</h4>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                  <div className="h-16 w-16 bg-gray-200 rounded-lg flex items-center justify-center">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">{item.card_name}</h5>
                    <div className="text-sm text-gray-500">
                      Quantity: {item.quantity} • ${parseFloat(item.unit_price).toFixed(2)}
                    </div>
                    <div className="text-sm text-blue-600 mt-1">
                      {item.card_game} • {item.card_type} • {item.card_rarity}
                      {item.card_number && ` • #${item.card_number}`}
                      {item.is_custom && ' • Custom Card'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Timeline */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Order Timeline</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-gray-900">Order Placed</h5>
                    <span className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Your order has been received and is being processed.</p>
                </div>
              </div>
              
              {['received', 'in_progress', 'grading', 'completed', 'shipped', 'delivered'].includes(order.status) && (
                <div className="flex items-start space-x-3">
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">Current Status: {getStatusText(order.status)}</h5>
                    <p className="text-sm text-gray-600 mt-1">
                      {order.status === 'received' && 'Your cards have been received at our facility.'}
                      {order.status === 'in_progress' && 'Your cards are being processed and prepared for grading.'}
                      {order.status === 'grading' && 'Your cards are currently being graded by our experts.'}
                      {order.status === 'completed' && 'Grading is complete! Your cards are ready for shipment.'}
                      {order.status === 'shipped' && 'Your graded cards have been shipped back to you.'}
                      {order.status === 'delivered' && 'Your order has been delivered successfully!'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Details */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Order Summary</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Package: {order.package_name}</p>
              <p>Total Cards: {order.total_cards}</p>
              <p>Total Amount: ${parseFloat(order.total).toFixed(2)}</p>
              <p>Order Status: {getStatusText(order.status)}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t">
            <button className="flex items-center space-x-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
              <Download className="h-4 w-4" />
              <span>Download Receipt</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
              <MessageSquare className="h-4 w-4" />
              <span>Contact Support</span>
            </button>
            {order.status === 'delivered' && (
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Star className="h-4 w-4" />
                <span>Leave Review</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Show login required message if no user
  if (!isLoading && !currentUser) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Orders</h2>
          <p className="text-gray-600 mt-1">Track your orders and view order history</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="max-w-md mx-auto">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Login Required</h3>
            <p className="text-gray-600 mb-6">
              You need to be logged in to view your orders. Please log in or create an account to get started.
            </p>
            <div className="space-y-3">
              <Link
                href="/packages/checkout"
                className="block w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Login / Create Account
              </Link>
              <Link
                href="/packages"
                className="block w-full text-blue-600 border border-blue-600 py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors"
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
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Orders</h2>
        <p className="text-gray-600 mt-1">Track your orders and view order history</p>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders or items..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <select
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="received">Received</option>
            <option value="in_progress">In Progress</option>
            <option value="grading">Grading</option>
            <option value="completed">Completed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg shadow animate-pulse">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div>
                        <div className="h-5 bg-gray-300 rounded w-32 mb-2"></div>
                        <div className="h-4 bg-gray-300 rounded w-48"></div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="h-6 bg-gray-300 rounded-full w-20"></div>
                      <div className="h-8 bg-gray-300 rounded w-24"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 bg-gray-300 rounded"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-300 rounded w-24 mb-1"></div>
                          <div className="h-3 bg-gray-300 rounded w-16"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{order.order_number}</h3>
                      <p className="text-sm text-gray-500">
                        Ordered on {new Date(order.created_at).toLocaleDateString()} • {order.total_cards} cards • ${parseFloat(order.total).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1">{getStatusText(order.status)}</span>
                    </span>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>

                {/* Order Preview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <div className="flex items-center space-x-4">
                      {order.items.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-center space-x-2">
                          <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center">
                            <Package className="h-5 w-5 text-gray-400" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 truncate max-w-32">
                              {item.card_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.card_game} • Qty: {item.quantity}
                            </div>
                          </div>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="text-sm text-gray-500">
                          +{order.items.length - 3} more cards
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{order.package_name}</div>
                      <div className="text-xs text-gray-500">{order.total_cards} cards total</div>
                    </div>
                  </div>
                </div>

                {/* Status info */}
                {order.status === 'grading' && (
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center text-sm text-yellow-800">
                      <Star className="h-4 w-4 mr-2" />
                      <span>Your cards are currently being graded by our experts</span>
                    </div>
                  </div>
                )}
                
                {order.status === 'completed' && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center text-sm text-green-800">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      <span>Grading complete! Your cards are ready for shipment</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {!isLoading && filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria' 
              : "You haven't placed any orders yet"}
          </p>
          <Link
            href="/packages"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Browse Packages
          </Link>
        </div>
      )}

      {selectedOrder && <OrderDetailModal order={selectedOrder} />}
    </div>
  );
}