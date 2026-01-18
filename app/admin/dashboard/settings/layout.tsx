'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Globe,
  CreditCard,
  Mail,
  Bell,
  Shield,
  Server,
  ChevronRight,
  Settings
} from 'lucide-react';

const settingsNavItems = [
  { href: '/admin/dashboard/settings/general', label: 'General', icon: Globe, description: 'Site name, language, timezone' },
  { href: '/admin/dashboard/settings/payment', label: 'Payment', icon: CreditCard, description: 'Payment gateways, fees' },
  { href: '/admin/dashboard/settings/email', label: 'Email', icon: Mail, description: 'SMTP, templates, automation' },
  { href: '/admin/dashboard/settings/notification', label: 'Notification', icon: Bell, description: 'Alerts, preferences' },
  { href: '/admin/dashboard/settings/security', label: 'Security', icon: Shield, description: 'Passwords, 2FA, sessions' },
  { href: '/admin/dashboard/settings/system', label: 'System', icon: Server, description: 'Status, logs, cache' },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Check if current path matches or is a child of a nav item
  const isActive = (href: string) => {
    if (href === '/admin/dashboard/settings/email') {
      return pathname === href || pathname.startsWith(href + '/');
    }
    return pathname === href;
  };

  return (
    <div id="settings-layout-container" className="space-y-6">
      {/* Header */}
      <div id="settings-header">
        <div className="flex items-center space-x-2 text-gray-400 text-sm mb-2">
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </div>
        <h2 className="text-2xl font-bold text-white">System Settings</h2>
        <p className="text-gray-400 mt-1">Manage your platform configuration and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div id="settings-sidebar" className="lg:w-64 flex-shrink-0">
          <nav className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            {settingsNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  id={`settings-nav-${item.label.toLowerCase()}`}
                  className={`flex items-center justify-between px-4 py-3 border-b border-gray-700 last:border-b-0 transition-colors ${
                    active
                      ? 'bg-[#d83f0a]/10 text-[#d83f0a] border-l-2 border-l-[#d83f0a]'
                      : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="h-5 w-5" />
                    <div>
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </div>
                  </div>
                  <ChevronRight className={`h-4 w-4 ${active ? 'text-[#d83f0a]' : 'text-gray-500'}`} />
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div id="settings-content" className="flex-1 min-w-0">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
