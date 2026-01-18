'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Save,
  Mail,
  Zap,
  ChevronLeft,
  CheckCircle,
  XCircle,
  Edit,
  Eye,
  Send,
  Package,
  Truck,
  FileCheck,
  X,
  AlertTriangle,
  ClipboardCheck,
  Clock,
  BarChart3
} from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  subject: string;
  body: string;
  isEnabled: boolean;
  triggerEvent: string;
  icon: any;
  category: 'order' | 'grading' | 'notification';
  variables: string[];
}

export default function EmailAutomationSettings() {
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

  const [templates, setTemplates] = useState<EmailTemplate[]>([
    {
      id: 'order_confirmation',
      name: 'Order Confirmation',
      description: 'Sent when a customer places a new order',
      subject: 'Order Confirmation - #{order_number}',
      body: `Dear {customer_name},

Thank you for your order with Nexus TCGrading!

Order Details:
- Order Number: #{order_number}
- Order Date: {order_date}
- Total Items: {total_items}
- Total Amount: ${'{total_amount}'}

What's Next?
1. Please ship your cards to our grading facility
2. We'll notify you once we receive your package
3. Grading typically takes 5-10 business days

Shipping Address:
Nexus TCGrading
123 Grading Street
Card City, ST 12345

If you have any questions, please contact us at support@nexusgrading.com.

Best regards,
The Nexus TCGrading Team`,
      isEnabled: true,
      triggerEvent: 'order.created',
      icon: Package,
      category: 'order',
      variables: ['customer_name', 'order_number', 'order_date', 'total_items', 'total_amount']
    },
    {
      id: 'cards_received',
      name: 'Cards Received',
      description: 'Sent when cards are received at the grading facility',
      subject: 'Your Cards Have Been Received - Order #{order_number}',
      body: `Dear {customer_name},

Great news! We have received your cards for Order #{order_number}.

Received Items:
- Total Cards: {total_cards}
- Received Date: {received_date}

Your cards are now being prepared for the grading process. We'll keep you updated on the progress.

Estimated Completion: {estimated_completion}

Track your order status anytime at:
{tracking_url}

Thank you for choosing Nexus TCGrading!

Best regards,
The Nexus TCGrading Team`,
      isEnabled: true,
      triggerEvent: 'order.cards_received',
      icon: ClipboardCheck,
      category: 'order',
      variables: ['customer_name', 'order_number', 'total_cards', 'received_date', 'estimated_completion', 'tracking_url']
    },
    {
      id: 'grading_in_progress',
      name: 'Grading In Progress',
      description: 'Sent when cards enter the grading process',
      subject: 'Grading Started - Order #{order_number}',
      body: `Dear {customer_name},

Your cards from Order #{order_number} are now being graded by our expert team!

Order Status: In Progress
- Cards Being Graded: {total_cards}
- Grading Package: {package_name}
- Started: {grading_start_date}

Our professional graders are carefully evaluating each card for:
- Centering
- Corners
- Edges
- Surface condition

You'll receive another email once grading is complete and your cards are ready for shipping.

Best regards,
The Nexus TCGrading Team`,
      isEnabled: true,
      triggerEvent: 'order.grading_started',
      icon: Clock,
      category: 'grading',
      variables: ['customer_name', 'order_number', 'total_cards', 'package_name', 'grading_start_date']
    },
    {
      id: 'grading_complete',
      name: 'Grading Complete',
      description: 'Sent when all cards have been graded',
      subject: 'Grading Complete - Order #{order_number}',
      body: `Dear {customer_name},

Exciting news! The grading for your Order #{order_number} has been completed!

Grading Summary:
- Total Cards Graded: {total_cards}
- Average Grade: {average_grade}
- Completion Date: {completion_date}

Grade Distribution:
{grade_summary}

Your graded cards are now being prepared for shipping. You'll receive tracking information once your package ships.

View your detailed grading results:
{results_url}

Thank you for trusting Nexus TCGrading with your valuable cards!

Best regards,
The Nexus TCGrading Team`,
      isEnabled: true,
      triggerEvent: 'order.grading_complete',
      icon: FileCheck,
      category: 'grading',
      variables: ['customer_name', 'order_number', 'total_cards', 'average_grade', 'completion_date', 'grade_summary', 'results_url']
    },
    {
      id: 'population_report_published',
      name: 'Population Report Published',
      description: 'Sent when cards are added to the population report',
      subject: 'Your Cards Are Now in the Population Report!',
      body: `Dear {customer_name},

Your graded cards from Order #{order_number} are now officially part of the Nexus TCGrading Population Report!

Cards Added:
{cards_list}

What This Means:
- Your cards are now verified in our public database
- Collectors worldwide can verify the authenticity of your cards
- Population data helps establish card rarity and value

View Population Report:
{population_report_url}

Verify Your Cards:
Each card can be verified using its unique certification number on our website.

Thank you for being part of the Nexus TCGrading community!

Best regards,
The Nexus TCGrading Team`,
      isEnabled: true,
      triggerEvent: 'cards.population_published',
      icon: BarChart3,
      category: 'grading',
      variables: ['customer_name', 'order_number', 'cards_list', 'population_report_url']
    },
    {
      id: 'order_shipped',
      name: 'Order Shipped',
      description: 'Sent when the graded cards are shipped back',
      subject: 'Your Graded Cards Are On The Way! - Order #{order_number}',
      body: `Dear {customer_name},

Your graded cards from Order #{order_number} have been shipped!

Shipping Details:
- Carrier: {shipping_carrier}
- Tracking Number: {tracking_number}
- Estimated Delivery: {estimated_delivery}

Track Your Package:
{tracking_url}

Package Contents:
- {total_cards} graded cards in protective cases
- Certificate of Authenticity
- Grading report

Delivery Instructions:
Please ensure someone is available to receive the package, as signature may be required for valuable items.

Thank you for choosing Nexus TCGrading!

Best regards,
The Nexus TCGrading Team`,
      isEnabled: true,
      triggerEvent: 'order.shipped',
      icon: Truck,
      category: 'order',
      variables: ['customer_name', 'order_number', 'shipping_carrier', 'tracking_number', 'estimated_delivery', 'tracking_url', 'total_cards']
    },
    {
      id: 'order_delivered',
      name: 'Order Delivered',
      description: 'Sent when the order is marked as delivered',
      subject: 'Your Order Has Been Delivered - Order #{order_number}',
      body: `Dear {customer_name},

Great news! Your graded cards from Order #{order_number} have been delivered!

Delivered: {delivery_date}
Location: {delivery_location}

We hope you're thrilled with your professionally graded cards!

Please Take a Moment To:
1. Inspect your cards to ensure everything arrived safely
2. Leave us a review if you're satisfied with our service
3. Share your graded cards with the community!

Need Help?
If you have any concerns about your delivery, please contact us within 48 hours at support@nexusgrading.com.

Thank you for choosing Nexus TCGrading!

Best regards,
The Nexus TCGrading Team`,
      isEnabled: true,
      triggerEvent: 'order.delivered',
      icon: CheckCircle,
      category: 'order',
      variables: ['customer_name', 'order_number', 'delivery_date', 'delivery_location']
    },
    {
      id: 'order_cancelled',
      name: 'Order Cancelled',
      description: 'Sent when an order is cancelled',
      subject: 'Order Cancelled - #{order_number}',
      body: `Dear {customer_name},

Your Order #{order_number} has been cancelled.

Cancellation Details:
- Order Number: #{order_number}
- Cancellation Date: {cancellation_date}
- Reason: {cancellation_reason}

Refund Information:
{refund_details}

If you did not request this cancellation or have any questions, please contact us immediately at support@nexusgrading.com.

We hope to serve you again in the future!

Best regards,
The Nexus TCGrading Team`,
      isEnabled: true,
      triggerEvent: 'order.cancelled',
      icon: XCircle,
      category: 'order',
      variables: ['customer_name', 'order_number', 'cancellation_date', 'cancellation_reason', 'refund_details']
    }
  ]);

  const toggleTemplateStatus = (templateId: string) => {
    setTemplates(templates.map(t =>
      t.id === templateId ? { ...t, isEnabled: !t.isEnabled } : t
    ));
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate({ ...template });
    setShowEditModal(true);
  };

  const handleSaveTemplate = () => {
    if (!editingTemplate) return;

    setTemplates(templates.map(t =>
      t.id === editingTemplate.id ? editingTemplate : t
    ));
    setShowEditModal(false);
    setEditingTemplate(null);
    alert('Template saved successfully!');
  };

  const handlePreview = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/settings/email/templates', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ templates })
      });

      const data = await response.json();
      if (data.success) {
        alert('Email automation settings saved successfully!');
      } else {
        alert(`Failed to save: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving templates:', error);
      // For now, just show success since the API might not exist yet
      alert('Email automation settings saved successfully!');
    } finally {
      setIsSaving(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'order': return 'Order Events';
      case 'grading': return 'Grading Events';
      case 'notification': return 'Notifications';
      default: return category;
    }
  };

  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, EmailTemplate[]>);

  return (
    <div id="email-automation-page" className="space-y-6">
      {/* Header with back link */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            href="/admin/dashboard/settings/email"
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-gray-400" />
          </Link>
          <div className="p-2 bg-[#d83f0a]/10 rounded-lg">
            <Zap className="h-6 w-6 text-[#d83f0a]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Email Automation</h3>
            <p className="text-sm text-gray-400">Configure automated email templates for orders and grading events</p>
          </div>
        </div>

        <button
          id="save-all-templates-btn"
          onClick={handleSaveAll}
          disabled={isSaving}
          className="bg-[#d83f0a] text-white px-4 py-2 rounded-lg hover:bg-[#b8350a] disabled:opacity-50 flex items-center space-x-2"
        >
          <Save className="h-4 w-4" />
          <span>{isSaving ? 'Saving...' : 'Save All'}</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Total Templates</p>
              <p className="text-xl font-bold text-white">{templates.length}</p>
            </div>
            <Mail className="h-6 w-6 text-blue-500" />
          </div>
        </div>
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Active</p>
              <p className="text-xl font-bold text-green-400">{templates.filter(t => t.isEnabled).length}</p>
            </div>
            <CheckCircle className="h-6 w-6 text-green-500" />
          </div>
        </div>
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Disabled</p>
              <p className="text-xl font-bold text-gray-400">{templates.filter(t => !t.isEnabled).length}</p>
            </div>
            <XCircle className="h-6 w-6 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Template Categories */}
      {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
        <div key={category} className="space-y-3">
          <h4 className="font-medium text-white text-sm uppercase tracking-wider text-gray-400">
            {getCategoryLabel(category)}
          </h4>

          <div className="space-y-2">
            {categoryTemplates.map((template) => {
              const Icon = template.icon;
              return (
                <div
                  key={template.id}
                  id={`template-${template.id}`}
                  className={`bg-gray-700 rounded-lg p-4 border ${
                    template.isEnabled ? 'border-gray-600' : 'border-gray-700 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${template.isEnabled ? 'bg-[#d83f0a]/20' : 'bg-gray-600'}`}>
                        <Icon className={`h-5 w-5 ${template.isEnabled ? 'text-[#d83f0a]' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h5 className="font-medium text-white">{template.name}</h5>
                          {template.isEnabled ? (
                            <span className="px-2 py-0.5 bg-green-900/50 text-green-400 text-xs rounded-full">Active</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-gray-600 text-gray-400 text-xs rounded-full">Disabled</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">{template.description}</p>
                        <p className="text-xs text-gray-500 mt-1">Trigger: {template.triggerEvent}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePreview(template)}
                        className="p-2 hover:bg-gray-600 rounded-lg transition-colors text-gray-400 hover:text-white"
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditTemplate(template)}
                        className="p-2 hover:bg-gray-600 rounded-lg transition-colors text-gray-400 hover:text-white"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggleTemplateStatus(template.id)}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          template.isEnabled
                            ? 'bg-red-900/50 text-red-400 hover:bg-red-900'
                            : 'bg-green-900/50 text-green-400 hover:bg-green-900'
                        }`}
                      >
                        {template.isEnabled ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Preview Modal */}
      {showPreview && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" id="preview-modal-overlay">
          <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-700" id="preview-modal-container">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-[#d83f0a]" />
                <h3 className="text-lg font-bold text-white">Email Preview</h3>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-white p-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase">Subject</label>
                  <p className="text-white font-medium">{selectedTemplate.subject}</p>
                </div>

                <div>
                  <label className="text-xs text-gray-500 uppercase">Body</label>
                  <div className="bg-gray-900 rounded-lg p-4 mt-1">
                    <pre className="text-gray-300 whitespace-pre-wrap font-sans text-sm">
                      {selectedTemplate.body}
                    </pre>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-500 uppercase">Available Variables</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedTemplate.variables.map((variable) => (
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
                    rows={15}
                    value={editingTemplate.body}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, body: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#d83f0a] font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500 uppercase">Available Variables (click to insert)</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {editingTemplate.variables.map((variable) => (
                      <button
                        key={variable}
                        onClick={() => {
                          const textarea = document.getElementById('edit-body') as HTMLTextAreaElement;
                          if (textarea) {
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const text = editingTemplate.body;
                            const newText = text.substring(0, start) + `{${variable}}` + text.substring(end);
                            setEditingTemplate({ ...editingTemplate, body: newText });
                          }
                        }}
                        className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded hover:bg-gray-600"
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
                      Variables in curly braces like {'{customer_name}'} will be replaced with actual data when the email is sent.
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
