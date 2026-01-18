'use client';

import { useState } from 'react';
import { Save, Globe } from 'lucide-react';

export default function GeneralSettings() {
  const [isSaving, setIsSaving] = useState(false);
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'Nexus TCGrading',
    siteDescription: 'Professional card grading and authentication services',
    supportEmail: 'support@nexusgrading.com',
    defaultLanguage: 'en',
    timezone: 'UTC',
    maintenanceMode: false,
    allowRegistration: true,
    requireEmailVerification: true
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('General settings saved successfully!');
    } catch (error) {
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="general-settings-page" className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-[#d83f0a]/10 rounded-lg">
          <Globe className="h-6 w-6 text-[#d83f0a]" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">General Settings</h3>
          <p className="text-sm text-gray-400">Configure basic site information and preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="site-name" className="block text-sm font-medium text-gray-300 mb-1">
            Site Name
          </label>
          <input
            id="site-name"
            type="text"
            value={generalSettings.siteName}
            onChange={(e) => setGeneralSettings({...generalSettings, siteName: e.target.value})}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#d83f0a]"
          />
        </div>

        <div>
          <label htmlFor="support-email" className="block text-sm font-medium text-gray-300 mb-1">
            Support Email
          </label>
          <input
            id="support-email"
            type="email"
            value={generalSettings.supportEmail}
            onChange={(e) => setGeneralSettings({...generalSettings, supportEmail: e.target.value})}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#d83f0a]"
          />
        </div>

        <div>
          <label htmlFor="default-language" className="block text-sm font-medium text-gray-300 mb-1">
            Default Language
          </label>
          <select
            id="default-language"
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
          <label htmlFor="timezone" className="block text-sm font-medium text-gray-300 mb-1">
            Timezone
          </label>
          <select
            id="timezone"
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
        <label htmlFor="site-description" className="block text-sm font-medium text-gray-300 mb-1">
          Site Description
        </label>
        <textarea
          id="site-description"
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
              className="rounded mr-2 bg-gray-700 border-gray-600"
            />
            <span className="text-sm text-gray-300">Allow new user registration</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={generalSettings.requireEmailVerification}
              onChange={(e) => setGeneralSettings({...generalSettings, requireEmailVerification: e.target.checked})}
              className="rounded mr-2 bg-gray-700 border-gray-600"
            />
            <span className="text-sm text-gray-300">Require email verification</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={generalSettings.maintenanceMode}
              onChange={(e) => setGeneralSettings({...generalSettings, maintenanceMode: e.target.checked})}
              className="rounded mr-2 bg-gray-700 border-gray-600"
            />
            <span className="text-sm text-gray-300">Maintenance mode</span>
          </label>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-700">
        <button
          id="save-general-settings-btn"
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
