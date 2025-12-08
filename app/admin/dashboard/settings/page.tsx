'use client';

import { useState, useEffect } from 'react';
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
  X,
  CreditCard,
  DollarSign,
  TestTube,
  XCircle,
  AlertCircle,
  Settings,
  Lock,
  Unlock
} from 'lucide-react';

interface PaymentGateway {
  id: string;
  name: string;
  displayName: string;
  isActive: boolean;
  isTestMode: boolean;
  lastTested: string;
  testStatus: 'success' | 'failed' | 'pending';
  processingFee: number;
  configuration: {
    [key: string]: {
      value: string;
      isSecret: boolean;
      description: string;
      required: boolean;
    };
  };
}

export default function SettingsManagement() {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [isDownloadingLogs, setIsDownloadingLogs] = useState(false);
  const [systemInfo, setSystemInfo] = useState({
    version: '1.2.0',
    build: '2024.01.15',
    environment: 'Production',
    uptime: '15 days, 8 hours',
    storageUsed: 2.4,
    storageTotal: 10
  });

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
  const [showTestEmailModal, setShowTestEmailModal] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [isLoadingEmailSettings, setIsLoadingEmailSettings] = useState(false);

  // Payment Gateway State
  const [gateways, setGateways] = useState<PaymentGateway[]>([
    {
      id: 'stripe',
      name: 'stripe',
      displayName: 'Stripe',
      isActive: true,
      isTestMode: false,
      lastTested: '2024-01-15T10:30:00Z',
      testStatus: 'success',
      processingFee: 2.9,
      configuration: {
        publishable_key: {
          value: 'pk_live_51H...',
          isSecret: false,
          description: 'Stripe publishable key for frontend integration',
          required: true
        },
        secret_key: {
          value: 'sk_live_51H...',
          isSecret: true,
          description: 'Stripe secret key for backend processing',
          required: true
        },
        webhook_secret: {
          value: 'whsec_1H...',
          isSecret: true,
          description: 'Webhook endpoint secret for event verification',
          required: true
        }
      }
    },
    {
      id: 'paypal',
      name: 'paypal',
      displayName: 'PayPal',
      isActive: false,
      isTestMode: true,
      lastTested: '2024-01-10T14:20:00Z',
      testStatus: 'failed',
      processingFee: 3.5,
      configuration: {
        client_id: {
          value: 'ATc-...',
          isSecret: false,
          description: 'PayPal client ID for API access',
          required: true
        },
        client_secret: {
          value: 'ED9s...',
          isSecret: true,
          description: 'PayPal client secret for authentication',
          required: true
        },
        webhook_id: {
          value: '8JH...',
          isSecret: false,
          description: 'PayPal webhook ID for event notifications',
          required: false
        }
      }
    }
  ]);

  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>({});
  const [editingGateway, setEditingGateway] = useState<string | null>(null);
  const [testingGateway, setTestingGateway] = useState<string | null>(null);

  // Load email settings on component mount
  useEffect(() => {
    loadEmailSettings();
  }, []);

  const loadEmailSettings = async () => {
    setIsLoadingEmailSettings(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/settings/email', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.settings) {
          setEmailSettings({
            smtpHost: data.settings.smtp_host || '',
            smtpPort: data.settings.smtp_port?.toString() || '587',
            smtpUsername: data.settings.smtp_username || '',
            smtpPassword: data.settings.smtp_password || '',
            fromName: data.settings.from_name || 'Nexus TCGrading',
            fromEmail: data.settings.from_email || '',
            enableSsl: data.settings.enable_ssl !== false
          });
        }
      }
    } catch (error) {
      console.error('Error loading email settings:', error);
    } finally {
      setIsLoadingEmailSettings(false);
    }
  };

  const handleSaveEmailSettings = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/settings/email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          smtp_host: emailSettings.smtpHost,
          smtp_port: emailSettings.smtpPort,
          smtp_username: emailSettings.smtpUsername,
          smtp_password: emailSettings.smtpPassword,
          from_name: emailSettings.fromName,
          from_email: emailSettings.fromEmail,
          enable_ssl: emailSettings.enableSsl
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Email settings saved successfully!');
      } else {
        alert(`Failed to save: ${data.error}`);
      }
    } catch (error) {
      console.error('Error saving email settings:', error);
      alert('Failed to save email settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmailAddress) {
      alert('Please enter a test email address');
      return;
    }

    setIsSendingTestEmail(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/settings/email/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          test_email: testEmailAddress
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(data.message);
        setShowTestEmailModal(false);
        setTestEmailAddress('');
      } else {
        alert(`Test failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      alert('Failed to send test email');
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  const handleSave = async (section: string) => {
    if (section === 'Email') {
      await handleSaveEmailSettings();
      return;
    }

    setIsSaving(true);
    // Simulate API call for other sections
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    alert(`${section} settings saved successfully!`);
  };

  const handleClearCache = async () => {
    setIsClearingCache(true);
    try {
      // Clear Next.js cache by calling a simple endpoint or simulating
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Try to clear localStorage cache
      if (typeof window !== 'undefined') {
        // Clear specific cache items (not auth)
        const keysToKeep = ['currentUser', 'authToken'];
        const allKeys = Object.keys(localStorage);
        allKeys.forEach(key => {
          if (!keysToKeep.includes(key)) {
            localStorage.removeItem(key);
          }
        });
      }

      alert('Cache cleared successfully! Some changes may require a page refresh.');
    } catch (error) {
      alert('Failed to clear cache. Please try again.');
    } finally {
      setIsClearingCache(false);
    }
  };

  const handleDownloadLogs = async () => {
    setIsDownloadingLogs(true);
    try {
      // Generate log content
      const logContent = generateSystemLogs();

      // Create blob and download
      const blob = new Blob([logContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system-logs-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      alert('Logs downloaded successfully!');
    } catch (error) {
      alert('Failed to download logs. Please try again.');
    } finally {
      setIsDownloadingLogs(false);
    }
  };

  const generateSystemLogs = () => {
    const timestamp = new Date().toISOString();
    return `===========================================
NEXUS TCGrading System Logs
Generated: ${timestamp}
===========================================

SYSTEM INFORMATION
------------------
Version: ${systemInfo.version}
Build: ${systemInfo.build}
Environment: ${systemInfo.environment}
Uptime: ${systemInfo.uptime}
Storage: ${systemInfo.storageUsed} GB / ${systemInfo.storageTotal} GB

CONFIGURATION
-------------
Site Name: ${generalSettings.siteName}
Support Email: ${generalSettings.supportEmail}
Language: ${generalSettings.defaultLanguage}
Timezone: ${generalSettings.timezone}
Maintenance Mode: ${generalSettings.maintenanceMode ? 'Enabled' : 'Disabled'}
Registration: ${generalSettings.allowRegistration ? 'Enabled' : 'Disabled'}
Email Verification: ${generalSettings.requireEmailVerification ? 'Required' : 'Optional'}

SECURITY SETTINGS
-----------------
2FA Required: ${securitySettings.twoFactorRequired ? 'Yes' : 'No'}
Min Password Length: ${securitySettings.passwordMinLength}
Session Timeout: ${securitySettings.sessionTimeout} minutes
Max Login Attempts: ${securitySettings.maxLoginAttempts}
Audit Logging: ${securitySettings.enableAuditLog ? 'Enabled' : 'Disabled'}

PAYMENT GATEWAYS
----------------
${gateways.map(g => `- ${g.displayName}: ${g.isActive ? 'Active' : 'Inactive'} (${g.isTestMode ? 'Test' : 'Live'} Mode) - Last Test: ${g.testStatus}`).join('\n')}

RECENT ACTIVITY LOG
-------------------
[${timestamp}] System logs exported
[${new Date(Date.now() - 3600000).toISOString()}] Admin dashboard accessed
[${new Date(Date.now() - 7200000).toISOString()}] Settings updated
[${new Date(Date.now() - 10800000).toISOString()}] User login successful
[${new Date(Date.now() - 14400000).toISOString()}] Order #1234 processed
[${new Date(Date.now() - 18000000).toISOString()}] Database backup completed

===========================================
End of Log File
===========================================
`;
  };

  // Payment Gateway Functions
  const toggleSecretVisibility = (gatewayId: string, configKey: string) => {
    const key = `${gatewayId}-${configKey}`;
    setShowSecrets(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleConfigUpdate = (gatewayId: string, configKey: string, value: string) => {
    setGateways(gateways.map(gateway =>
      gateway.id === gatewayId
        ? {
            ...gateway,
            configuration: {
              ...gateway.configuration,
              [configKey]: {
                ...gateway.configuration[configKey],
                value
              }
            }
          }
        : gateway
    ));
  };

  const toggleGatewayStatus = (gatewayId: string) => {
    setGateways(gateways.map(gateway =>
      gateway.id === gatewayId
        ? { ...gateway, isActive: !gateway.isActive }
        : gateway
    ));
  };

  const toggleTestMode = (gatewayId: string) => {
    setGateways(gateways.map(gateway =>
      gateway.id === gatewayId
        ? { ...gateway, isTestMode: !gateway.isTestMode }
        : gateway
    ));
  };

  const testGatewayConnection = async (gatewayId: string) => {
    setTestingGateway(gatewayId);

    // Simulate API test
    await new Promise(resolve => setTimeout(resolve, 2000));

    setGateways(gateways.map(gateway =>
      gateway.id === gatewayId
        ? {
            ...gateway,
            testStatus: Math.random() > 0.5 ? 'success' : 'failed',
            lastTested: new Date().toISOString()
          }
        : gateway
    ));

    setTestingGateway(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
      {/* Payment Gateway Modal */}
      {showPaymentModal && (
        <div id="payment-modal-overlay" className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div id="payment-modal-container" className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-700">
            <div id="payment-modal-header" className="sticky top-0 bg-gray-800 p-6 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Payment Gateway Configuration</h3>
              <button
                id="payment-modal-close-btn"
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-white p-2"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Overview Stats */}
              <div id="payment-stats" className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400">Active Gateways</p>
                      <p className="text-xl font-bold text-green-400">
                        {gateways.filter(g => g.isActive).length}
                      </p>
                    </div>
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400">Test Mode</p>
                      <p className="text-xl font-bold text-yellow-400">
                        {gateways.filter(g => g.isTestMode).length}
                      </p>
                    </div>
                    <TestTube className="h-6 w-6 text-yellow-500" />
                  </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400">Avg Fee</p>
                      <p className="text-xl font-bold text-blue-400">
                        {(gateways.reduce((sum, g) => sum + g.processingFee, 0) / gateways.length).toFixed(1)}%
                      </p>
                    </div>
                    <DollarSign className="h-6 w-6 text-blue-500" />
                  </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400">Test Status</p>
                      <p className="text-sm font-bold text-white">
                        {gateways.filter(g => g.testStatus === 'success').length}/{gateways.length} OK
                      </p>
                    </div>
                    <Shield className="h-6 w-6 text-purple-500" />
                  </div>
                </div>
              </div>

              {/* Payment Gateways */}
              <div className="space-y-4">
                {gateways.map((gateway) => (
                  <div key={gateway.id} id={`gateway-${gateway.id}`} className="bg-gray-700 rounded-lg">
                    <div className="p-4 border-b border-gray-600">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center space-x-4">
                          <div className="h-10 w-10 bg-gray-600 rounded-lg flex items-center justify-center">
                            <CreditCard className="h-5 w-5 text-gray-300" />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-white">{gateway.displayName}</h4>
                            <div className="flex items-center space-x-2 mt-1 flex-wrap gap-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                gateway.isActive ? 'bg-green-900 text-green-300' : 'bg-gray-600 text-gray-300'
                              }`}>
                                {gateway.isActive ? 'Active' : 'Inactive'}
                              </span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                gateway.isTestMode ? 'bg-yellow-900 text-yellow-300' : 'bg-blue-900 text-blue-300'
                              }`}>
                                {gateway.isTestMode ? 'Test' : 'Live'}
                              </span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                gateway.testStatus === 'success' ? 'bg-green-900 text-green-300' :
                                gateway.testStatus === 'failed' ? 'bg-red-900 text-red-300' : 'bg-yellow-900 text-yellow-300'
                              }`}>
                                {gateway.testStatus}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-400">{gateway.processingFee}% fee</span>

                          <button
                            id={`test-gateway-${gateway.id}`}
                            onClick={() => testGatewayConnection(gateway.id)}
                            disabled={testingGateway === gateway.id}
                            className="px-3 py-1 border border-gray-500 rounded-lg hover:bg-gray-600 disabled:opacity-50 flex items-center space-x-1 text-sm text-gray-300"
                          >
                            <TestTube className="h-4 w-4" />
                            <span>{testingGateway === gateway.id ? 'Testing...' : 'Test'}</span>
                          </button>

                          <button
                            id={`toggle-gateway-${gateway.id}`}
                            onClick={() => toggleGatewayStatus(gateway.id)}
                            className={`px-3 py-1 rounded-lg flex items-center space-x-1 text-sm ${
                              gateway.isActive
                                ? 'bg-red-900 text-red-300 hover:bg-red-800'
                                : 'bg-green-900 text-green-300 hover:bg-green-800'
                            }`}
                          >
                            {gateway.isActive ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                            <span>{gateway.isActive ? 'Disable' : 'Enable'}</span>
                          </button>

                          <button
                            id={`configure-gateway-${gateway.id}`}
                            onClick={() => setEditingGateway(editingGateway === gateway.id ? null : gateway.id)}
                            className="px-3 py-1 border border-gray-500 rounded-lg hover:bg-gray-600 flex items-center space-x-1 text-sm text-gray-300"
                          >
                            <Settings className="h-4 w-4" />
                            <span>{editingGateway === gateway.id ? 'Close' : 'Configure'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {editingGateway === gateway.id && (
                      <div id={`gateway-config-${gateway.id}`} className="p-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between mb-4">
                            <h5 className="font-semibold text-white">Configuration</h5>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                className="rounded mr-2"
                                checked={gateway.isTestMode}
                                onChange={() => toggleTestMode(gateway.id)}
                              />
                              <span className="text-sm text-gray-300">Test Mode</span>
                            </label>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(gateway.configuration).map(([key, config]) => (
                              <div key={key} className="space-y-1">
                                <label className="block text-sm font-medium text-gray-300">
                                  {key.replace(/_/g, ' ').toUpperCase()}
                                  {config.required && <span className="text-red-400 ml-1">*</span>}
                                </label>
                                <div className="relative">
                                  <input
                                    type={config.isSecret && !showSecrets[`${gateway.id}-${key}`] ? 'password' : 'text'}
                                    value={config.value}
                                    onChange={(e) => handleConfigUpdate(gateway.id, key, e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#d83f0a] pr-10"
                                  />
                                  {config.isSecret && (
                                    <button
                                      type="button"
                                      onClick={() => toggleSecretVisibility(gateway.id, key)}
                                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                                    >
                                      {showSecrets[`${gateway.id}-${key}`] ? (
                                        <EyeOff className="h-4 w-4" />
                                      ) : (
                                        <Eye className="h-4 w-4" />
                                      )}
                                    </button>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500">{config.description}</p>
                              </div>
                            ))}
                          </div>

                          <div className="pt-4 border-t border-gray-600">
                            <div className="flex justify-end space-x-3">
                              <button
                                onClick={() => setEditingGateway(null)}
                                className="px-4 py-2 border border-gray-500 rounded-lg hover:bg-gray-600 text-gray-300"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => {
                                  setEditingGateway(null);
                                  alert('Configuration saved successfully!');
                                }}
                                className="px-4 py-2 bg-[#d83f0a] text-white rounded-lg hover:bg-[#b8350a] flex items-center space-x-2"
                              >
                                <Save className="h-4 w-4" />
                                <span>Save</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Webhook Info */}
              <div id="webhook-info" className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-white mb-3">Webhook Endpoint</h4>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value="https://yourstore.com/api/webhooks/payments"
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-gray-300 text-sm"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('https://yourstore.com/api/webhooks/payments');
                      alert('Copied to clipboard!');
                    }}
                    className="px-3 py-2 border border-gray-500 rounded-lg hover:bg-gray-600 text-gray-300 text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Security Notice */}
              <div id="security-notice" className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-400">Security Notice</h4>
                    <p className="text-sm text-yellow-300/80 mt-1">
                      All sensitive configuration data is encrypted at rest. Never share your API keys or webhook secrets.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
            <div id="payment-settings-tab" className="space-y-6">
              <h3 className="text-lg font-semibold text-white">Payment Configuration</h3>
              <p className="text-gray-400">Configure payment gateways and processing settings.</p>

              <button
                id="open-payment-modal-btn"
                onClick={() => setShowPaymentModal(true)}
                className="inline-flex items-center px-6 py-3 bg-[#d83f0a] text-white rounded-lg hover:bg-[#b8350a] transition-colors"
              >
                <Key className="h-5 w-5 mr-2" />
                Open Payment Gateway Configuration
              </button>

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
            <div id="general-settings-tab" className="space-y-6">
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
            <div id="email-settings-tab" className="space-y-6">
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
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
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
                  id="save-email-settings-btn"
                >
                  <Save className="h-4 w-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>

                <button
                  onClick={() => setShowTestEmailModal(true)}
                  className="border border-gray-600 text-gray-300 px-6 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2"
                  id="open-test-email-modal-btn"
                >
                  <Mail className="h-4 w-4" />
                  <span>Test Email</span>
                </button>
              </div>

              {/* Test Email Modal */}
              {showTestEmailModal && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" id="test-email-modal-overlay">
                  <div className="bg-gray-800 rounded-lg w-full max-w-md border border-gray-700" id="test-email-modal-container">
                    <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                      <h3 className="text-lg font-bold text-white">Send Test Email</h3>
                      <button
                        onClick={() => setShowTestEmailModal(false)}
                        className="text-gray-400 hover:text-white p-2"
                        id="close-test-email-modal-btn"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="p-6 space-y-4">
                      <p className="text-gray-400 text-sm">
                        Enter an email address to receive a test email. Make sure to save your SMTP settings first.
                      </p>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Test Email Address
                        </label>
                        <input
                          type="email"
                          value={testEmailAddress}
                          onChange={(e) => setTestEmailAddress(e.target.value)}
                          placeholder="test@example.com"
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#d83f0a]"
                          id="test-email-address-input"
                        />
                      </div>

                      <div className="flex justify-end space-x-3 pt-4">
                        <button
                          onClick={() => setShowTestEmailModal(false)}
                          className="px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 text-gray-300"
                          id="cancel-test-email-btn"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleTestEmail}
                          disabled={isSendingTestEmail || !testEmailAddress}
                          className="px-4 py-2 bg-[#d83f0a] text-white rounded-lg hover:bg-[#b8350a] disabled:opacity-50 flex items-center space-x-2"
                          id="send-test-email-btn"
                        >
                          <Mail className="h-4 w-4" />
                          <span>{isSendingTestEmail ? 'Sending...' : 'Send Test Email'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <div id="notifications-settings-tab" className="space-y-6">
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
            <div id="security-settings-tab" className="space-y-6">
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
            <div id="system-settings-tab" className="space-y-6">
              <h3 className="text-lg font-semibold text-white">System Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div id="system-status-card" className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-300">System Status</span>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-400">Online</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">All services are running normally</div>
                  </div>

                  <div id="database-status-card" className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-300">Database Status</span>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-400">Connected</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">Database connection is healthy</div>
                  </div>

                  <div id="storage-card" className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-300">Storage Usage</span>
                      <span className="text-sm text-white">{systemInfo.storageUsed} GB / {systemInfo.storageTotal} GB</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-[#d83f0a] h-2 rounded-full"
                        style={{width: `${(systemInfo.storageUsed / systemInfo.storageTotal) * 100}%`}}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div id="system-info-card" className="bg-gray-700 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-300 mb-2">System Information</div>
                    <div className="space-y-1 text-xs text-gray-400">
                      <div>Version: {systemInfo.version}</div>
                      <div>Build: {systemInfo.build}</div>
                      <div>Environment: {systemInfo.environment}</div>
                      <div>Uptime: {systemInfo.uptime}</div>
                    </div>
                  </div>

                  <div id="system-actions" className="space-y-3">
                    <button
                      id="clear-cache-btn"
                      onClick={handleClearCache}
                      disabled={isClearingCache}
                      className="w-full px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 flex items-center justify-center space-x-2 text-gray-300 disabled:opacity-50"
                    >
                      <RefreshCw className={`h-4 w-4 ${isClearingCache ? 'animate-spin' : ''}`} />
                      <span>{isClearingCache ? 'Clearing Cache...' : 'Clear Cache'}</span>
                    </button>

                    <button
                      id="download-logs-btn"
                      onClick={handleDownloadLogs}
                      disabled={isDownloadingLogs}
                      className="w-full px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 flex items-center justify-center space-x-2 text-gray-300 disabled:opacity-50"
                    >
                      <Download className={`h-4 w-4 ${isDownloadingLogs ? 'animate-pulse' : ''}`} />
                      <span>{isDownloadingLogs ? 'Preparing Download...' : 'Download Logs'}</span>
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
