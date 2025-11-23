'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Database,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Settings,
  TrendingUp,
  RefreshCcw,
  Loader2
} from 'lucide-react'

interface NotionStatus {
  configured: boolean
  environment: {
    hasSecretKey: boolean
    hasDatabaseId: boolean
    hasParentPageId: boolean
  }
  cardCount?: number
  lastSync?: string
  error?: string
}

interface PopulationReportData {
  card_name: string
  card_game: string
  card_rarity?: string
  card_number?: string
  card_set?: string
  image_url?: string
  total_graded: number
  grade_10: number
  grade_9_5: number
  grade_9: number
  grade_8_5: number
  grade_8: number
  grade_7_5: number
  grade_7: number
  grade_6: number
  grade_5: number
  grade_4: number
  grade_3: number
  grade_2: number
  grade_1: number
  grade_10_percentage: number
  last_updated: string
}

export default function NotionIntegrationPage() {
  const [status, setStatus] = useState<NotionStatus | null>(null)
  const [cardData, setCardData] = useState<PopulationReportData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    checkNotionStatus()
  }, [])

  const checkNotionStatus = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/notion-sync')
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error('Error checking Notion status:', error)
      setMessage({ type: 'error', text: 'Failed to check Notion status' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAction = async (action: string) => {
    try {
      setActionLoading(action)
      setMessage(null)
      
      const response = await fetch('/api/admin/notion-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: data.message })
        
        if (action === 'get_report') {
          setCardData(data.data)
        } else {
          // Refresh status after other actions
          await checkNotionStatus()
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Action failed' })
      }
    } catch (error) {
      console.error(`Error executing ${action}:`, error)
      setMessage({ type: 'error', text: `Failed to execute ${action}` })
    } finally {
      setActionLoading('')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <Database className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Notion Integration</h1>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-lg text-gray-600">Checking Notion configuration...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Database className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Notion Integration</h1>
        </div>
        <button
          onClick={checkNotionStatus}
          className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <RefreshCcw className="h-4 w-4" />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Message */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg border ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center">
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2" />
            )}
            <span>{message.text}</span>
          </div>
        </motion.div>
      )}

      {/* Configuration Status */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Configuration Status
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                status?.environment?.hasSecretKey ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {status?.environment?.hasSecretKey ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">Secret Key</p>
                <p className="text-sm text-gray-500">NOTION_SECRET_KEY</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                status?.environment?.hasDatabaseId ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {status?.environment?.hasDatabaseId ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">Database ID</p>
                <p className="text-sm text-gray-500">NOTION_DATABASE_ID</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                status?.environment?.hasParentPageId ? 'bg-green-100' : 'bg-yellow-100'
              }`}>
                {status?.environment?.hasParentPageId ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">Parent Page ID</p>
                <p className="text-sm text-gray-500">NOTION_PARENT_PAGE_ID (optional)</p>
              </div>
            </div>
          </div>

          {!status?.configured && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                <div>
                  <h4 className="font-medium text-yellow-800">Configuration Required</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Please set the required environment variables in your .env file:
                  </p>
                  <pre className="mt-2 text-xs bg-yellow-100 p-2 rounded border overflow-x-auto">
{`NOTION_SECRET_KEY=your_notion_secret_key
NOTION_DATABASE_ID=your_database_id
NOTION_PARENT_PAGE_ID=your_parent_page_id  # optional`}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Create Database */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="font-medium text-gray-900">Create Database</h3>
              <p className="text-sm text-gray-500">Create new Notion database</p>
            </div>
          </div>
          <button
            onClick={() => handleAction('create_database')}
            disabled={!status?.configured || actionLoading === 'create_database'}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading === 'create_database' ? (
              <div className="flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating...
              </div>
            ) : (
              'Create Database'
            )}
          </button>
        </div>

        {/* Sync Data */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <RefreshCw className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="font-medium text-gray-900">Sync Population Report</h3>
              <p className="text-sm text-gray-500">Sync professional grading data to Notion</p>
            </div>
          </div>
          <button
            onClick={() => handleAction('sync_data')}
            disabled={!status?.configured || actionLoading === 'sync_data'}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading === 'sync_data' ? (
              <div className="flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Syncing...
              </div>
            ) : (
              'Sync Population Data'
            )}
          </button>
        </div>

        {/* View Report */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="font-medium text-gray-900">Population Report</h3>
              <p className="text-sm text-gray-500">View grade distribution data</p>
            </div>
          </div>
          <button
            onClick={() => handleAction('get_report')}
            disabled={actionLoading === 'get_report'}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading === 'get_report' ? (
              <div className="flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading...
              </div>
            ) : (
              'View Population Report'
            )}
          </button>
        </div>
      </div>

      {/* Card Popularity Report */}
      {cardData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Card Population Report
            </h3>
            <p className="text-sm text-gray-500 mt-1">Professional grading population data for {cardData.length} cards</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Card Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Graded
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade 10
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade 9/9.5
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade 8/8.5
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lower Grades
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade 10%
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cardData.map((card, index) => {
                  const grade9Total = (card.grade_9 || 0) + (card.grade_9_5 || 0)
                  const grade8Total = (card.grade_8 || 0) + (card.grade_8_5 || 0)
                  const lowerGrades = (card.grade_7_5 || 0) + (card.grade_7 || 0) + (card.grade_6 || 0) + 
                                     (card.grade_5 || 0) + (card.grade_4 || 0) + (card.grade_3 || 0) + 
                                     (card.grade_2 || 0) + (card.grade_1 || 0)
                  
                  return (
                    <tr key={`${card.card_name}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {card.image_url && (
                            <img 
                              src={card.image_url} 
                              alt={card.card_name}
                              className="h-16 w-12 object-cover rounded-md mr-4"
                              onError={(e) => { e.currentTarget.style.display = 'none' }}
                            />
                          )}
                          <div>
                            <div className="font-medium text-gray-900">{card.card_name}</div>
                            <div className="text-sm text-gray-500">
                              <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mr-2 ${
                                card.card_game === 'Pokemon' ? 'bg-red-100 text-red-800' :
                                card.card_game === 'Yu-Gi-Oh!' ? 'bg-blue-100 text-blue-800' :
                                card.card_game?.includes('Magic') ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {card.card_game}
                              </span>
                              {card.card_set && <span>Set: {card.card_set}</span>}
                              {card.card_number && <span className="ml-2">#{card.card_number}</span>}
                            </div>
                            {card.card_rarity && (
                              <div className="text-xs text-gray-400 mt-1">
                                <span className={`px-1 py-0.5 rounded ${
                                  card.card_rarity?.includes('Secret') ? 'bg-red-100 text-red-700' :
                                  card.card_rarity?.includes('Ultra') ? 'bg-orange-100 text-orange-700' :
                                  card.card_rarity?.includes('Rare') ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  {card.card_rarity}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-lg font-semibold text-gray-900">{card.total_graded}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-600">{card.grade_10 || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{grade9Total}</div>
                        <div className="text-xs text-gray-500">9.5: {card.grade_9_5 || 0} | 9: {card.grade_9 || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{grade8Total}</div>
                        <div className="text-xs text-gray-500">8.5: {card.grade_8_5 || 0} | 8: {card.grade_8 || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{lowerGrades}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`text-sm font-medium ${
                            card.grade_10_percentage >= 50 ? 'text-green-600' :
                            card.grade_10_percentage >= 25 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {card.grade_10_percentage?.toFixed(1) || '0.0'}%
                          </span>
                          <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                card.grade_10_percentage >= 50 ? 'bg-green-500' :
                                card.grade_10_percentage >= 25 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(card.grade_10_percentage || 0, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(card.last_updated).toLocaleDateString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <ExternalLink className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
          <div>
            <h4 className="font-medium text-blue-800">Professional Card Population Reports in Notion</h4>
            <div className="text-sm text-blue-700 mt-2 space-y-2">
              <p><strong>1. Setup Integration:</strong> Create Notion integration at notion.so/my-integrations</p>
              <p><strong>2. Configure Environment:</strong> Set NOTION_SECRET_KEY and NOTION_DATABASE_ID in your .env file</p>
              <p><strong>3. Create Database:</strong> Use the "Create Database" button to generate professional population report structure</p>
              <p><strong>4. Sync Grading Data:</strong> Population reports include grade distributions (10, 9.5, 9, 8.5, 8, etc.)</p>
              <p><strong>5. Professional Features:</strong> Grade percentages, rarity tracking, set information, and population analytics</p>
            </div>
            <a 
              href="https://developers.notion.com/docs/create-a-notion-integration" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Read Notion API Documentation
              <ExternalLink className="h-4 w-4 ml-1" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}