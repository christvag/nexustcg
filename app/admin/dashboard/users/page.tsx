'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  UserPlus,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Calendar,
  Shield,
  Crown,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  Lock,
  Check,
  X
} from 'lucide-react';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username?: string;
  phone?: string;
  role: 'user' | 'admin' | 'staff';
  isActive: boolean;
  emailVerified: boolean;
  totalOrders: number;
  totalSpent: number;
  lastLogin?: string;
  createdAt: string;
  avatar?: string;
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Password change state for editing users
  const [passwordChangeData, setPasswordChangeData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    phone: '',
    password: '',
    role: 'user',
    isActive: true,
    emailVerified: false
  });

  const usersPerPage = 10;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();

      if (response.ok && data.users) {
        // Map API data to component format
        const mappedUsers = data.users.map((user: any) => ({
          id: String(user.id),
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          username: user.username || null,
          phone: user.phone || null,
          role: user.role || 'user',
          isActive: Boolean(user.is_active),
          emailVerified: Boolean(user.email_verified),
          totalOrders: user.total_orders || 0,
          totalSpent: user.total_spent || 0,
          lastLogin: user.last_login,
          createdAt: user.created_at
        }));
        setUsers(mappedUsers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'staff':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'user':
        return <UserIcon className="h-4 w-4 text-gray-500" />;
      default:
        return <UserIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-yellow-100 text-yellow-800';
      case 'staff':
        return 'bg-blue-100 text-blue-800';
      case 'user':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusToggle = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const newStatus = !user.isActive;

    try {
      const response = await fetch(`/api/users?id=${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          first_name: user.firstName,
          last_name: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          is_active: newStatus ? 1 : 0,
          email_verified: user.emailVerified ? 1 : 0
        })
      });

      if (response.ok) {
        // Update local state
        setUsers(users.map(u =>
          u.id === userId ? { ...u, isActive: newStatus } : u
        ));
      } else {
        const data = await response.json();
        alert(`Failed to update user status: ${data.error}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update user status');
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin' | 'staff') => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    try {
      const response = await fetch(`/api/users?id=${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          first_name: user.firstName,
          last_name: user.lastName,
          email: user.email,
          phone: user.phone,
          role: newRole,
          is_active: user.isActive ? 1 : 0,
          email_verified: user.emailVerified ? 1 : 0
        })
      });

      if (response.ok) {
        // Update local state
        setUsers(users.map(u =>
          u.id === userId ? { ...u, role: newRole } : u
        ));
      } else {
        const data = await response.json();
        alert(`Failed to update user role: ${data.error}`);
      }
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    console.log('Delete button clicked for user ID:', userId);

    if (!confirm('Are you sure you want to delete this user? This will also delete all their orders and related data.')) {
      console.log('User cancelled deletion');
      return;
    }

    console.log('Sending DELETE request for user ID:', userId);

    try {
      const response = await fetch(`/api/users?id=${userId}`, {
        method: 'DELETE'
      });

      console.log('DELETE response status:', response.status);
      const data = await response.json();
      console.log('DELETE response data:', data);

      if (response.ok) {
        alert('✅ User deleted successfully!');
        console.log('Refreshing user list...');
        await fetchUsers(); // Refresh the list
        console.log('User list refreshed');
      } else {
        alert(`❌ Failed to delete user: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('❌ Network error: Failed to delete user');
    }
  };

  const handleCreateOrUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.firstName || !formData.lastName) {
      alert('Please fill in all required fields');
      return;
    }

    // For new users, password is required
    if (!editingUser && !formData.password) {
      alert('Password is required for new users');
      return;
    }

    try {
      const url = editingUser
        ? `/api/users?id=${editingUser.id}`
        : '/api/users';

      const method = editingUser ? 'PUT' : 'POST';

      const body: any = {
        email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone || null,
        role: formData.role,
        is_active: formData.isActive ? 1 : 0,
        email_verified: formData.emailVerified ? 1 : 0
      };

      // Only include password and username for new users
      if (!editingUser) {
        body.password = formData.password;
        body.username = formData.username;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        alert(editingUser ? 'User updated successfully' : 'User created successfully');
        setShowUserModal(false);
        setEditingUser(null);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          username: '',
          phone: '',
          password: '',
          role: 'user',
          isActive: true,
          emailVerified: false
        });
        fetchUsers(); // Refresh the list
      } else {
        alert(`Failed to ${editingUser ? 'update' : 'create'} user: ${data.error}`);
      }
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Failed to save user');
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) {
      alert('Please select users first');
      return;
    }

    switch (action) {
      case 'activate':
        setUsers(users.map(user =>
          selectedUsers.includes(user.id) ? { ...user, isActive: true } : user
        ));
        break;
      case 'deactivate':
        setUsers(users.map(user =>
          selectedUsers.includes(user.id) ? { ...user, isActive: false } : user
        ));
        break;
      case 'delete':
        if (confirm(`Are you sure you want to delete ${selectedUsers.length} user(s)? This will also delete all their orders and related data.`)) {
          console.log('Bulk deleting users:', selectedUsers);

          try {
            // Delete each user via API
            const deletePromises = selectedUsers.map(userId =>
              fetch(`/api/users?id=${userId}`, { method: 'DELETE' })
            );

            const responses = await Promise.all(deletePromises);
            const successCount = responses.filter(r => r.ok).length;
            const failCount = responses.length - successCount;

            if (failCount === 0) {
              alert(`✅ Successfully deleted ${successCount} user(s)`);
            } else {
              alert(`⚠️ Deleted ${successCount} user(s), failed to delete ${failCount} user(s)`);
            }

            // Refresh the user list
            await fetchUsers();
          } catch (error) {
            console.error('Bulk delete error:', error);
            alert('❌ Error deleting users');
          }
        }
        break;
      case 'send-email':
        alert(`Sending email to ${selectedUsers.length} users`);
        break;
    }
    setSelectedUsers([]);
  };

  // Handle admin password change for a user
  const handleAdminPasswordChange = async () => {
    if (!editingUser) return;

    setPasswordChangeError('');
    setPasswordChangeSuccess('');

    // Validate passwords match
    if (passwordChangeData.newPassword !== passwordChangeData.confirmPassword) {
      setPasswordChangeError('Passwords do not match');
      return;
    }

    // Validate password length
    if (passwordChangeData.newPassword.length < 6) {
      setPasswordChangeError('Password must be at least 6 characters');
      return;
    }

    setPasswordChangeLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/users/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: editingUser.id,
          newPassword: passwordChangeData.newPassword,
          confirmPassword: passwordChangeData.confirmPassword
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPasswordChangeSuccess('Password changed successfully!');
        setPasswordChangeData({ newPassword: '', confirmPassword: '' });
      } else {
        setPasswordChangeError(data.error || 'Failed to change password');
      }
    } catch (error) {
      setPasswordChangeError('Network error. Please try again.');
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  // Reset password change state
  const resetPasswordChangeState = () => {
    setPasswordChangeData({ newPassword: '', confirmPassword: '' });
    setPasswordChangeError('');
    setPasswordChangeSuccess('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  // Check if passwords match for real-time validation
  const adminPasswordsMatch = passwordChangeData.newPassword && passwordChangeData.confirmPassword &&
    passwordChangeData.newPassword === passwordChangeData.confirmPassword;
  const adminPasswordsMismatch = passwordChangeData.newPassword && passwordChangeData.confirmPassword &&
    passwordChangeData.newPassword !== passwordChangeData.confirmPassword;

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.isActive) ||
                         (filterStatus === 'inactive' && !user.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  return (
    <div className="p-6 bg-[#0b0b0b] min-h-screen">
      {/* User Modal */}
      {showUserModal && (
    <div id="user-modal-overlay" className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div id="user-modal-container" className="bg-[#171717] rounded-lg p-6 w-full max-w-md border border-gray-800 max-h-[90vh] overflow-y-auto">
        <h3 id="user-modal-title" className="text-lg font-semibold mb-4 text-white">
          {editingUser ? 'Edit User' : 'Add New User'}
        </h3>

        <form id="user-form" className="space-y-4" onSubmit={handleCreateOrUpdateUser}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                First Name <span className="text-[#d83f0a]">*</span>
              </label>
              <input
                id="user-form-firstname"
                type="text"
                required
                autoComplete="given-name"
                className="w-full px-3 py-2 bg-[#0b0b0b] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#d83f0a] focus:border-transparent"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Last Name <span className="text-[#d83f0a]">*</span>
              </label>
              <input
                id="user-form-lastname"
                type="text"
                required
                autoComplete="family-name"
                className="w-full px-3 py-2 bg-[#0b0b0b] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d83f0a] focus:border-transparent"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Email <span className="text-[#d83f0a]">*</span>
            </label>
            <input
              id="user-form-email"
              type="email"
              required
              autoComplete="email"
              className="w-full px-3 py-2 bg-[#0b0b0b] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d83f0a] focus:border-transparent"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>

          {!editingUser && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Username <span className="text-[#d83f0a]">*</span>
              </label>
              <input
                id="user-form-username"
                type="text"
                required
                minLength={3}
                autoComplete="username"
                className="w-full px-3 py-2 bg-[#0b0b0b] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d83f0a] focus:border-transparent"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Minimum 3 characters"
              />
            </div>
          )}

          {!editingUser && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Password <span className="text-[#d83f0a]">*</span>
              </label>
              <div className="relative">
                <input
                  id="user-form-password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Minimum 6 characters"
                />
                <button
                  id="toggle-password-visibility"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Phone
            </label>
            <input
              id="user-form-phone"
              type="tel"
              autoComplete="tel"
              className="w-full px-3 py-2 bg-[#0b0b0b] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d83f0a] focus:border-transparent"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Role
            </label>
            <select
              id="user-form-role"
              className="w-full px-3 py-2 bg-[#0b0b0b] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d83f0a] focus:border-transparent"
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
            >
              <option value="user">User</option>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              id="user-form-cancel-btn"
              type="button"
              onClick={() => {
                setShowUserModal(false);
                setEditingUser(null);
                resetPasswordChangeState();
                setFormData({
                  firstName: '',
                  lastName: '',
                  email: '',
                  username: '',
                  phone: '',
                  password: '',
                  role: 'user',
                  isActive: true,
                  emailVerified: false
                });
              }}
              className="px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-[#0b0b0b]"
            >
              Cancel
            </button>
            <button
              id="user-form-submit-btn"
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-[#d83f0a] to-[#d66a0a] text-white rounded-lg hover:opacity-90"
            >
              {editingUser ? 'Update' : 'Create'} User
            </button>
          </div>
        </form>

        {/* Password Change Section - Only shown when editing */}
        {editingUser && (
          <div id="admin-password-change-section" className="mt-6 pt-6 border-t border-gray-700">
            <h4 id="admin-password-change-title" className="text-md font-semibold text-white mb-4 flex items-center space-x-2">
              <Lock className="h-4 w-4" />
              <span>Change User Password</span>
            </h4>

            {/* Password Change Error */}
            {passwordChangeError && (
              <div id="admin-password-error" className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg flex items-center space-x-2">
                <X className="h-4 w-4 text-red-400" />
                <p className="text-red-400 text-sm">{passwordChangeError}</p>
              </div>
            )}

            {/* Password Change Success */}
            {passwordChangeSuccess && (
              <div id="admin-password-success" className="mb-4 p-3 bg-green-900/30 border border-green-700 rounded-lg flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-400" />
                <p className="text-green-400 text-sm">{passwordChangeSuccess}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="admin-new-password" className="block text-sm font-medium text-gray-300 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="admin-new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    className="w-full px-3 py-2 pr-10 bg-[#0b0b0b] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d83f0a] focus:border-transparent"
                    value={passwordChangeData.newPassword}
                    onChange={(e) => setPasswordChangeData(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Minimum 6 characters"
                  />
                  <button
                    id="toggle-admin-new-password"
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordChangeData.newPassword && passwordChangeData.newPassword.length < 6 && (
                  <p className="mt-1 text-sm text-amber-500">Password must be at least 6 characters</p>
                )}
              </div>

              <div>
                <label htmlFor="admin-confirm-password" className="block text-sm font-medium text-gray-300 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="admin-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    className={`w-full px-3 py-2 pr-10 bg-[#0b0b0b] border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent ${
                      adminPasswordsMismatch
                        ? 'border-red-500 focus:ring-red-500'
                        : adminPasswordsMatch
                        ? 'border-green-500 focus:ring-green-500'
                        : 'border-gray-700 focus:ring-[#d83f0a]'
                    }`}
                    value={passwordChangeData.confirmPassword}
                    onChange={(e) => setPasswordChangeData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Re-enter new password"
                  />
                  <button
                    id="toggle-admin-confirm-password"
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {/* Real-time password match indicator */}
                {adminPasswordsMatch && (
                  <p id="admin-passwords-match" className="mt-1 text-sm text-green-400 flex items-center space-x-1">
                    <Check className="h-4 w-4" />
                    <span>Passwords match</span>
                  </p>
                )}
                {adminPasswordsMismatch && (
                  <p id="admin-passwords-mismatch" className="mt-1 text-sm text-red-400 flex items-center space-x-1">
                    <X className="h-4 w-4" />
                    <span>Passwords do not match</span>
                  </p>
                )}
              </div>

              <button
                id="admin-change-password-btn"
                type="button"
                onClick={handleAdminPasswordChange}
                disabled={passwordChangeLoading || adminPasswordsMismatch || !passwordChangeData.newPassword || !passwordChangeData.confirmPassword}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {passwordChangeLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Changing Password...</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    <span>Change Password</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white">Users Management</h2>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading users...</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!isLoading && (
        <div id="users-management-container" className="space-y-6">
      {/* Header */}
      <div id="users-header" className="flex justify-between items-center">
        <h2 id="users-title" className="text-2xl font-bold text-white">Users Management</h2>
        <button
          id="add-user-button"
          onClick={() => setShowUserModal(true)}
          className="bg-gradient-to-r from-[#d83f0a] to-[#d66a0a] text-white px-4 py-2 rounded-lg hover:opacity-90 flex items-center space-x-2"
        >
          <UserPlus className="h-5 w-5" />
          <span>Add User</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div id="users-stats-cards" className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div id="stat-total-users" className="bg-[#171717] rounded-lg border border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-white">{users.length}</p>
            </div>
            <UserIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div id="stat-active-users" className="bg-[#171717] rounded-lg border border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-green-600">{users.filter(u => u.isActive).length}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div id="stat-admins" className="bg-[#171717] rounded-lg border border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Admins</p>
              <p className="text-2xl font-bold text-yellow-600">{users.filter(u => u.role === 'admin').length}</p>
            </div>
            <Crown className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div id="stat-verified-users" className="bg-[#171717] rounded-lg border border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Verified Users</p>
              <p className="text-2xl font-bold text-purple-600">{users.filter(u => u.emailVerified).length}</p>
            </div>
            <Mail className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div id="users-filters-section" className="bg-[#171717] rounded-lg border border-gray-800 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="user-search-input"
                type="text"
                placeholder="Search users by name or email..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <select
            id="filter-role-select"
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="user">Users</option>
            <option value="staff">Staff</option>
            <option value="admin">Admins</option>
          </select>

          <select
            id="filter-status-select"
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="mt-4 flex items-center space-x-4 p-3 bg-blue-50 rounded-lg">
            <span className="text-sm font-medium text-blue-900">
              {selectedUsers.length} users selected
            </span>
            <button
              onClick={() => handleBulkAction('activate')}
              className="text-sm text-green-600 hover:text-green-800"
            >
              Activate
            </button>
            <button
              onClick={() => handleBulkAction('deactivate')}
              className="text-sm text-orange-600 hover:text-orange-800"
            >
              Deactivate
            </button>
            <button
              onClick={() => handleBulkAction('send-email')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Send Email
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Delete
            </button>
            <button
              onClick={() => setSelectedUsers([])}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div id="users-table-section" className="bg-[#171717] rounded-lg border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table id="users-table" className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    id="select-all-users-checkbox"
                    type="checkbox"
                    className="rounded"
                    checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(paginatedUsers.map(u => u.id));
                      } else {
                        setSelectedUsers([]);
                      }
                    }}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders & Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-[#171717] divide-y divide-gray-800">
              {paginatedUsers.map((user) => (
                <tr key={user.id} id={`user-row-${user.id}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      id={`user-checkbox-${user.id}`}
                      type="checkbox"
                      className="rounded"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, user.id]);
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                        }
                      }}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {user.firstName[0]}{user.lastName[0]}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          Joined {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-white mb-1">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      {user.email}
                      {user.emailVerified && <CheckCircle className="h-3 w-3 ml-1 text-green-500" />}
                    </div>
                    {user.phone && (
                      <div className="flex items-center text-xs text-gray-500">
                        <Phone className="h-3 w-3 mr-2" />
                        {user.phone}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <select
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getRoleBadgeClass(user.role)}`}
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                      >
                        <option value="user">User</option>
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleStatusToggle(user.id)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.isActive ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <Ban className="h-3 w-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    <div>{user.totalOrders} orders</div>
                    <div className="text-xs text-gray-500">${user.totalSpent.toFixed(2)} spent</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center space-x-2">
                      <button
                        id={`user-edit-btn-${user.id}`}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setEditingUser(user);
                          setFormData({
                            firstName: user.firstName,
                            lastName: user.lastName,
                            email: user.email,
                            username: user.username || '',
                            phone: user.phone || '',
                            password: '',
                            role: user.role,
                            isActive: user.isActive,
                            emailVerified: user.emailVerified
                          });
                          setShowUserModal(true);
                        }}
                        className="text-gray-600 hover:text-white"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        id={`user-delete-btn-${user.id}`}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteUser(user.id);
                        }}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
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
        <div className="px-6 py-4 border-t flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {((currentPage - 1) * usersPerPage) + 1} to {Math.min(currentPage * usersPerPage, filteredUsers.length)} of {filteredUsers.length} users
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 border rounded-lg ${
                  currentPage === i + 1 ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
        </div>
      )}
    </div>
  );
}