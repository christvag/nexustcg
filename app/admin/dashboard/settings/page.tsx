'use client';

import { useState } from 'react';
import {
  Save,
  Shield,
  Bell,
  Mail,
  Globe,
  Database,
  Server,
  Key,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  Upload
} from 'lucide-react';

export default function SettingsManagement() {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'Card Grading Hub',
    siteDescription: 'Professional card grading and authentication services',
    supportEmail: 'support@cardgradinghub.com',
    defaultLanguage: 'en',
    timezone: 'UTC',
    maintenanceMode: false,
    allowRegistration: true,
    requireEmailVerification: true
  });

  const [emailSettings, setEmailSettings] = useState({
    smtpHost: 'smtp.cardgradinghub.com',
    smtpPort: '587',
    smtpUsername: 'noreply@cardgradinghub.com',
    smtpPassword: '••••••••',
    fromName: 'Card Grading Hub',
    fromEmail: 'noreply@cardgradinghub.com',
    enableSsl: true
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    orderUpdates: true,
    systemAlerts: true,
    marketingEmails: false
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorRequired: false,
    passwordMinLength: 8,
    passwordRequireSpecial: true,
    passwordRequireNumbers: true,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    enableAuditLog: true
  });

  const [showPasswords, setShowPasswords] = useState({
    smtpPassword: false
  });

  const handleSave = async (section: string) => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    alert(`${section} settings saved successfully!`);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'payment', label: 'Payment', icon: Key },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'system', label: 'System', icon: Server }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Settings</h2>
        <p className="text-gray-400 mt-1">Manage system configuration and preferences</p>
      </div>

      {/* Tabs */}
      <div className="bg-gray-800 rounded-lg shadow border border-gray-700">
        <div className="border-b border-gray-700">
          <nav className="flex space-x-8 px-6 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-[#d83f0a] text-[#d83f0a]'
                      : 'border-transparent text-gray-400 hover:text-gray-200'
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
          {/* Payment Settings */}
          {activeTab === 'payment' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white">Payment Configuration</h3>
              <p className="text-gray-400">Configure payment gateways and processing settings.</p>

              <a
                href="/admin/dashboard/payment"
                className="inline-flex items-center px-6 py-3 bg-[#d83f0a] text-white rounded-lg hover:bg-[#b8350a] transition-colors"
              >
                <Key className="h-5 w-5 mr-2" />
                Open Payment Gateway Configuration
              </a>

              <div className="bg-gray-700/50 rounded-lg p-4 mt-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Quick Info</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Configure Stripe and PayPal payment gateways</li>
                  <li>• Set processing fees and test modes</li>
                  <li>• Manage webhook configurations</li>
                  <li>• Test gateway connections</li>
                </ul>
              </div>
            </div>
          )}

          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white">General Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Site Name
                  </label>
                  <input
                    type="text"
                    value={generalSettings.siteName}
                    onChange={(e) => setGeneralSettings({...generalSettings, siteName: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#d83f0a]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Support Email
                  </label>
                  <input
                    type="email"
                    value={generalSettings.supportEmail}
                    onChange={(e) => setGeneralSettings({...generalSettings, supportEmail: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#d83f0a]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Default Language
                  </label>
                  <select
                    value={generalSettings.defaultLanguage}
                    onChange={(e) => setGeneralSettings({...generalSettings, defaultLanguage: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#d83f0a]"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Timezone
                  </label>
                  <select
                    value={generalSettings.timezone}
                    onChange={(e) => setGeneralSettings({...generalSettings, timezone: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#d83f0a]"
                  >
                    <option value="UTC">UTC</option>
                    <option value="EST">Eastern Time</option>
                    <option value="PST">Pacific Time</option>
                    <option value="CST">Central Time</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Site Description
                </label>
                <textarea
                  rows={3}
                  value={generalSettings.siteDescription}
                  onChange={(e) => setGeneralSettings({...generalSettings, siteDescription: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#d83f0a]"
                />
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-white">User Registration</h4>
                
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={generalSettings.allowRegistration}
                      onChange={(e) => setGeneralSettings({...generalSettings, allowRegistration: e.target.checked})}
                      className="rounded mr-2"
                    />
                    <span className="text-sm text-gray-300">Allow new user registration</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={generalSettings.requireEmailVerification}
                      onChange={(e) => setGeneralSettings({...generalSettings, requireEmailVerification: e.target.checked})}
                      className="rounded mr-2"
                    />
                    <span className="text-sm text-gray-300">Require email verification</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={generalSettings.maintenanceMode}
                      onChange={(e) => setGeneralSettings({...generalSettings, maintenanceMode: e.target.checked})}
                      className="rounded mr-2"
                    />
                    <span className="text-sm text-gray-300">Maintenance mode</span>
                  </label>
                </div>
              </div>

              <button
                onClick={() => handleSave('General')}
                disabled={isSaving}
                className="bg-[#d83f0a] text-white px-6 py-2 rounded-lg hover:bg-[#b8350a] disabled:opacity-50 flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          )}

          {/* Email Settings */}
          {activeTab === 'email' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white">Email Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    value={emailSettings.smtpHost}
                    onChange={(e) => setEmailSettings({...emailSettings, smtpHost: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#d83f0a]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    SMTP Port
                  </label>
                  <input
                    type="text"
                    value={emailSettings.smtpPort}
                    onChange={(e) => setEmailSettings({...emailSettings, smtpPort: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#d83f0a]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    SMTP Username
                  </label>
                  <input
                    type="text"
                    value={emailSettings.smtpUsername}
                    onChange={(e) => setEmailSettings({...emailSettings, smtpUsername: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#d83f0a]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    SMTP Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.smtpPassword ? 'text' : 'password'}
                      value={emailSettings.smtpPassword}
                      onChange={(e) => setEmailSettings({...emailSettings, smtpPassword: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#d83f0a] pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({...showPasswords, smtpPassword: !showPasswords.smtpPassword})}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showPasswords.smtpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    From Name
                  </label>
                  <input
                    type="text"
                    value={emailSettings.fromName}
                    onChange={(e) => setEmailSettings({...emailSettings, fromName: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#d83f0a]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    From Email
                  </label>
                  <input
                    type="email"
                    value={emailSettings.fromEmail}
                    onChange={(e) => setEmailSettings({...emailSettings, fromEmail: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#d83f0a]"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={emailSettings.enableSsl}
                  onChange={(e) => setEmailSettings({...emailSettings, enableSsl: e.target.checked})}
                  className="rounded mr-2"
                />
                <span className="text-sm text-gray-300">Enable SSL/TLS encryption</span>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleSave('Email')}
                  disabled={isSaving}
                  className="bg-[#d83f0a] text-white px-6 py-2 rounded-lg hover:bg-[#b8350a] disabled:opacity-50 flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
                
                <button className="border border-gray-300 text-gray-300 px-6 py-2 rounded-lg hover:bg-gray-600 flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>Test Email</span>
                </button>
              </div>
            </div>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white">Notification Settings</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-white mb-3">Notification Methods</h4>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Email Notifications</span>
                      <input
                        type="checkbox"
                        checked={notificationSettings.emailNotifications}
                        onChange={(e) => setNotificationSettings({...notificationSettings, emailNotifications: e.target.checked})}
                        className="rounded"
                      />
                    </label>
                    
                    <label className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">SMS Notifications</span>
                      <input
                        type="checkbox"
                        checked={notificationSettings.smsNotifications}
                        onChange={(e) => setNotificationSettings({...notificationSettings, smsNotifications: e.target.checked})}
                        className="rounded"
                      />
                    </label>
                    
                    <label className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Push Notifications</span>
                      <input
                        type="checkbox"
                        checked={notificationSettings.pushNotifications}
                        onChange={(e) => setNotificationSettings({...notificationSettings, pushNotifications: e.target.checked})}
                        className="rounded"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-white mb-3">Notification Types</h4>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Order Updates</span>
                      <input
                        type="checkbox"
                        checked={notificationSettings.orderUpdates}
                        onChange={(e) => setNotificationSettings({...notificationSettings, orderUpdates: e.target.checked})}
                        className="rounded"
                      />
                    </label>
                    
                    <label className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">System Alerts</span>
                      <input
                        type="checkbox"
                        checked={notificationSettings.systemAlerts}
                        onChange={(e) => setNotificationSettings({...notificationSettings, systemAlerts: e.target.checked})}
                        className="rounded"
                      />
                    </label>
                    
                    <label className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Marketing Emails</span>
                      <input
                        type="checkbox"
                        checked={notificationSettings.marketingEmails}
                        onChange={(e) => setNotificationSettings({...notificationSettings, marketingEmails: e.target.checked})}
                        className="rounded"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleSave('Notification')}
                disabled={isSaving}
                className="bg-[#d83f0a] text-white px-6 py-2 rounded-lg hover:bg-[#b8350a] disabled:opacity-50 flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white">Security Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Minimum Password Length
                  </label>
                  <input
                    type="number"
                    min="6"
                    max="20"
                    value={securitySettings.passwordMinLength}
                    onChange={(e) => setSecuritySettings({...securitySettings, passwordMinLength: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#d83f0a]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Session Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="480"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#d83f0a]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Max Login Attempts
                  </label>
                  <input
                    type="number"
                    min="3"
                    max="10"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) => setSecuritySettings({...securitySettings, maxLoginAttempts: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#d83f0a]"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-white">Password Requirements</h4>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={securitySettings.passwordRequireSpecial}
                      onChange={(e) => setSecuritySettings({...securitySettings, passwordRequireSpecial: e.target.checked})}
                      className="rounded mr-2"
                    />
                    <span className="text-sm text-gray-300">Require special characters</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={securitySettings.passwordRequireNumbers}
                      onChange={(e) => setSecuritySettings({...securitySettings, passwordRequireNumbers: e.target.checked})}
                      className="rounded mr-2"
                    />
                    <span className="text-sm text-gray-300">Require numbers</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={securitySettings.twoFactorRequired}
                      onChange={(e) => setSecuritySettings({...securitySettings, twoFactorRequired: e.target.checked})}
                      className="rounded mr-2"
                    />
                    <span className="text-sm text-gray-300">Require two-factor authentication</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={securitySettings.enableAuditLog}
                      onChange={(e) => setSecuritySettings({...securitySettings, enableAuditLog: e.target.checked})}
                      className="rounded mr-2"
                    />
                    <span className="text-sm text-gray-300">Enable audit logging</span>
                  </label>
                </div>
              </div>

              <button
                onClick={() => handleSave('Security')}
                disabled={isSaving}
                className="bg-[#d83f0a] text-white px-6 py-2 rounded-lg hover:bg-[#b8350a] disabled:opacity-50 flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          )}

          {/* System Settings */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white">System Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-300">System Status</span>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600">Online</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">All services are running normally</div>
                  </div>

                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-300">Database Status</span>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600">Connected</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">Database connection is healthy</div>
                  </div>

                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-300">Storage Usage</span>
                      <span className="text-sm text-white">2.4 GB / 10 GB</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-[#d83f0a] h-2 rounded-full" style={{width: '24%'}}></div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-300 mb-2">System Information</div>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div>Version: 1.2.0</div>
                      <div>Build: 2024.01.15</div>
                      <div>Environment: Production</div>
                      <div>Uptime: 15 days, 8 hours</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button className="w-full px-4 py-2 border rounded-lg hover:bg-gray-600 flex items-center justify-center space-x-2">
                      <RefreshCw className="h-4 w-4" />
                      <span>Clear Cache</span>
                    </button>
                    
                    <button className="w-full px-4 py-2 border rounded-lg hover:bg-gray-600 flex items-center justify-center space-x-2">
                      <Download className="h-4 w-4" />
                      <span>Download Logs</span>
                    </button>
                    
                    <button className="w-full px-4 py-2 border rounded-lg hover:bg-gray-600 flex items-center justify-center space-x-2">
                      <Upload className="h-4 w-4" />
                      <span>Import Configuration</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}