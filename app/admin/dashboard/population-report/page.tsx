'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, TrendingUp, Package, Users } from 'lucide-react';

interface AnalyticsData {
  totalCards: number;
  lastSubmission: {
    cardName: string;
    date: string;
    grade: string;
  } | null;
  byGame: { game: string; count: number }[];
  byRarity: { rarity: string; count: number }[];
  byMonth: { month: string; count: number }[];
}

export default function PopulationReportOverview() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalCards: 0,
    lastSubmission: null,
    byGame: [],
    byRarity: [],
    byMonth: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/population-report/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12" id="pr-overview-loading">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="pr-overview-container">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" id="pr-stats-grid">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700" id="pr-stat-total-cards">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Cards Graded</p>
              <p className="text-3xl font-bold text-white mt-2">{analytics.totalCards}</p>
            </div>
            <div className="bg-blue-900/20 p-3 rounded-lg">
              <Package className="h-8 w-8 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700" id="pr-stat-last-submission">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Last Submission</p>
              {analytics.lastSubmission ? (
                <>
                  <p className="text-lg font-semibold text-white mt-2">
                    {analytics.lastSubmission.cardName}
                  </p>
                  <p className="text-xs text-gray-500">
                    Grade: {analytics.lastSubmission.grade}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(analytics.lastSubmission.date).toLocaleDateString()}
                  </p>
                </>
              ) : (
                <p className="text-lg text-gray-500 mt-2">No submissions yet</p>
              )}
            </div>
            <div className="bg-green-900/20 p-3 rounded-lg">
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700" id="pr-stat-unique-games">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Card Games</p>
              <p className="text-3xl font-bold text-white mt-2">{analytics.byGame.length}</p>
            </div>
            <div className="bg-purple-900/20 p-3 rounded-lg">
              <BarChart3 className="h-8 w-8 text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700" id="pr-stat-unique-rarities">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Unique Rarities</p>
              <p className="text-3xl font-bold text-white mt-2">{analytics.byRarity.length}</p>
            </div>
            <div className="bg-yellow-900/20 p-3 rounded-lg">
              <Users className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="pr-charts-grid">
        {/* By Game */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700" id="pr-chart-by-game">
          <h3 className="text-lg font-semibold text-white mb-4">Cards by Game</h3>
          <div className="space-y-3">
            {analytics.byGame.length > 0 ? (
              analytics.byGame.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-300">{item.game}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${(item.count / analytics.totalCards) * 100}%`
                        }}
                      />
                    </div>
                    <span className="text-white font-semibold w-12 text-right">{item.count}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No data available</p>
            )}
          </div>
        </div>

        {/* By Rarity */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700" id="pr-chart-by-rarity">
          <h3 className="text-lg font-semibold text-white mb-4">Cards by Rarity</h3>
          <div className="space-y-3">
            {analytics.byRarity.length > 0 ? (
              analytics.byRarity.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-300">{item.rarity}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{
                          width: `${(item.count / analytics.totalCards) * 100}%`
                        }}
                      />
                    </div>
                    <span className="text-white font-semibold w-12 text-right">{item.count}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No data available</p>
            )}
          </div>
        </div>

        {/* By Month */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700" id="pr-chart-by-month">
          <h3 className="text-lg font-semibold text-white mb-4">Submissions by Month</h3>
          <div className="space-y-3">
            {analytics.byMonth.length > 0 ? (
              analytics.byMonth.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-300">{item.month}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{
                          width: `${(item.count / Math.max(...analytics.byMonth.map(m => m.count))) * 100}%`
                        }}
                      />
                    </div>
                    <span className="text-white font-semibold w-12 text-right">{item.count}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
