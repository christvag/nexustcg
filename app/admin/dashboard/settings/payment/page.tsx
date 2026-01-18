'use client';

import { useState } from 'react';
import {
  Save,
  CreditCard,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertCircle,
  TestTube,
  DollarSign,
  Shield,
  Settings,
  Lock,
  Unlock,
  X
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

export default function PaymentSettings() {
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
    await new Promise(resolve => setTimeout(resolve, 2000));

    setGateways(gateways.map(gateway =>
      gateway.id === gatewayId
        ? {
            ...gateway,
            testStatus: Math.random() > 0.3 ? 'success' : 'failed',
            lastTested: new Date().toISOString()
          }
        : gateway
    ));

    setTestingGateway(null);
  };

  return (
    <div id="payment-settings-page" className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-[#d83f0a]/10 rounded-lg">
          <CreditCard className="h-6 w-6 text-[#d83f0a]" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Payment Settings</h3>
          <p className="text-sm text-gray-400">Configure payment gateways and processing fees</p>
        </div>
      </div>

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
                        className="rounded mr-2 bg-gray-600 border-gray-500"
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
            value="https://nexusgrading.com/api/webhooks/payments"
            readOnly
            className="flex-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-gray-300 text-sm"
          />
          <button
            onClick={() => {
              navigator.clipboard.writeText('https://nexusgrading.com/api/webhooks/payments');
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
  );
}
