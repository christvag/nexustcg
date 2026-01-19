'use client';

import { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Bell,
  CreditCard,
  Shield,
  Camera,
  Save,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Check,
  X,
  Star,
  Package
} from 'lucide-react';

interface ShippingAddress {
  id: string;
  type: 'home' | 'work' | 'other';
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
  isDefault: boolean;
}

export default function UserProfile() {
  const [activeTab, setActiveTab] = useState('profile');
  
  const [profileData, setProfileData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+1-555-0123',
    avatar: null,
    dateOfBirth: '1990-01-15',
    preferredLanguage: 'en',
    timezone: 'EST'
  });

  const [addresses, setAddresses] = useState<ShippingAddress[]>([
    {
      id: '1',
      type: 'home',
      firstName: 'John',
      lastName: 'Doe',
      address1: '123 Main Street',
      address2: 'Apt 4B',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'US',
      phone: '+1-555-0123',
      isDefault: true
    },
    {
      id: '2',
      type: 'work',
      firstName: 'John',
      lastName: 'Doe',
      company: 'Tech Corp Inc.',
      address1: '456 Business Ave',
      city: 'New York',
      state: 'NY',
      zipCode: '10002',
      country: 'US',
      isDefault: false
    }
  ]);

  const [notifications, setNotifications] = useState({
    emailMarketing: true,
    emailOrders: true,
    emailSupport: true,
    smsOrders: false,
    smsMarketing: false,
    pushNotifications: true
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<ShippingAddress | null>(null);
  
  const [stats] = useState({
    totalOrders: 15,
    totalSpent: 2456.78,
    memberSince: '2023-01-15',
    loyaltyTier: 'Gold'
  });

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Profile updated successfully!');
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Client-side validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    setPasswordLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          confirmPassword: passwordData.confirmPassword
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPasswordSuccess('Password changed successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setPasswordError(data.error || 'Failed to change password');
      }
    } catch (error) {
      setPasswordError('Network error. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Check if passwords match for real-time validation
  const passwordsMatch = passwordData.newPassword && passwordData.confirmPassword &&
    passwordData.newPassword === passwordData.confirmPassword;
  const passwordsMismatch = passwordData.newPassword && passwordData.confirmPassword &&
    passwordData.newPassword !== passwordData.confirmPassword;

  const handleAddressSubmit = (addressData: ShippingAddress) => {
    if (editingAddress) {
      setAddresses(addresses.map(addr => 
        addr.id === editingAddress.id ? addressData : addr
      ));
    } else {
      const newAddress = {
        ...addressData,
        id: Date.now().toString()
      };
      setAddresses([...addresses, newAddress]);
    }
    setShowAddressModal(false);
    setEditingAddress(null);
  };

  const handleDeleteAddress = (addressId: string) => {
    if (confirm('Are you sure you want to delete this address?')) {
      setAddresses(addresses.filter(addr => addr.id !== addressId));
    }
  };

  const setDefaultAddress = (addressId: string) => {
    setAddresses(addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === addressId
    })));
  };

  const AddressModal = () => {
    const [formData, setFormData] = useState<ShippingAddress>(
      editingAddress || {
        id: '',
        type: 'home',
        firstName: '',
        lastName: '',
        company: '',
        address1: '',
        address2: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'US',
        phone: '',
        isDefault: false
      }
    );

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleAddressSubmit(formData);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">
            {editingAddress ? 'Edit Address' : 'Add New Address'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address Type
              </label>
              <select
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value as any})}
              >
                <option value="home">Home</option>
                <option value="work">Work</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                />
              </div>
            </div>

            {formData.type === 'work' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.company || ''}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 1 *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.address1}
                onChange={(e) => setFormData({...formData, address1: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 2
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.address2 || ''}
                onChange={(e) => setFormData({...formData, address2: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country *
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.country}
                  onChange={(e) => setFormData({...formData, country: e.target.value})}
                >
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="UK">United Kingdom</option>
                  <option value="AU">Australia</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.phone || ''}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isDefault"
                className="rounded mr-2"
                checked={formData.isDefault}
                onChange={(e) => setFormData({...formData, isDefault: e.target.checked})}
              />
              <label htmlFor="isDefault" className="text-sm text-gray-700">
                Set as default address
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowAddressModal(false);
                  setEditingAddress(null);
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingAddress ? 'Update' : 'Add'} Address
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Profile Settings</h2>
          <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>{stats.totalOrders} orders</span>
          </div>
          <div className="flex items-center space-x-2">
            <Star className="h-4 w-4 text-yellow-500" />
            <span>{stats.loyaltyTier} member</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.totalOrders}</div>
          <div className="text-sm text-gray-600">Total Orders</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-green-600">${stats.totalSpent.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Total Spent</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.loyaltyTier}</div>
          <div className="text-sm text-gray-600">Loyalty Tier</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {Math.floor((Date.now() - new Date(stats.memberSince).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} yrs
          </div>
          <div className="text-sm text-gray-600">Member Since</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'profile', label: 'Profile Info', icon: User },
              { id: 'addresses', label: 'Addresses', icon: MapPin },
              { id: 'security', label: 'Security', icon: Lock },
              { id: 'notifications', label: 'Notifications', icon: Bell }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center space-x-6">
                <div className="h-24 w-24 bg-gray-200 rounded-full flex items-center justify-center">
                  {profileData.avatar ? (
                    <img src={profileData.avatar} alt="Profile" className="h-24 w-24 rounded-full object-cover" />
                  ) : (
                    <User className="h-12 w-12 text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Profile Picture</h3>
                  <p className="text-sm text-gray-500 mb-2">Upload a new profile picture</p>
                  <button
                    type="button"
                    className="flex items-center space-x-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    <Camera className="h-4 w-4" />
                    <span>Change Photo</span>
                  </button>
                </div>
              </div>

              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={profileData.dateOfBirth}
                    onChange={(e) => setProfileData({...profileData, dateOfBirth: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Language
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={profileData.preferredLanguage}
                    onChange={(e) => setProfileData({...profileData, preferredLanguage: e.target.value})}
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          )}

          {/* Addresses Tab */}
          {activeTab === 'addresses' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Shipping Addresses</h3>
                <button
                  onClick={() => setShowAddressModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Address</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((address) => (
                  <div key={address.id} className="border rounded-lg p-4 relative">
                    {address.isDefault && (
                      <div className="absolute top-2 right-2">
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                          Default
                        </span>
                      </div>
                    )}
                    
                    <div className="mb-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900 capitalize">{address.type}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>{address.firstName} {address.lastName}</div>
                        {address.company && <div>{address.company}</div>}
                        <div>{address.address1}</div>
                        {address.address2 && <div>{address.address2}</div>}
                        <div>{address.city}, {address.state} {address.zipCode}</div>
                        <div>{address.country}</div>
                        {address.phone && <div>{address.phone}</div>}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-sm">
                      {!address.isDefault && (
                        <button
                          onClick={() => setDefaultAddress(address.id)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          Set as Default
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditingAddress(address);
                          setShowAddressModal(true);
                        }}
                        className="text-gray-600 hover:text-gray-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(address.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div id="security-tab-content" className="space-y-6">
              <div>
                <h3 id="change-password-title" className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>

                {/* Error Message */}
                {passwordError && (
                  <div id="password-error-alert" className="mb-4 p-4 bg-red-100 border border-red-400 rounded-lg flex items-center space-x-2">
                    <X className="h-5 w-5 text-red-600" />
                    <p className="text-red-700 text-sm">{passwordError}</p>
                  </div>
                )}

                {/* Success Message */}
                {passwordSuccess && (
                  <div id="password-success-alert" className="mb-4 p-4 bg-green-100 border border-green-400 rounded-lg flex items-center space-x-2">
                    <Check className="h-5 w-5 text-green-600" />
                    <p className="text-green-700 text-sm">{passwordSuccess}</p>
                  </div>
                )}

                <form id="change-password-form" onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-1">
                      Current Password *
                    </label>
                    <div className="relative">
                      <input
                        id="current-password"
                        type={showPassword.current ? 'text' : 'password'}
                        required
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                      />
                      <button
                        id="toggle-current-password"
                        type="button"
                        onClick={() => setShowPassword({...showPassword, current: !showPassword.current})}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
                      New Password *
                    </label>
                    <div className="relative">
                      <input
                        id="new-password"
                        type={showPassword.new ? 'text' : 'password'}
                        required
                        minLength={6}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        placeholder="Minimum 6 characters"
                      />
                      <button
                        id="toggle-new-password"
                        type="button"
                        onClick={() => setShowPassword({...showPassword, new: !showPassword.new})}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordData.newPassword && passwordData.newPassword.length < 6 && (
                      <p id="password-length-warning" className="mt-1 text-sm text-amber-600">
                        Password must be at least 6 characters
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password *
                    </label>
                    <div className="relative">
                      <input
                        id="confirm-password"
                        type={showPassword.confirm ? 'text' : 'password'}
                        required
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 pr-10 ${
                          passwordsMismatch
                            ? 'border-red-400 focus:ring-red-500'
                            : passwordsMatch
                            ? 'border-green-400 focus:ring-green-500'
                            : 'focus:ring-blue-500'
                        }`}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        placeholder="Re-enter your new password"
                      />
                      <button
                        id="toggle-confirm-password"
                        type="button"
                        onClick={() => setShowPassword({...showPassword, confirm: !showPassword.confirm})}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {/* Real-time password match indicator */}
                    {passwordsMatch && (
                      <p id="passwords-match-indicator" className="mt-1 text-sm text-green-600 flex items-center space-x-1">
                        <Check className="h-4 w-4" />
                        <span>Passwords match</span>
                      </p>
                    )}
                    {passwordsMismatch && (
                      <p id="passwords-mismatch-indicator" className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                        <X className="h-4 w-4" />
                        <span>Passwords do not match</span>
                      </p>
                    )}
                  </div>

                  <button
                    id="update-password-btn"
                    type="submit"
                    disabled={passwordLoading || passwordsMismatch}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {passwordLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        <span>Update Password</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Two-Factor Authentication */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                    <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                  </div>
                  <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <span>Enable 2FA</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Notification Preferences</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <h4 className="font-medium text-gray-900">Order Updates</h4>
                    <p className="text-sm text-gray-500">Get notified about your order status</p>
                  </div>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded mr-2"
                        checked={notifications.emailOrders}
                        onChange={(e) => setNotifications({...notifications, emailOrders: e.target.checked})}
                      />
                      <span className="text-sm">Email</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded mr-2"
                        checked={notifications.smsOrders}
                        onChange={(e) => setNotifications({...notifications, smsOrders: e.target.checked})}
                      />
                      <span className="text-sm">SMS</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <h4 className="font-medium text-gray-900">Marketing Communications</h4>
                    <p className="text-sm text-gray-500">Receive promotions and product updates</p>
                  </div>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded mr-2"
                        checked={notifications.emailMarketing}
                        onChange={(e) => setNotifications({...notifications, emailMarketing: e.target.checked})}
                      />
                      <span className="text-sm">Email</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded mr-2"
                        checked={notifications.smsMarketing}
                        onChange={(e) => setNotifications({...notifications, smsMarketing: e.target.checked})}
                      />
                      <span className="text-sm">SMS</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <h4 className="font-medium text-gray-900">Support Messages</h4>
                    <p className="text-sm text-gray-500">Communication from our support team</p>
                  </div>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded mr-2"
                        checked={notifications.emailSupport}
                        onChange={(e) => setNotifications({...notifications, emailSupport: e.target.checked})}
                      />
                      <span className="text-sm">Email</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <h4 className="font-medium text-gray-900">Push Notifications</h4>
                    <p className="text-sm text-gray-500">Browser notifications for important updates</p>
                  </div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded mr-2"
                      checked={notifications.pushNotifications}
                      onChange={(e) => setNotifications({...notifications, pushNotifications: e.target.checked})}
                    />
                    <span className="text-sm">Enable</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                  <Save className="h-4 w-4" />
                  <span>Save Preferences</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddressModal && <AddressModal />}
    </div>
  );
}