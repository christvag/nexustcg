'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Search,
  TrendingUp,
  ChevronRight,
  Calendar,
  Package,
  Trophy,
  BarChart3,
  ArrowLeft
} from 'lucide-react'

interface ApiGameData {
  game_type: string
  card_game: string
  total_cards: number
  gem_mint_cards: number
  near_mint_plus: number
  avg_grade: number
}

interface ApiYearData {
  year: string
  total_cards: number
  gem_mint_cards: number
  avg_grade: number
  total_sets: number
}

interface ApiSetData {
  set_name: string
  total_cards: number
  gem_mint_cards: number
  near_mint_plus: number
  avg_grade: number
  unique_cards: number
}

interface ApiCardData {
  card_name: string
  card_id: string
  card_rarity: string
  total_graded: number
  grade_10: number
  grade_9: number
  grade_8: number
  grade_7: number
  grade_6: number
  grade_5_below: number
  avg_grade: number
  highest_grade: number
  lowest_grade: number
}

interface CardDetails {
  cardName: string
  game: string
  year: string
  set: string
  summary: {
    totalGraded: number
    avgGrade: number
    highestGrade: number
    lowestGrade: number
    popularityRank: string | number
  }
  gradeDistribution: Array<{
    grade: string
    count: number
    percentage: string
  }>
  individualCards: Array<{
    id: number
    card_id: string
    card_name: string
    card_game: string
    card_rarity: string
    grade: number
    grade_notes: string
    gradedDate: string
  }>
}

export default function PopulationReportPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<string | null>(null)
  const [selectedSet, setSelectedSet] = useState<string | null>(null)
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [gameStats, setGameStats] = useState<ApiGameData[]>([])
  const [yearData, setYearData] = useState<ApiYearData[]>([])
  const [setData, setSetData] = useState<ApiSetData[]>([])
  const [cardData, setCardData] = useState<ApiCardData[]>([])
  const [cardDetails, setCardDetails] = useState<CardDetails | null>(null)
  const [totalStats, setTotalStats] = useState({
    totalCards: 0,
    totalGames: 0,
    avgGrade: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  // Pre-defined games
  const supportedGames = [
    { id: 'pokemon', name: 'Pokemon TCG', color: 'bg-red-100 text-red-800', icon: '⚡' },
    { id: 'yugioh', name: 'Yu-Gi-Oh!', color: 'bg-blue-100 text-blue-800', icon: '🔮' },
    { id: 'mtg', name: 'Magic: The Gathering', color: 'bg-green-100 text-green-800', icon: '🌟' },
    { id: 'onepiece', name: 'One Piece Cards', color: 'bg-orange-100 text-orange-800', icon: '🏴‍☠️' }
  ]

  useEffect(() => {
    fetchGameStats()
  }, [])

  useEffect(() => {
    if (selectedGame && !selectedYear) {
      fetchYearData()
    }
  }, [selectedGame])

  useEffect(() => {
    if (selectedGame && selectedYear && !selectedSet) {
      fetchSetData()
    }
  }, [selectedGame, selectedYear])

  useEffect(() => {
    if (selectedGame && selectedYear && selectedSet && !selectedCard) {
      fetchCardData()
    }
  }, [selectedGame, selectedYear, selectedSet])

  const fetchGameStats = async () => {
    try {
      setIsLoading(true)
      const params = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/admin/population-report${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data?.games) {
          const games = result.data.games || []
          setGameStats(games)
          const totalCards = games.reduce((sum: number, game: ApiGameData) => sum + game.total_cards, 0)
          setTotalStats({
            totalCards,
            totalGames: games.length,
            avgGrade: games.length > 0 ? games.reduce((sum: number, game: ApiGameData) => sum + game.avg_grade, 0) / games.length : 0
          })
        }
      }
    } catch (error) {
      console.error('Error fetching game stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchYearData = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        game: selectedGame || '',
        ...(searchTerm && { search: searchTerm })
      })
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/admin/population-report?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setYearData(result.data.years || [])
        }
      }
    } catch (error) {
      console.error('Error fetching year data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSetData = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        game: selectedGame || '',
        year: selectedYear || '',
        ...(searchTerm && { search: searchTerm })
      })
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/admin/population-report?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setSetData(result.data.sets || [])
        }
      }
    } catch (error) {
      console.error('Error fetching set data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCardData = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        game: selectedGame || '',
        year: selectedYear || '',
        set: selectedSet || '',
        ...(searchTerm && { search: searchTerm })
      })
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/admin/population-report?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setCardData(result.data.cards || [])
        }
      }
    } catch (error) {
      console.error('Error fetching card data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCardDetails = async (cardName: string) => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        cardName,
        ...(selectedGame && { game: selectedGame }),
        ...(selectedYear && { year: selectedYear }),
        ...(selectedSet && { set: selectedSet })
      })
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/admin/population-report/details?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setCardDetails(result.data)
        }
      }
    } catch (error) {
      console.error('Error fetching card details:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGameSelect = (gameId: string) => {
    setSelectedGame(gameId)
    setSelectedYear(null)
    setSelectedSet(null)
    setSelectedCard(null)
    setYearData([])
    setSetData([])
    setCardData([])
    setCardDetails(null)
  }

  const handleYearSelect = (year: string) => {
    setSelectedYear(year)
    setSelectedSet(null)
    setSelectedCard(null)
    setSetData([])
    setCardData([])
    setCardDetails(null)
  }

  const handleSetSelect = (setName: string) => {
    setSelectedSet(setName)
    setSelectedCard(null)
    setCardData([])
    setCardDetails(null)
  }

  const handleCardSelect = (cardName: string) => {
    setSelectedCard(cardName)
    fetchCardDetails(cardName)
  }

  const handleBack = () => {
    if (selectedCard) {
      setSelectedCard(null)
      setCardDetails(null)
    } else if (selectedSet) {
      setSelectedSet(null)
      setCardData([])
    } else if (selectedYear) {
      setSelectedYear(null)
      setSetData([])
    } else if (selectedGame) {
      setSelectedGame(null)
      setYearData([])
    }
  }

  const getCurrentGameStats = () => {
    return gameStats.find(g => g.game_type === selectedGame)
  }

  const getGameDisplayName = (gameId: string) => {
    const gameMap: { [key: string]: string } = {
      'pokemon': 'Pokemon TCG',
      'yugioh': 'Yu-Gi-Oh!',
      'mtg': 'Magic: The Gathering',
      'onepiece': 'One Piece Cards'
    }
    return gameMap[gameId] || gameId
  }

  const getGradeColor = (grade: string) => {
    if (grade === '10+') return 'text-pink-600'
    const numGrade = parseFloat(grade)
    if (numGrade >= 10) return 'text-green-600'
    if (numGrade >= 9) return 'text-blue-600'
    if (numGrade >= 8) return 'text-yellow-600'
    if (numGrade >= 7) return 'text-orange-600'
    return 'text-red-600'
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <TrendingUp className="h-8 w-8 text-blue-600 animate-pulse" />
          <h1 className="text-3xl font-bold text-gray-900">Population Report</h1>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 animate-pulse">
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <TrendingUp className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Population Report</h1>
        </div>
        
        {(selectedGame || selectedYear || selectedSet || selectedCard) && (
          <button
            onClick={handleBack}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="relative max-w-2xl">
          <Search className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by card name, card game, id number, set name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchGameStats()}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Trophy className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Graded</p>
              <p className="text-2xl font-semibold text-gray-900">{totalStats.totalCards.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Games</p>
              <p className="text-2xl font-semibold text-gray-900">{totalStats.totalGames}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-amber-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-amber-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Grade</p>
              <p className="text-2xl font-semibold text-gray-900">{totalStats.avgGrade.toFixed(1)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">GEM MINT</p>
              <p className="text-2xl font-semibold text-gray-900">{gameStats.reduce((sum, game) => sum + game.gem_mint_cards, 0).toLocaleString()}</p>
              <p className="text-xs text-gray-500">Grade 9-10</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Breadcrumbs */}
      {(selectedGame || selectedYear || selectedSet || selectedCard) && (
        <div className="bg-white rounded-lg shadow p-4">
          <nav className="flex items-center space-x-2 text-sm">
            <button onClick={() => setSelectedGame(null)} className="text-blue-600 hover:text-blue-800">
              All Games
            </button>
            {selectedGame && (
              <>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <button onClick={() => setSelectedYear(null)} className="text-blue-600 hover:text-blue-800">
                  {getGameDisplayName(selectedGame)}
                </button>
              </>
            )}
            {selectedYear && (
              <>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <button onClick={() => setSelectedSet(null)} className="text-blue-600 hover:text-blue-800">
                  {selectedYear}
                </button>
              </>
            )}
            {selectedSet && (
              <>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <button onClick={() => setSelectedCard(null)} className="text-blue-600 hover:text-blue-800">
                  {selectedSet}
                </button>
              </>
            )}
            {selectedCard && (
              <>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">{selectedCard}</span>
              </>
            )}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {!selectedGame && (
          /* Game Selection */
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Select Category by Game</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {supportedGames.map((game) => (
                <button
                  key={game.id}
                  onClick={() => handleGameSelect(game.id)}
                  className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{game.icon}</span>
                    <div>
                      <h4 className="font-medium text-gray-900 group-hover:text-blue-600">
                        {game.name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        View population report
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedGame && !selectedYear && (
          /* Year Selection */
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">
              {getGameDisplayName(selectedGame || '')} - Cards Graded by Year
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cards</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sets</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {yearData.map((year) => (
                    <tr key={year.year} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {year.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {year.total_cards.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {year.total_sets} sets
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleYearSelect(year.year)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View Sets →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedYear && !selectedSet && (
          /* Set Selection */
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">
              {getGameDisplayName(selectedGame || '')} {selectedYear} - Sets
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Set Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cards</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {setData.map((set) => (
                    <tr key={set.set_name} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {set.set_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {set.total_cards.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleSetSelect(set.set_name)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View Cards →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedSet && !selectedCard && (
          /* Card Selection */
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">
              {selectedSet} - Cards
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Card Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Graded</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade Distribution</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cardData.map((card) => (
                    <tr key={`${card.card_name}-${card.card_id}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {card.card_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {card.total_graded.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          {card.grade_10 > 0 && (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getGradeColor('10')}`}>
                              10: {card.grade_10}
                            </span>
                          )}
                          {card.grade_9 > 0 && (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getGradeColor('9')}`}>
                              9: {card.grade_9}
                            </span>
                          )}
                          {card.grade_8 > 0 && (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getGradeColor('8')}`}>
                              8: {card.grade_8}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleCardSelect(card.card_name)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View Details →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedCard && (
          /* Card Details */
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">
              {selectedCard} - Grading Report
            </h3>
            
            {/* Card Summary */}
            <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{cardDetails?.summary.totalGraded}</div>
                <div className="text-sm text-gray-600">Total Graded</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{cardDetails?.summary.avgGrade.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Average Grade</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{cardDetails?.summary.highestGrade}</div>
                <div className="text-sm text-gray-600">Highest Grade</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">#{cardDetails?.summary.popularityRank}</div>
                <div className="text-sm text-gray-600">Popularity Rank</div>
              </div>
            </div>

            {/* Grade Distribution Chart */}
            <div className="mb-8">
              <h4 className="text-md font-medium text-gray-800 mb-4">Grade Distribution</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-4">
                {cardDetails?.gradeDistribution.map((grade) => (
                  <div key={grade.grade} className="text-center">
                    <div className={`p-4 rounded-lg border`}>
                      <div className={`text-xl font-bold ${getGradeColor(grade.grade)}`}>
                        {grade.count}
                      </div>
                      <div className="text-sm text-gray-600">Grade {grade.grade}</div>
                      <div className="text-xs text-gray-500">{grade.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed List */}
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-4">Individual Cards</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rarity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Graded</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {cardDetails?.individualCards.map((detail, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                          {detail.card_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded text-sm font-medium ${getGradeColor(detail.grade.toString())}`}>
                            {detail.grade}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {detail.grade_notes || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {detail.card_rarity || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {detail.gradedDate}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}