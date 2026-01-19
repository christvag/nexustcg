'use client';

import { useState, useEffect } from 'react';
import { Save, Globe, DollarSign, Loader2 } from 'lucide-react';

// id: admin-settings-general-page-001

interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export default function GeneralSettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [generalSettings, setGeneralSettings] = useState({
    site_name: 'Nexus TCGrading',
    site_description: 'Professional card grading and authentication services',
    support_email: 'support@nexusgrading.com',
    default_language: 'en',
    timezone: 'UTC',
    currency_code: 'GBP',
    currency_position: 'before',
    maintenance_mode: false,
    allow_registration: true,
    require_email_verification: true
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings/general', {
        headers: getAuthHeaders()
      });
      const data = await response.json();

      if (data.success) {
        setGeneralSettings(prev => ({
          ...prev,
          ...data.settings
        }));
        setCurrencies(data.currencies || []);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/settings/general', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ settings: generalSettings })
      });

      const data = await response.json();

      if (data.success) {
        alert('Settings saved successfully!');
      } else {
        alert('Failed to save settings: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div id="general-settings-loading" className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#d83f0a]" />
      </div>
    );
  }

  const selectedCurrency = currencies.find(c => c.code === generalSettings.currency_code);

  return (
    <div id="general-settings-page" className="space-y-8">
      {/* General Settings Section */}
      <div className="bg-[#171717] border border-gray-800 rounded-lg p-6">
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
              value={generalSettings.site_name}
              onChange={(e) => setGeneralSettings({...generalSettings, site_name: e.target.value})}
              className="w-full px-3 py-2 bg-[#0b0b0b] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#d83f0a]"
            />
          </div>

          <div>
            <label htmlFor="support-email" className="block text-sm font-medium text-gray-300 mb-1">
              Support Email
            </label>
            <input
              id="support-email"
              type="email"
              value={generalSettings.support_email}
              onChange={(e) => setGeneralSettings({...generalSettings, support_email: e.target.value})}
              className="w-full px-3 py-2 bg-[#0b0b0b] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#d83f0a]"
            />
          </div>

          <div>
            <label htmlFor="default-language" className="block text-sm font-medium text-gray-300 mb-1">
              Default Language
            </label>
            <select
              id="default-language"
              value={generalSettings.default_language}
              onChange={(e) => setGeneralSettings({...generalSettings, default_language: e.target.value})}
              className="w-full px-3 py-2 bg-[#0b0b0b] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#d83f0a]"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="ja">Japanese</option>
              <option value="zh">Chinese</option>
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
              className="w-full px-3 py-2 bg-[#0b0b0b] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#d83f0a]"
            >
              <option value="UTC">UTC</option>
              <option value="GMT">GMT (London)</option>
              <option value="EST">EST (New York)</option>
              <option value="PST">PST (Los Angeles)</option>
              <option value="CST">CST (Chicago)</option>
              <option value="JST">JST (Tokyo)</option>
              <option value="AEST">AEST (Sydney)</option>
            </select>
          </div>
        </div>

        <div className="mt-6">
          <label htmlFor="site-description" className="block text-sm font-medium text-gray-300 mb-1">
            Site Description
          </label>
          <textarea
            id="site-description"
            rows={3}
            value={generalSettings.site_description}
            onChange={(e) => setGeneralSettings({...generalSettings, site_description: e.target.value})}
            className="w-full px-3 py-2 bg-[#0b0b0b] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#d83f0a]"
          />
        </div>
      </div>

      {/* Currency Settings Section */}
      <div id="currency-settings-section" className="bg-[#171717] border border-gray-800 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-[#d83f0a]/10 rounded-lg">
            <DollarSign className="h-6 w-6 text-[#d83f0a]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Currency Settings</h3>
            <p className="text-sm text-gray-400">Configure the default currency for pricing display</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="currency-code" className="block text-sm font-medium text-gray-300 mb-1">
              Currency
            </label>
            <select
              id="currency-code"
              value={generalSettings.currency_code}
              onChange={(e) => setGeneralSettings({...generalSettings, currency_code: e.target.value})}
              className="w-full px-3 py-2 bg-[#0b0b0b] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#d83f0a]"
            >
              {currencies.map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.symbol} - {currency.name} ({currency.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="currency-position" className="block text-sm font-medium text-gray-300 mb-1">
              Symbol Position
            </label>
            <select
              id="currency-position"
              value={generalSettings.currency_position}
              onChange={(e) => setGeneralSettings({...generalSettings, currency_position: e.target.value})}
              className="w-full px-3 py-2 bg-[#0b0b0b] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#d83f0a]"
            >
              <option value="before">Before amount (e.g., £10.00)</option>
              <option value="after">After amount (e.g., 10.00£)</option>
            </select>
          </div>
        </div>

        {selectedCurrency && (
          <div id="currency-preview" className="mt-4 p-4 bg-[#0b0b0b] border border-gray-700 rounded-lg">
            <p className="text-sm text-gray-400 mb-2">Preview:</p>
            <p className="text-2xl font-bold text-[#d83f0a]">
              {generalSettings.currency_position === 'before'
                ? `${selectedCurrency.symbol}25.00`
                : `25.00${selectedCurrency.symbol}`
              }
            </p>
          </div>
        )}
      </div>

      {/* User Registration Section */}
      <div className="bg-[#171717] border border-gray-800 rounded-lg p-6">
        <h4 className="font-medium text-white mb-4">User Registration & System</h4>

        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={generalSettings.allow_registration}
              onChange={(e) => setGeneralSettings({...generalSettings, allow_registration: e.target.checked})}
              className="w-4 h-4 rounded mr-3 bg-[#0b0b0b] border-gray-700 text-[#d83f0a] focus:ring-[#d83f0a]"
            />
            <span className="text-sm text-gray-300">Allow new user registration</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={generalSettings.require_email_verification}
              onChange={(e) => setGeneralSettings({...generalSettings, require_email_verification: e.target.checked})}
              className="w-4 h-4 rounded mr-3 bg-[#0b0b0b] border-gray-700 text-[#d83f0a] focus:ring-[#d83f0a]"
            />
            <span className="text-sm text-gray-300">Require email verification</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={generalSettings.maintenance_mode}
              onChange={(e) => setGeneralSettings({...generalSettings, maintenance_mode: e.target.checked})}
              className="w-4 h-4 rounded mr-3 bg-[#0b0b0b] border-gray-700 text-[#d83f0a] focus:ring-[#d83f0a]"
            />
            <span className="text-sm text-gray-300">Maintenance mode</span>
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          id="save-general-settings-btn"
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#d83f0a] text-white px-6 py-2 rounded-lg hover:bg-[#b8350a] disabled:opacity-50 flex items-center space-x-2 transition-colors"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>
    </div>
  );
}
