'use client';

import { useState, useEffect } from 'react';
import { MapPin, Plus, Edit, Trash2, Star } from 'lucide-react';

interface Address {
  id: string;
  type: 'shipping' | 'billing';
  name: string;
  firstName: string;
  lastName: string;
  company?: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      // Mock data - replace with actual API call
      setTimeout(() => {
        setAddresses([
          {
            id: 'ADDR-001',
            type: 'shipping',
            name: 'Home Address',
            firstName: 'John',
            lastName: 'Doe',
            street: '123 Main Street',
            apartment: 'Apt 2B',
            city: 'Anytown',
            state: 'California',
            zipCode: '12345',
            country: 'United States',
            phone: '+1 (555) 123-4567',
            isDefault: true
          },
          {
            id: 'ADDR-002',
            type: 'billing',
            name: 'Work Address',
            firstName: 'John',
            lastName: 'Doe',
            company: 'ABC Corp',
            street: '456 Business Avenue',
            apartment: 'Suite 100',
            city: 'Business City',
            state: 'California',
            zipCode: '67890',
            country: 'United States',
            phone: '+1 (555) 987-6543',
            isDefault: false
          }
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const addressData = {
      type: formData.get('type') as 'shipping' | 'billing',
      name: formData.get('name') as string,
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      company: formData.get('company') as string,
      street: formData.get('street') as string,
      apartment: formData.get('apartment') as string,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      zipCode: formData.get('zipCode') as string,
      country: formData.get('country') as string,
      phone: formData.get('phone') as string,
      isDefault: formData.get('isDefault') === 'on'
    };

    try {
      if (editingAddress) {
        // Update existing address
        setAddresses(prev => 
          prev.map(addr => 
            addr.id === editingAddress.id 
              ? { ...addressData, id: editingAddress.id }
              : addressData.isDefault ? { ...addr, isDefault: false } : addr
          )
        );
        setEditingAddress(null);
      } else {
        // Add new address
        const newAddress = {
          ...addressData,
          id: `ADDR-${Date.now()}`
        };

        if (addressData.isDefault) {
          setAddresses(prev => [
            ...prev.map(addr => ({ ...addr, isDefault: false })),
            newAddress
          ]);
        } else {
          setAddresses(prev => [...prev, newAddress]);
        }
      }
      
      setIsAddingAddress(false);
    } catch (error) {
      console.error('Failed to save address:', error);
    }
  };

  const deleteAddress = async (addressId: string) => {
    if (confirm('Are you sure you want to delete this address?')) {
      setAddresses(prev => prev.filter(addr => addr.id !== addressId));
    }
  };

  const setDefaultAddress = async (addressId: string) => {
    setAddresses(prev => 
      prev.map(addr => ({
        ...addr,
        isDefault: addr.id === addressId
      }))
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Addresses</h1>
          <p className="text-gray-600">Manage your shipping and billing addresses</p>
        </div>
        <button
          onClick={() => setIsAddingAddress(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Add Address</span>
        </button>
      </div>

      {/* Address List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {addresses.map((address) => (
          <div key={address.id} className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-gray-400" />
                <h3 className="font-semibold text-gray-900">{address.name}</h3>
                {address.isDefault && (
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                )}
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                address.type === 'shipping' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {address.type}
              </span>
            </div>

            <div className="space-y-1 text-sm text-gray-600 mb-4">
              <p className="font-medium text-gray-900">
                {address.firstName} {address.lastName}
              </p>
              {address.company && <p>{address.company}</p>}
              <p>{address.street}</p>
              {address.apartment && <p>{address.apartment}</p>}
              <p>{address.city}, {address.state} {address.zipCode}</p>
              <p>{address.country}</p>
              <p>{address.phone}</p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setEditingAddress(address)}
                className="flex items-center space-x-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => deleteAddress(address.id)}
                className="flex items-center space-x-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
              {!address.isDefault && (
                <button
                  onClick={() => setDefaultAddress(address.id)}
                  className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                >
                  <Star className="h-4 w-4" />
                  <span>Set Default</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Address Modal */}
      {(isAddingAddress || editingAddress) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Type
                  </label>
                  <select
                    name="type"
                    defaultValue={editingAddress?.type || 'shipping'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="shipping">Shipping</option>
                    <option value="billing">Billing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingAddress?.name || ''}
                    placeholder="e.g., Home, Work"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    defaultValue={editingAddress?.firstName || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    defaultValue={editingAddress?.lastName || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company (optional)
                </label>
                <input
                  type="text"
                  name="company"
                  defaultValue={editingAddress?.company || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address
                </label>
                <input
                  type="text"
                  name="street"
                  defaultValue={editingAddress?.street || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apartment/Suite (optional)
                </label>
                <input
                  type="text"
                  name="apartment"
                  defaultValue={editingAddress?.apartment || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    defaultValue={editingAddress?.city || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    defaultValue={editingAddress?.state || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    defaultValue={editingAddress?.zipCode || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <select
                    name="country"
                    defaultValue={editingAddress?.country || 'United States'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="Mexico">Mexico</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    defaultValue={editingAddress?.phone || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isDefault"
                  defaultChecked={editingAddress?.isDefault || false}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Set as default address
                </label>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingAddress(false);
                    setEditingAddress(null);
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingAddress ? 'Update Address' : 'Add Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}