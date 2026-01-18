'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Save,
  Mail,
  Eye,
  EyeOff,
  X,
  Send,
  Zap,
  ChevronRight,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function EmailSettings() {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [showTestEmailModal, setShowTestEmailModal] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);

  const [emailSettings, setEmailSettings] = useState({
    smtpHost: '',
    smtpPort: '587',
    smtpUsername: '',
    smtpPassword: '',
    fromName: 'Nexus TCGrading',
    fromEmail: '',
    enableSsl: true
  });

  const [showPasswords, setShowPasswords] = useState({
    smtpPassword: false
  });

  useEffect(() => {
    loadEmailSettings();
  }, []);

  const loadEmailSettings = async () => {
    setIsLoadingSettings(true);
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
      setIsLoadingSettings(false);
    }
  };

  const handleSave = async () => {
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

  if (isLoadingSettings) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d83f0a] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading email settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div id="email-settings-page" className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-[#d83f0a]/10 rounded-lg">
            <Mail className="h-6 w-6 text-[#d83f0a]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Email Configuration</h3>
            <p className="text-sm text-gray-400">Configure SMTP settings for outgoing emails</p>
          </div>
        </div>
      </div>

      {/* Email Automation Link */}
      <Link
        href="/admin/dashboard/settings/email/automation"
        id="email-automation-link"
        className="block bg-gradient-to-r from-[#d83f0a]/20 to-[#d66a0a]/20 border border-[#d83f0a]/30 rounded-lg p-4 hover:border-[#d83f0a]/50 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#d83f0a]/20 rounded-lg">
              <Zap className="h-5 w-5 text-[#d83f0a]" />
            </div>
            <div>
              <h4 className="font-medium text-white">Email Automation</h4>
              <p className="text-sm text-gray-400">Configure automated email templates for orders, grading status, and more</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-[#d83f0a]" />
        </div>
      </Link>

      {/* SMTP Configuration */}
      <div className="space-y-4">
        <h4 className="font-medium text-white flex items-center space-x-2">
          <span>SMTP Configuration</span>
          {emailSettings.smtpHost && (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="smtp-host" className="block text-sm font-medium text-gray-300 mb-1">
              SMTP Host
            </label>
            <input
              id="smtp-host"
              type="text"
              value={emailSettings.smtpHost}
              onChange={(e) => setEmailSettings({...emailSettings, smtpHost: e.target.value})}
              placeholder="smtp.example.com"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#d83f0a]"
            />
          </div>

          <div>
            <label htmlFor="smtp-port" className="block text-sm font-medium text-gray-300 mb-1">
              SMTP Port
            </label>
            <input
              id="smtp-port"
              type="text"
              value={emailSettings.smtpPort}
              onChange={(e) => setEmailSettings({...emailSettings, smtpPort: e.target.value})}
              placeholder="587"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#d83f0a]"
            />
          </div>

          <div>
            <label htmlFor="smtp-username" className="block text-sm font-medium text-gray-300 mb-1">
              SMTP Username
            </label>
            <input
              id="smtp-username"
              type="text"
              value={emailSettings.smtpUsername}
              onChange={(e) => setEmailSettings({...emailSettings, smtpUsername: e.target.value})}
              placeholder="user@example.com"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#d83f0a]"
            />
          </div>

          <div>
            <label htmlFor="smtp-password" className="block text-sm font-medium text-gray-300 mb-1">
              SMTP Password
            </label>
            <div className="relative">
              <input
                id="smtp-password"
                type={showPasswords.smtpPassword ? 'text' : 'password'}
                value={emailSettings.smtpPassword}
                onChange={(e) => setEmailSettings({...emailSettings, smtpPassword: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#d83f0a] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({...showPasswords, smtpPassword: !showPasswords.smtpPassword})}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPasswords.smtpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="from-name" className="block text-sm font-medium text-gray-300 mb-1">
              From Name
            </label>
            <input
              id="from-name"
              type="text"
              value={emailSettings.fromName}
              onChange={(e) => setEmailSettings({...emailSettings, fromName: e.target.value})}
              placeholder="Nexus TCGrading"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#d83f0a]"
            />
          </div>

          <div>
            <label htmlFor="from-email" className="block text-sm font-medium text-gray-300 mb-1">
              From Email
            </label>
            <input
              id="from-email"
              type="email"
              value={emailSettings.fromEmail}
              onChange={(e) => setEmailSettings({...emailSettings, fromEmail: e.target.value})}
              placeholder="noreply@nexusgrading.com"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#d83f0a]"
            />
          </div>
        </div>

        <div className="flex items-center">
          <input
            id="enable-ssl"
            type="checkbox"
            checked={emailSettings.enableSsl}
            onChange={(e) => setEmailSettings({...emailSettings, enableSsl: e.target.checked})}
            className="rounded mr-2 bg-gray-700 border-gray-600"
          />
          <label htmlFor="enable-ssl" className="text-sm text-gray-300">Enable SSL/TLS encryption</label>
        </div>
      </div>

      <div className="flex items-center space-x-4 pt-4 border-t border-gray-700">
        <button
          id="save-email-settings-btn"
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#d83f0a] text-white px-6 py-2 rounded-lg hover:bg-[#b8350a] disabled:opacity-50 flex items-center space-x-2"
        >
          <Save className="h-4 w-4" />
          <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
        </button>

        <button
          id="test-email-btn"
          onClick={() => setShowTestEmailModal(true)}
          className="border border-gray-600 text-gray-300 px-6 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2"
        >
          <Send className="h-4 w-4" />
          <span>Send Test Email</span>
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
              <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-sm text-blue-300">
                    Make sure to save your SMTP settings before sending a test email.
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="test-email-address" className="block text-sm font-medium text-gray-300 mb-1">
                  Test Email Address
                </label>
                <input
                  id="test-email-address"
                  type="email"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  placeholder="test@example.com"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#d83f0a]"
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
                  <Send className="h-4 w-4" />
                  <span>{isSendingTestEmail ? 'Sending...' : 'Send Test Email'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
