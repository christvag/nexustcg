'use client';

import { useState } from 'react';
import {
  CreditCard,
  DollarSign,
  Eye,
  EyeOff,
  Save,
  TestTube,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  Lock,
  Unlock,
  Shield
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

export default function PaymentConfiguration() {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Payment Gateway Configuration</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>Advanced Settings</span>
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Gateways</p>
              <p className="text-2xl font-bold text-green-600">
                {gateways.filter(g => g.isActive).length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Test Mode</p>
              <p className="text-2xl font-bold text-yellow-600">
                {gateways.filter(g => g.isTestMode).length}
              </p>
            </div>
            <TestTube className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Processing Fee</p>
              <p className="text-2xl font-bold text-blue-600">
                {(gateways.reduce((sum, g) => sum + g.processingFee, 0) / gateways.length).toFixed(1)}%
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Last Test Status</p>
              <p className="text-sm font-bold text-gray-900">
                {gateways.filter(g => g.testStatus === 'success').length}/{gateways.length} OK
              </p>
            </div>
            <Shield className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Payment Gateways */}
      <div className="space-y-6">
        {gateways.map((gateway) => (
          <div key={gateway.id} className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{gateway.displayName}</h3>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        gateway.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {gateway.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        gateway.isTestMode ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {gateway.isTestMode ? 'Test Mode' : 'Live Mode'}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(gateway.testStatus)}`}>
                        {getStatusIcon(gateway.testStatus)}
                        <span className="ml-1">Last Test: {gateway.testStatus}</span>
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="text-right mr-4">
                    <div className="text-sm font-medium text-gray-900">{gateway.processingFee}%</div>
                    <div className="text-xs text-gray-500">Processing Fee</div>
                  </div>
                  
                  <button
                    onClick={() => testGatewayConnection(gateway.id)}
                    disabled={testingGateway === gateway.id}
                    className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center space-x-1"
                  >
                    <TestTube className="h-4 w-4" />
                    <span>{testingGateway === gateway.id ? 'Testing...' : 'Test'}</span>
                  </button>
                  
                  <button
                    onClick={() => toggleGatewayStatus(gateway.id)}
                    className={`px-3 py-1 rounded-lg flex items-center space-x-1 ${
                      gateway.isActive 
                        ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {gateway.isActive ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                    <span>{gateway.isActive ? 'Disable' : 'Enable'}</span>
                  </button>
                  
                  <button
                    onClick={() => setEditingGateway(editingGateway === gateway.id ? null : gateway.id)}
                    className="px-3 py-1 border rounded-lg hover:bg-gray-50 flex items-center space-x-1"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Configure</span>
                  </button>
                </div>
              </div>
            </div>

            {editingGateway === gateway.id && (
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">Configuration Settings</h4>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="rounded mr-2"
                          checked={gateway.isTestMode}
                          onChange={() => toggleTestMode(gateway.id)}
                        />
                        <span className="text-sm text-gray-700">Test Mode</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(gateway.configuration).map(([key, config]) => (
                      <div key={key} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          {key.replace(/_/g, ' ').toUpperCase()}
                          {config.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <div className="relative">
                          <input
                            type={config.isSecret && !showSecrets[`${gateway.id}-${key}`] ? 'password' : 'text'}
                            value={config.value}
                            onChange={(e) => handleConfigUpdate(gateway.id, key, e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                            placeholder={config.description}
                          />
                          {config.isSecret && (
                            <button
                              type="button"
                              onClick={() => toggleSecretVisibility(gateway.id, key)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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

                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Processing Fee (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={gateway.processingFee}
                        onChange={(e) => {
                          const fee = parseFloat(e.target.value);
                          setGateways(gateways.map(g => 
                            g.id === gateway.id ? { ...g, processingFee: fee } : g
                          ));
                        }}
                        className="w-full max-w-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => setEditingGateway(null)}
                        className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          // Save configuration
                          setEditingGateway(null);
                          alert('Configuration saved successfully!');
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                      >
                        <Save className="h-4 w-4" />
                        <span>Save Configuration</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Webhook Configuration */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Webhook Configuration</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook Endpoint URL
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value="https://yourstore.com/api/webhooks/payments"
                readOnly
                className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 text-gray-600"
              />
              <button className="px-3 py-2 border rounded-lg hover:bg-gray-50">
                Copy
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stripe Webhook Events
              </label>
              <div className="space-y-1 text-sm text-gray-600">
                <div>• payment_intent.succeeded</div>
                <div>• payment_intent.payment_failed</div>
                <div>• customer.subscription.created</div>
                <div>• invoice.payment_succeeded</div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PayPal Webhook Events
              </label>
              <div className="space-y-1 text-sm text-gray-600">
                <div>• PAYMENT.CAPTURE.COMPLETED</div>
                <div>• PAYMENT.CAPTURE.DENIED</div>
                <div>• BILLING.SUBSCRIPTION.CREATED</div>
                <div>• BILLING.SUBSCRIPTION.CANCELLED</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
          <div>
            <h4 className="text-sm font-medium text-yellow-800">Security Notice</h4>
            <p className="text-sm text-yellow-700 mt-1">
              All sensitive configuration data is encrypted at rest. Never share your API keys or webhook secrets. 
              Always use test mode when setting up new integrations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}