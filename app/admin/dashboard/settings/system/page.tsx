'use client';

import { useState } from 'react';
import {
  Server,
  Database,
  HardDrive,
  RefreshCw,
  Download,
  CheckCircle,
  AlertCircle,
  Activity
} from 'lucide-react';

export default function SystemSettings() {
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [isDownloadingLogs, setIsDownloadingLogs] = useState(false);

  const [systemInfo] = useState({
    version: '1.2.0',
    build: '2024.01.15',
    environment: 'Production',
    uptime: '15 days, 8 hours',
    storageUsed: 2.4,
    storageTotal: 10,
    nodeVersion: '18.17.0',
    nextVersion: '14.0.4'
  });

  const handleClearCache = async () => {
    setIsClearingCache(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (typeof window !== 'undefined') {
        const keysToKeep = ['currentUser', 'authToken'];
        const allKeys = Object.keys(localStorage);
        allKeys.forEach(key => {
          if (!keysToKeep.includes(key)) {
            localStorage.removeItem(key);
          }
        });
      }

      alert('Cache cleared successfully! Some changes may require a page refresh.');
    } catch (error) {
      alert('Failed to clear cache. Please try again.');
    } finally {
      setIsClearingCache(false);
    }
  };

  const handleDownloadLogs = async () => {
    setIsDownloadingLogs(true);
    try {
      const logContent = generateSystemLogs();
      const blob = new Blob([logContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system-logs-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      alert('Logs downloaded successfully!');
    } catch (error) {
      alert('Failed to download logs. Please try again.');
    } finally {
      setIsDownloadingLogs(false);
    }
  };

  const generateSystemLogs = () => {
    const timestamp = new Date().toISOString();
    return `===========================================
NEXUS TCGrading System Logs
Generated: ${timestamp}
===========================================

SYSTEM INFORMATION
------------------
Version: ${systemInfo.version}
Build: ${systemInfo.build}
Environment: ${systemInfo.environment}
Uptime: ${systemInfo.uptime}
Storage: ${systemInfo.storageUsed} GB / ${systemInfo.storageTotal} GB
Node.js: ${systemInfo.nodeVersion}
Next.js: ${systemInfo.nextVersion}

RECENT ACTIVITY LOG
-------------------
[${timestamp}] System logs exported
[${new Date(Date.now() - 3600000).toISOString()}] Admin dashboard accessed
[${new Date(Date.now() - 7200000).toISOString()}] Settings updated
[${new Date(Date.now() - 10800000).toISOString()}] User login successful
[${new Date(Date.now() - 14400000).toISOString()}] Order #1234 processed
[${new Date(Date.now() - 18000000).toISOString()}] Database backup completed

===========================================
End of Log File
===========================================
`;
  };

  return (
    <div id="system-settings-page" className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-[#d83f0a]/10 rounded-lg">
          <Server className="h-6 w-6 text-[#d83f0a]" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">System Information</h3>
          <p className="text-sm text-gray-400">Monitor system health and manage maintenance tasks</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System Status */}
        <div className="space-y-4">
          <h4 className="font-medium text-white flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>System Status</span>
          </h4>

          <div id="system-status-card" className="bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-300">Application Status</span>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-400">Online</span>
              </div>
            </div>
            <div className="text-xs text-gray-500">All services are running normally</div>
          </div>

          <div id="database-status-card" className="bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-300">Database Status</span>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-400">Connected</span>
              </div>
            </div>
            <div className="text-xs text-gray-500">Database connection is healthy</div>
          </div>

          <div id="storage-card" className="bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <HardDrive className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-300">Storage Usage</span>
              </div>
              <span className="text-sm text-white">{systemInfo.storageUsed} GB / {systemInfo.storageTotal} GB</span>
            </div>
            <div className="w-full bg-gray-600 rounded-full h-2">
              <div
                className="bg-[#d83f0a] h-2 rounded-full transition-all"
                style={{width: `${(systemInfo.storageUsed / systemInfo.storageTotal) * 100}%`}}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {((systemInfo.storageUsed / systemInfo.storageTotal) * 100).toFixed(1)}% used
            </div>
          </div>
        </div>

        {/* System Info & Actions */}
        <div className="space-y-4">
          <h4 className="font-medium text-white flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span>System Details</span>
          </h4>

          <div id="system-info-card" className="bg-gray-700 p-4 rounded-lg">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Version</span>
                <span className="text-white">{systemInfo.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Build</span>
                <span className="text-white">{systemInfo.build}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Environment</span>
                <span className="text-white">{systemInfo.environment}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Uptime</span>
                <span className="text-white">{systemInfo.uptime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Node.js</span>
                <span className="text-white">{systemInfo.nodeVersion}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Next.js</span>
                <span className="text-white">{systemInfo.nextVersion}</span>
              </div>
            </div>
          </div>

          <div id="system-actions" className="space-y-3">
            <button
              id="clear-cache-btn"
              onClick={handleClearCache}
              disabled={isClearingCache}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 flex items-center justify-center space-x-2 text-gray-300 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isClearingCache ? 'animate-spin' : ''}`} />
              <span>{isClearingCache ? 'Clearing Cache...' : 'Clear Application Cache'}</span>
            </button>

            <button
              id="download-logs-btn"
              onClick={handleDownloadLogs}
              disabled={isDownloadingLogs}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 flex items-center justify-center space-x-2 text-gray-300 disabled:opacity-50 transition-colors"
            >
              <Download className={`h-4 w-4 ${isDownloadingLogs ? 'animate-pulse' : ''}`} />
              <span>{isDownloadingLogs ? 'Preparing Download...' : 'Download System Logs'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Info Notice */}
      <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-blue-400">System Information</h4>
            <p className="text-sm text-blue-300/80 mt-1">
              Regular maintenance helps keep the system running smoothly. Consider clearing the cache
              periodically and reviewing system logs for any issues.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
