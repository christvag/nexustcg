'use client';

import { useState, useEffect } from 'react';
import {
  DollarSign,
  Edit,
  Save,
  X,
  Package,
  Clock,
  Zap,
  CheckCircle,
  TrendingUp,
  Users,
  Calendar
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface ServicePackage {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  turnaroundTime: string;
  minimumCards?: number;
  isActive: boolean;
  popularity: number;
  lastUpdated: string;
}

export default function PackagePricingManagement() {
  const [packages, setPackages] = useState<ServicePackage[]>([
    {
      id: 'authentication',
      name: 'Authentication',
      price: 10,
      description: 'Basic card authentication service',
      features: ['Card Authentication', 'Basic Protection', 'Standard Report'],
      turnaroundTime: '3-5 business days',
      isActive: true,
      popularity: 25,
      lastUpdated: '2024-01-15T10:30:00Z'
    },
    {
      id: 'bulk',
      name: 'Bulk Grading',
      price: 12,
      description: 'Cost-effective grading for large quantities',
      features: ['Professional Grading', 'Bulk Pricing', 'Secure Storage', 'Digital Certificate'],
      turnaroundTime: '2-3 weeks',
      minimumCards: 50,
      isActive: true,
      popularity: 40,
      lastUpdated: '2024-01-14T14:20:00Z'
    },
    {
      id: 'standard',
      name: 'Standard',
      price: 15,
      description: 'Professional grading service',
      features: ['Professional Grading', 'Tamper-Evident Case', 'Digital Certificate', 'Insurance'],
      turnaroundTime: '7-10 business days',
      isActive: true,
      popularity: 55,
      lastUpdated: '2024-01-13T09:15:00Z'
    },
    {
      id: 'express',
      name: 'Express',
      price: 20,
      description: 'Fast-track grading service',
      features: ['Priority Processing', 'Professional Grading', 'Premium Case', 'Insurance', 'Express Shipping'],
      turnaroundTime: '3-5 business days',
      isActive: true,
      popularity: 30,
      lastUpdated: '2024-01-12T16:45:00Z'
    }
  ]);

  const [editingPackage, setEditingPackage] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ServicePackage>>({});

  // Mock data for charts
  const revenueData = [
    { month: 'Jan', Authentication: 2500, 'Bulk Grading': 4800, Standard: 8250, Express: 6000 },
    { month: 'Feb', Authentication: 3200, 'Bulk Grading': 5200, Standard: 9100, Express: 6800 },
    { month: 'Mar', Authentication: 2800, 'Bulk Grading': 5600, Standard: 8800, Express: 7200 },
    { month: 'Apr', Authentication: 3600, 'Bulk Grading': 6000, Standard: 9500, Express: 7800 },
    { month: 'May', Authentication: 3100, 'Bulk Grading': 5800, Standard: 9200, Express: 7400 },
    { month: 'Jun', Authentication: 3400, 'Bulk Grading': 6200, Standard: 9800, Express: 8000 },
  ];

  const popularityData = packages.map(pkg => ({
    name: pkg.name,
    popularity: pkg.popularity,
    price: pkg.price
  }));

  const handleStartEdit = (pkg: ServicePackage) => {
    setEditingPackage(pkg.id);
    setEditForm({ ...pkg });
  };

  const handleSaveEdit = async () => {
    if (!editingPackage || !editForm.id) return;

    // Update the package in state
    setPackages(packages.map(pkg => 
      pkg.id === editingPackage 
        ? { ...pkg, ...editForm, lastUpdated: new Date().toISOString() }
        : pkg
    ));

    // TODO: Save to database
    try {
      const response = await fetch('/api/admin/pricing', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm)
      });

      if (!response.ok) {
        console.error('Failed to save package pricing');
      }
    } catch (error) {
      console.error('Error saving package pricing:', error);
    }

    setEditingPackage(null);
    setEditForm({});
  };

  const handleCancelEdit = () => {
    setEditingPackage(null);
    setEditForm({});
  };

  const getPackageIcon = (packageId: string) => {
    switch (packageId) {
      case 'authentication':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'bulk':
        return <Package className="h-5 w-5 text-green-500" />;
      case 'standard':
        return <DollarSign className="h-5 w-5 text-purple-500" />;
      case 'express':
        return <Zap className="h-5 w-5 text-orange-500" />;
      default:
        return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Package Pricing Management</h2>
          <p className="text-gray-600">Manage your service package pricing and features</p>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Packages</p>
              <p className="text-2xl font-bold text-gray-900">{packages.filter(p => p.isActive).length}</p>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Price</p>
              <p className="text-2xl font-bold text-gray-900">
                ${(packages.reduce((sum, p) => sum + p.price, 0) / packages.length).toFixed(2)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Most Popular</p>
              <p className="text-2xl font-bold text-gray-900">
                {packages.find(p => p.popularity === Math.max(...packages.map(pkg => pkg.popularity)))?.name}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Price Range</p>
              <p className="text-2xl font-bold text-gray-900">
                ${Math.min(...packages.map(p => p.price))} - ${Math.max(...packages.map(p => p.price))}
              </p>
            </div>
            <Users className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Monthly Revenue by Package</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
            <Legend />
            <Bar dataKey="Authentication" stackId="a" fill="#3B82F6" />
            <Bar dataKey="Bulk Grading" stackId="a" fill="#10B981" />
            <Bar dataKey="Standard" stackId="a" fill="#8B5CF6" />
            <Bar dataKey="Express" stackId="a" fill="#F59E0B" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Package Management Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {packages.map((pkg) => (
          <div key={pkg.id} className="bg-white rounded-lg shadow border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getPackageIcon(pkg.id)}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {editingPackage === pkg.id ? (
                        <input
                          type="text"
                          value={editForm.name || ''}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="text-lg font-semibold border-b border-gray-300 focus:border-blue-500 outline-none bg-transparent"
                        />
                      ) : (
                        pkg.name
                      )}
                    </h3>
                    <p className="text-sm text-gray-500">{pkg.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {editingPackage === pkg.id ? (
                      <div className="flex items-center">
                        <span className="text-xl">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.price || ''}
                          onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) })}
                          className="w-20 text-2xl font-bold border-b border-gray-300 focus:border-blue-500 outline-none bg-transparent"
                        />
                      </div>
                    ) : (
                      `$${pkg.price.toFixed(2)}`
                    )}
                  </div>
                  <div className="text-sm text-gray-500">per card</div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>{pkg.turnaroundTime}</span>
                </div>
                {pkg.minimumCards && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Package className="h-4 w-4 mr-2" />
                    <span>Minimum {pkg.minimumCards} cards</span>
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  <span>{pkg.popularity}% popularity</span>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Features:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-xs text-gray-500">
                  Updated: {new Date(pkg.lastUpdated).toLocaleDateString()}
                </div>
                <div className="flex space-x-2">
                  {editingPackage === pkg.id ? (
                    <>
                      <button
                        onClick={handleSaveEdit}
                        className="flex items-center space-x-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        <Save className="h-3 w-3" />
                        <span>Save</span>
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                      >
                        <X className="h-3 w-3" />
                        <span>Cancel</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleStartEdit(pkg)}
                      className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      <Edit className="h-3 w-3" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Popularity Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Package Popularity vs Price</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={popularityData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="popularity" fill="#8884d8" name="Popularity %" />
            <Line yAxisId="right" type="monotone" dataKey="price" stroke="#82ca9d" strokeWidth={2} name="Price ($)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}