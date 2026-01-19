'use client';

import { useState } from 'react';
import { Save, Bell, Mail, MessageSquare, Smartphone, Edit, Eye, X, AlertTriangle } from 'lucide-react';

interface NotificationTemplate {
  id: string;
  name: string;
  description: string;
  subject: string;
  body: string;
  isEnabled: boolean;
  variables: string[];
}

export default function NotificationSettings() {
  const [isSaving, setIsSaving] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<NotificationTemplate | null>(null);

  const [channelSettings, setChannelSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true
  });

  const [templates, setTemplates] = useState<NotificationTemplate[]>([
    {
      id: 'order_updates',
      name: 'Order Updates',
      description: 'Notify customers about order status changes',
      subject: 'Order Update - #{order_number}',
      body: `Dear {customer_name},

Your order #{order_number} has been updated.

New Status: {order_status}
Updated: {update_date}

{status_message}

Track your order at: {tracking_url}

Best regards,
The Nexus TCGrading Team`,
      isEnabled: true,
      variables: ['customer_name', 'order_number', 'order_status', 'update_date', 'status_message', 'tracking_url']
    },
    {
      id: 'grading_complete',
      name: 'Grading Complete',
      description: 'Notify when card grading is finished',
      subject: 'Grading Complete - Order #{order_number}',
      body: `Dear {customer_name},

Great news! The grading for your Order #{order_number} has been completed.

Grading Summary:
- Total Cards Graded: {total_cards}
- Average Grade: {average_grade}

Your cards are now being prepared for shipping.

View your results: {results_url}

Thank you for choosing Nexus TCGrading!

Best regards,
The Nexus TCGrading Team`,
      isEnabled: true,
      variables: ['customer_name', 'order_number', 'total_cards', 'average_grade', 'results_url']
    },
    {
      id: 'shipment_updates',
      name: 'Shipment Updates',
      description: 'Notify about shipping and delivery',
      subject: 'Shipment Update - Order #{order_number}',
      body: `Dear {customer_name},

Your order #{order_number} has a shipping update.

Status: {shipping_status}
Carrier: {shipping_carrier}
Tracking Number: {tracking_number}

Track your package: {tracking_url}

Estimated Delivery: {estimated_delivery}

Best regards,
The Nexus TCGrading Team`,
      isEnabled: true,
      variables: ['customer_name', 'order_number', 'shipping_status', 'shipping_carrier', 'tracking_number', 'tracking_url', 'estimated_delivery']
    },
    {
      id: 'marketing_emails',
      name: 'Marketing Emails',
      description: 'Send promotional emails to customers',
      subject: '{subject_line}',
      body: `Dear {customer_name},

{marketing_content}

Visit our website: {website_url}

Best regards,
The Nexus TCGrading Team

To unsubscribe, click here: {unsubscribe_url}`,
      isEnabled: false,
      variables: ['customer_name', 'subject_line', 'marketing_content', 'website_url', 'unsubscribe_url']
    },
    {
      id: 'system_alerts',
      name: 'System Alerts',
      description: 'Critical system notifications for admins',
      subject: '[ALERT] {alert_type} - Nexus TCGrading',
      body: `SYSTEM ALERT

Type: {alert_type}
Severity: {severity}
Time: {alert_time}

Details:
{alert_message}

Action Required: {action_required}

---
This is an automated system alert from Nexus TCGrading.`,
      isEnabled: true,
      variables: ['alert_type', 'severity', 'alert_time', 'alert_message', 'action_required']
    },
    {
      id: 'new_user_registration',
      name: 'New User Registration',
      description: 'Notify admins when new users sign up',
      subject: 'New User Registration - {user_email}',
      body: `NEW USER REGISTRATION

A new user has registered on Nexus TCGrading.

User Details:
- Name: {user_name}
- Email: {user_email}
- Registration Date: {registration_date}

View user in admin panel: {admin_url}

---
This is an automated notification from Nexus TCGrading.`,
      isEnabled: true,
      variables: ['user_name', 'user_email', 'registration_date', 'admin_url']
    },
    {
      id: 'low_stock_alerts',
      name: 'Low Stock Alerts',
      description: 'Notify when supplies are running low',
      subject: '[LOW STOCK] {item_name} - Action Required',
      body: `LOW STOCK ALERT

The following item is running low:

Item: {item_name}
Current Stock: {current_stock}
Minimum Threshold: {min_threshold}

Please reorder soon to avoid service disruption.

---
This is an automated alert from Nexus TCGrading.`,
      isEnabled: false,
      variables: ['item_name', 'current_stock', 'min_threshold']
    }
  ]);

  const toggleTemplate = (templateId: string) => {
    setTemplates(templates.map(t =>
      t.id === templateId ? { ...t, isEnabled: !t.isEnabled } : t
    ));
  };

  const handleEditTemplate = (template: NotificationTemplate) => {
    setEditingTemplate({ ...template });
    setShowEditModal(true);
  };

  const handlePreviewTemplate = (template: NotificationTemplate) => {
    setPreviewTemplate(template);
    setShowPreviewModal(true);
  };

  const handleSaveTemplate = () => {
    if (!editingTemplate) return;

    setTemplates(templates.map(t =>
      t.id === editingTemplate.id ? editingTemplate : t
    ));
    setShowEditModal(false);
    setEditingTemplate(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Notification settings saved successfully!');
    } catch (error) {
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Group templates by category
  const customerTemplates = templates.filter(t =>
    ['order_updates', 'grading_complete', 'shipment_updates', 'marketing_emails'].includes(t.id)
  );
  const adminTemplates = templates.filter(t =>
    ['system_alerts', 'new_user_registration', 'low_stock_alerts'].includes(t.id)
  );

  return (
    <div id="notification-settings-page" className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-[#d83f0a]/10 rounded-lg">
          <Bell className="h-6 w-6 text-[#d83f0a]" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Notification Settings</h3>
          <p className="text-sm text-gray-400">Configure how and when notifications are sent</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Notification Channels */}
        <div>
          <h4 className="font-medium text-white mb-4 flex items-center space-x-2">
            <Smartphone className="h-4 w-4" />
            <span>Notification Channels</span>
          </h4>
          <div className="bg-gray-700 rounded-lg p-4 space-y-4">
            <label className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <span className="text-sm text-white">Email Notifications</span>
                  <p className="text-xs text-gray-500">Receive notifications via email</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={channelSettings.emailNotifications}
                onChange={(e) => setChannelSettings({...channelSettings, emailNotifications: e.target.checked})}
                className="rounded bg-gray-600 border-gray-500 text-[#d83f0a] focus:ring-[#d83f0a]"
              />
            </label>

            <label className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MessageSquare className="h-5 w-5 text-gray-400" />
                <div>
                  <span className="text-sm text-white">SMS Notifications</span>
                  <p className="text-xs text-gray-500">Receive notifications via SMS</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={channelSettings.smsNotifications}
                onChange={(e) => setChannelSettings({...channelSettings, smsNotifications: e.target.checked})}
                className="rounded bg-gray-600 border-gray-500 text-[#d83f0a] focus:ring-[#d83f0a]"
              />
            </label>

            <label className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="h-5 w-5 text-gray-400" />
                <div>
                  <span className="text-sm text-white">Push Notifications</span>
                  <p className="text-xs text-gray-500">Browser push notifications</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={channelSettings.pushNotifications}
                onChange={(e) => setChannelSettings({...channelSettings, pushNotifications: e.target.checked})}
                className="rounded bg-gray-600 border-gray-500 text-[#d83f0a] focus:ring-[#d83f0a]"
              />
            </label>
          </div>
        </div>

        {/* Customer Notifications */}
        <div>
          <h4 className="font-medium text-white mb-4">Customer Notifications</h4>
          <div className="bg-gray-700 rounded-lg overflow-hidden">
            {customerTemplates.map((template, index) => (
              <div
                key={template.id}
                id={`notification-${template.id}`}
                className={`p-4 ${index < customerTemplates.length - 1 ? 'border-b border-gray-600' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <input
                      type="checkbox"
                      checked={template.isEnabled}
                      onChange={() => toggleTemplate(template.id)}
                      className="rounded bg-gray-600 border-gray-500 text-[#d83f0a] focus:ring-[#d83f0a]"
                    />
                    <div className="flex-1">
                      <span className="text-sm text-white">{template.name}</span>
                      <p className="text-xs text-gray-500">{template.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePreviewTemplate(template)}
                      className="p-2 hover:bg-gray-600 rounded-lg transition-colors text-gray-400 hover:text-white"
                      title="Preview Template"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEditTemplate(template)}
                      className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors text-gray-300 hover:text-white flex items-center space-x-1 text-sm"
                      title="Edit Template"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      <span>Edit Template</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Admin Notifications */}
        <div>
          <h4 className="font-medium text-white mb-4">Admin Notifications</h4>
          <div className="bg-gray-700 rounded-lg overflow-hidden">
            {adminTemplates.map((template, index) => (
              <div
                key={template.id}
                id={`notification-${template.id}`}
                className={`p-4 ${index < adminTemplates.length - 1 ? 'border-b border-gray-600' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <input
                      type="checkbox"
                      checked={template.isEnabled}
                      onChange={() => toggleTemplate(template.id)}
                      className="rounded bg-gray-600 border-gray-500 text-[#d83f0a] focus:ring-[#d83f0a]"
                    />
                    <div className="flex-1">
                      <span className="text-sm text-white">{template.name}</span>
                      <p className="text-xs text-gray-500">{template.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePreviewTemplate(template)}
                      className="p-2 hover:bg-gray-600 rounded-lg transition-colors text-gray-400 hover:text-white"
                      title="Preview Template"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEditTemplate(template)}
                      className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors text-gray-300 hover:text-white flex items-center space-x-1 text-sm"
                      title="Edit Template"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      <span>Edit Template</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-700">
        <button
          id="save-notification-settings-btn"
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#d83f0a] text-white px-6 py-2 rounded-lg hover:bg-[#b8350a] disabled:opacity-50 flex items-center space-x-2"
        >
          <Save className="h-4 w-4" />
          <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" id="preview-modal-overlay">
          <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-700" id="preview-modal-container">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-[#d83f0a]" />
                <h3 className="text-lg font-bold text-white">Preview: {previewTemplate.name}</h3>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-400 hover:text-white p-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase">Subject</label>
                  <p className="text-white font-medium mt-1">{previewTemplate.subject}</p>
                </div>

                <div>
                  <label className="text-xs text-gray-500 uppercase">Body</label>
                  <div className="bg-gray-900 rounded-lg p-4 mt-1">
                    <pre className="text-gray-300 whitespace-pre-wrap font-sans text-sm">
                      {previewTemplate.body}
                    </pre>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-500 uppercase">Available Variables</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {previewTemplate.variables.map((variable) => (
                      <span
                        key={variable}
                        className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded"
                      >
                        {'{' + variable + '}'}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" id="edit-modal-overlay">
          <div className="bg-gray-800 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden border border-gray-700" id="edit-modal-container">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Edit className="h-5 w-5 text-[#d83f0a]" />
                <h3 className="text-lg font-bold text-white">Edit Template: {editingTemplate.name}</h3>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingTemplate(null);
                }}
                className="text-gray-400 hover:text-white p-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="space-y-4">
                <div>
                  <label htmlFor="edit-subject" className="block text-sm font-medium text-gray-300 mb-1">
                    Email Subject
                  </label>
                  <input
                    id="edit-subject"
                    type="text"
                    value={editingTemplate.subject}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#d83f0a]"
                  />
                </div>

                <div>
                  <label htmlFor="edit-body" className="block text-sm font-medium text-gray-300 mb-1">
                    Email Body
                  </label>
                  <textarea
                    id="edit-body"
                    rows={12}
                    value={editingTemplate.body}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, body: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#d83f0a] font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500 uppercase">Available Variables (click to insert)</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {editingTemplate.variables.map((variable) => (
                      <button
                        key={variable}
                        type="button"
                        onClick={() => {
                          const textarea = document.getElementById('edit-body') as HTMLTextAreaElement;
                          if (textarea) {
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const text = editingTemplate.body;
                            const newText = text.substring(0, start) + `{${variable}}` + text.substring(end);
                            setEditingTemplate({ ...editingTemplate, body: newText });
                            // Focus back to textarea
                            setTimeout(() => {
                              textarea.focus();
                              textarea.setSelectionRange(start + variable.length + 2, start + variable.length + 2);
                            }, 0);
                          }
                        }}
                        className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded hover:bg-gray-600 transition-colors"
                      >
                        {'{' + variable + '}'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                    <p className="text-sm text-yellow-300">
                      Variables in curly braces like <code className="bg-gray-800 px-1 rounded">{'{customer_name}'}</code> will be replaced with actual data when the email is sent.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingTemplate(null);
                }}
                className="px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                className="px-4 py-2 bg-[#d83f0a] text-white rounded-lg hover:bg-[#b8350a] flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>Save Template</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
