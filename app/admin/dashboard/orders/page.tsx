'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  customer: string;
  email: string;
  items: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: string;
  trackingNumber?: string;
  createdAt: string;
  shippedDate?: string;
  deliveredDate?: string;
}

export default function OrdersManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showOrderDetails, setShowOrderDetails] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const ordersPerPage = 10;

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      const data = await response.json();

      if (response.ok && data.orders) {
        // Fetch users to map user names
        const usersResponse = await fetch('/api/users');
        const usersData = await usersResponse.json();
        const usersMap = new Map(usersData.users?.map((u: any) => [u.id, `${u.first_name} ${u.last_name}`]) || []);

        const mappedOrders = data.orders.map((order: any) => ({
          id: String(order.id),
          orderNumber: order.order_number,
          customer: usersMap.get(order.user_id) || 'Unknown',
          email: order.email || '',
          items: order.total_cards || 0,
          total: parseFloat(order.total) || 0,
          status: order.status,
          paymentStatus: order.payment_status,
          paymentMethod: order.payment_method || 'Stripe',
          trackingNumber: order.tracking_number,
          createdAt: order.created_at,
          shippedDate: order.shipped_date,
          deliveredDate: order.delivered_date
        }));
        setOrders(mappedOrders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'processing':
        return <AlertCircle className="h-4 w-4" />;
      case 'shipped':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, status: newStatus as any } : order
    ));
  };

  const handleBulkAction = (action: string) => {
    if (selectedOrders.length === 0) {
      alert('Please select orders first');
      return;
    }
    
    switch (action) {
      case 'export':
        console.log('Exporting orders:', selectedOrders);
        break;
      case 'delete':
        if (confirm(`Delete ${selectedOrders.length} orders?`)) {
          setOrders(orders.filter(order => !selectedOrders.includes(order.id)));
          setSelectedOrders([]);
        }
        break;
      case 'mark-shipped':
        setOrders(orders.map(order => 
          selectedOrders.includes(order.id) ? { ...order, status: 'shipped' as const } : order
        ));
        setSelectedOrders([]);
        break;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage
  );

  if (isLoading) {
    return (
      <div id="orders-loading" className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Orders Management</h2>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d83f0a] mx-auto mb-4"></div>
            <p className="text-gray-400">Loading orders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="orders-management-container" className="space-y-6">
      {/* Header */}
      <div id="orders-header" className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Orders Management</h2>
        <button id="create-order-btn" className="bg-gradient-to-r from-[#d83f0a] to-[#d66a0a] text-white px-4 py-2 rounded-lg hover:opacity-90 flex items-center space-x-2">
          <Package className="h-5 w-5" />
          <span>Create Order</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div id="orders-filters-section" className="bg-[#171717] border border-gray-800 rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="orders-search-input"
                type="text"
                placeholder="Search orders by number, customer, or email..."
                className="w-full pl-10 pr-4 py-2 bg-[#0b0b0b] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d83f0a] focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <select
            id="filter-status-select"
            className="px-4 py-2 bg-[#0b0b0b] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#d83f0a] focus:border-transparent"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <button id="more-filters-btn" className="px-4 py-2 border border-gray-700 rounded-lg text-white hover:bg-[#0b0b0b] flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>More Filters</span>
          </button>
        </div>

        {/* Bulk Actions */}
        {selectedOrders.length > 0 && (
          <div id="bulk-actions-bar" className="mt-4 flex items-center space-x-4 p-3 bg-[#d83f0a]/10 border border-[#d83f0a]/30 rounded-lg">
            <span className="text-sm font-medium text-[#d83f0a]">
              {selectedOrders.length} orders selected
            </span>
            <button
              onClick={() => handleBulkAction('mark-shipped')}
              className="text-sm text-[#d83f0a] hover:text-[#d66a0a]"
            >
              Mark as Shipped
            </button>
            <button
              onClick={() => handleBulkAction('export')}
              className="text-sm text-[#d83f0a] hover:text-[#d66a0a]"
            >
              Export
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className="text-sm text-red-500 hover:text-red-400"
            >
              Delete
            </button>
            <button
              onClick={() => setSelectedOrders([])}
              className="text-sm text-gray-400 hover:text-gray-300"
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div id="orders-table-container" className="bg-[#171717] border border-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table id="orders-table" className="w-full">
            <thead className="bg-[#0b0b0b]">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    id="select-all-orders-checkbox"
                    type="checkbox"
                    className="rounded bg-[#171717] border-gray-700"
                    checked={selectedOrders.length === paginatedOrders.length && paginatedOrders.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedOrders(paginatedOrders.map(o => o.id));
                      } else {
                        setSelectedOrders([]);
                      }
                    }}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Order Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-[#171717] divide-y divide-gray-800">
              {paginatedOrders.map((order) => (
                <tr key={order.id} id={`order-row-${order.id}`} className="hover:bg-[#1f1f1f]">
                  <td className="px-6 py-4">
                    <input
                      id={`order-checkbox-${order.id}`}
                      type="checkbox"
                      className="rounded bg-[#171717] border-gray-700"
                      checked={selectedOrders.includes(order.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedOrders([...selectedOrders, order.id]);
                        } else {
                          setSelectedOrders(selectedOrders.filter(id => id !== order.id));
                        }
                      }}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{order.orderNumber}</div>
                    {order.trackingNumber && (
                      <div className="text-xs text-gray-400">Track: {order.trackingNumber}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">{order.customer}</div>
                    <div className="text-xs text-gray-400">{order.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {order.items}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    ${order.total.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      id={`order-status-${order.id}`}
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#0b0b0b] border border-gray-700 text-white ${getStatusColor(order.status)}`}
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                      {order.paymentStatus}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{order.paymentMethod}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center space-x-2">
                      <button
                        id={`order-view-btn-${order.id}`}
                        onClick={() => setShowOrderDetails(order.id)}
                        className="text-[#d83f0a] hover:text-[#d66a0a]"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button id={`order-edit-btn-${order.id}`} className="text-gray-400 hover:text-white" title="Edit">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button id={`order-delete-btn-${order.id}`} className="text-red-500 hover:text-red-400" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div id="orders-pagination" className="px-6 py-4 border-t border-gray-800 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Showing {((currentPage - 1) * ordersPerPage) + 1} to {Math.min(currentPage * ordersPerPage, filteredOrders.length)} of {filteredOrders.length} orders
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0b0b0b]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 border border-gray-700 rounded-lg ${
                  currentPage === i + 1 ? 'bg-gradient-to-r from-[#d83f0a] to-[#d66a0a] text-white' : 'text-white hover:bg-[#0b0b0b]'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0b0b0b]"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div id="export-options-section" className="bg-[#171717] border border-gray-800 rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-white mb-3">Export Options</h3>
        <div className="flex space-x-4">
          <button id="export-csv-btn" className="px-4 py-2 border border-gray-700 rounded-lg text-white hover:bg-[#0b0b0b] flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export as CSV</span>
          </button>
          <button id="export-pdf-btn" className="px-4 py-2 border border-gray-700 rounded-lg text-white hover:bg-[#0b0b0b] flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export as PDF</span>
          </button>
          <button id="export-excel-btn" className="px-4 py-2 border border-gray-700 rounded-lg text-white hover:bg-[#0b0b0b] flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export as Excel</span>
          </button>
        </div>
      </div>
    </div>
  );
}