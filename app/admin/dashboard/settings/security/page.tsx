'use client';

import { useState } from 'react';
import { Save, Shield, Lock, Key, Clock, AlertTriangle } from 'lucide-react';

export default function SecuritySettings() {
  const [isSaving, setIsSaving] = useState(false);
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorRequired: false,
    passwordMinLength: 8,
    passwordRequireSpecial: true,
    passwordRequireNumbers: true,
    passwordRequireUppercase: true,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    enableAuditLog: true,
    lockoutDuration: 30,
    requirePasswordChange: 90
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Security settings saved successfully!');
    } catch (error) {
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="security-settings-page" className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-[#d83f0a]/10 rounded-lg">
          <Shield className="h-6 w-6 text-[#d83f0a]" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Security Settings</h3>
          <p className="text-sm text-gray-400">Configure authentication and security policies</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Password Policy */}
        <div>
          <h4 className="font-medium text-white mb-4 flex items-center space-x-2">
            <Key className="h-4 w-4" />
            <span>Password Policy</span>
          </h4>
          <div className="bg-gray-700 rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password-min-length" className="block text-sm font-medium text-gray-300 mb-1">
                  Minimum Password Length
                </label>
                <input
                  id="password-min-length"
                  type="number"
                  min="6"
                  max="20"
                  value={securitySettings.passwordMinLength}
                  onChange={(e) => setSecuritySettings({...securitySettings, passwordMinLength: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#d83f0a]"
                />
              </div>

              <div>
                <label htmlFor="password-change-days" className="block text-sm font-medium text-gray-300 mb-1">
                  Require Password Change (days)
                </label>
                <input
                  id="password-change-days"
                  type="number"
                  min="0"
                  max="365"
                  value={securitySettings.requirePasswordChange}
                  onChange={(e) => setSecuritySettings({...securitySettings, requirePasswordChange: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#d83f0a]"
                />
                <p className="text-xs text-gray-500 mt-1">0 = never require change</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={securitySettings.passwordRequireSpecial}
                  onChange={(e) => setSecuritySettings({...securitySettings, passwordRequireSpecial: e.target.checked})}
                  className="rounded bg-gray-600 border-gray-500 text-[#d83f0a] focus:ring-[#d83f0a] mr-2"
                />
                <span className="text-sm text-gray-300">Require special characters (!@#$%^&*)</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={securitySettings.passwordRequireNumbers}
                  onChange={(e) => setSecuritySettings({...securitySettings, passwordRequireNumbers: e.target.checked})}
                  className="rounded bg-gray-600 border-gray-500 text-[#d83f0a] focus:ring-[#d83f0a] mr-2"
                />
                <span className="text-sm text-gray-300">Require numbers</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={securitySettings.passwordRequireUppercase}
                  onChange={(e) => setSecuritySettings({...securitySettings, passwordRequireUppercase: e.target.checked})}
                  className="rounded bg-gray-600 border-gray-500 text-[#d83f0a] focus:ring-[#d83f0a] mr-2"
                />
                <span className="text-sm text-gray-300">Require uppercase letters</span>
              </label>
            </div>
          </div>
        </div>

        {/* Session & Login */}
        <div>
          <h4 className="font-medium text-white mb-4 flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Session & Login</span>
          </h4>
          <div className="bg-gray-700 rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="session-timeout" className="block text-sm font-medium text-gray-300 mb-1">
                  Session Timeout (minutes)
                </label>
                <input
                  id="session-timeout"
                  type="number"
                  min="10"
                  max="480"
                  value={securitySettings.sessionTimeout}
                  onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#d83f0a]"
                />
              </div>

              <div>
                <label htmlFor="max-login-attempts" className="block text-sm font-medium text-gray-300 mb-1">
                  Max Login Attempts
                </label>
                <input
                  id="max-login-attempts"
                  type="number"
                  min="3"
                  max="10"
                  value={securitySettings.maxLoginAttempts}
                  onChange={(e) => setSecuritySettings({...securitySettings, maxLoginAttempts: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#d83f0a]"
                />
              </div>

              <div>
                <label htmlFor="lockout-duration" className="block text-sm font-medium text-gray-300 mb-1">
                  Lockout Duration (minutes)
                </label>
                <input
                  id="lockout-duration"
                  type="number"
                  min="5"
                  max="60"
                  value={securitySettings.lockoutDuration}
                  onChange={(e) => setSecuritySettings({...securitySettings, lockoutDuration: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#d83f0a]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Security */}
        <div>
          <h4 className="font-medium text-white mb-4 flex items-center space-x-2">
            <Lock className="h-4 w-4" />
            <span>Advanced Security</span>
          </h4>
          <div className="bg-gray-700 rounded-lg p-4 space-y-3">
            <label className="flex items-center justify-between py-2 border-b border-gray-600">
              <div>
                <span className="text-sm text-white">Two-Factor Authentication</span>
                <p className="text-xs text-gray-500">Require 2FA for all admin users</p>
              </div>
              <input
                type="checkbox"
                checked={securitySettings.twoFactorRequired}
                onChange={(e) => setSecuritySettings({...securitySettings, twoFactorRequired: e.target.checked})}
                className="rounded bg-gray-600 border-gray-500 text-[#d83f0a] focus:ring-[#d83f0a]"
              />
            </label>

            <label className="flex items-center justify-between py-2">
              <div>
                <span className="text-sm text-white">Audit Logging</span>
                <p className="text-xs text-gray-500">Log all admin actions for security review</p>
              </div>
              <input
                type="checkbox"
                checked={securitySettings.enableAuditLog}
                onChange={(e) => setSecuritySettings({...securitySettings, enableAuditLog: e.target.checked})}
                className="rounded bg-gray-600 border-gray-500 text-[#d83f0a] focus:ring-[#d83f0a]"
              />
            </label>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-yellow-400">Security Recommendation</h4>
              <p className="text-sm text-yellow-300/80 mt-1">
                We recommend enabling two-factor authentication and audit logging for enhanced security.
                Regularly review login attempts and audit logs for suspicious activity.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-700">
        <button
          id="save-security-settings-btn"
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#d83f0a] text-white px-6 py-2 rounded-lg hover:bg-[#b8350a] disabled:opacity-50 flex items-center space-x-2"
        >
          <Save className="h-4 w-4" />
          <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>
    </div>
  );
}
