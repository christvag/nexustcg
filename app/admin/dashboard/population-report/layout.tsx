'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Plus, Database, Settings } from 'lucide-react';

const tabs = [
  { href: '/admin/dashboard/population-report', label: 'Overview', icon: BarChart3, id: 'pr-tab-overview' },
  { href: '/admin/dashboard/population-report/add-card', label: 'Add Card', icon: Plus, id: 'pr-tab-add-card' },
  { href: '/admin/dashboard/population-report/cards', label: 'Population Report', icon: Database, id: 'pr-tab-cards' },
  { href: '/admin/dashboard/population-report/settings', label: 'Settings', icon: Settings, id: 'pr-tab-settings' },
];

export default function PopulationReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-6" id="pr-main-container">
      {/* Header */}
      <div id="pr-header">
        <h1 className="text-3xl font-bold text-white mb-2" id="pr-title">Population Report Management</h1>
        <p className="text-gray-400" id="pr-subtitle">
          Manage graded cards, view analytics, and configure population report settings
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700" id="pr-tabs-container">
        <nav className="flex space-x-8" id="pr-tabs-nav">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                id={tab.id}
                className={`flex items-center space-x-2 px-1 py-4 border-b-2 font-medium transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div id="pr-content">
        {children}
      </div>
    </div>
  );
}
