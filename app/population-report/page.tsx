'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Search,
  TrendingUp,
  ChevronRight,
  Calendar,
  Package,
  Trophy,
  BarChart3,
  ArrowLeft,
  Home,
  Star
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

interface FeaturedCard {
  id: number
  card_id: string
  card_name: string
  card_game: string
  card_grade: string
  grade_name?: string
  set_name: string
  rarity: string
  year_card?: string
  front_image?: string
  date_graded: string
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
  const [featuredCards, setFeaturedCards] = useState<FeaturedCard[]>([])
  const [totalStats, setTotalStats] = useState({
    totalCards: 0,
    totalGames: 0,
    avgGrade: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [supportedGames, setSupportedGames] = useState<Array<{
    id: string
    name: string
    logo_path: string | null
    icon: string
  }>>([])

  // Fetch games from database on mount
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await fetch('/api/population-report/games')
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.games) {
            const games = result.games.map((game: any) => {
              // Fallback icons
              const iconMap: { [key: string]: string } = {
                'pokemon': '⚡',
                'yugioh': '🔮',
                'mtg': '🌟',
                'magicthegathering': '🌟',
                'onepiece': '🏴‍☠️',
                'onepiececards': '🏴‍☠️'
              }

              return {
                id: game.id,
                name: game.name,
                logo_path: game.logo_path,
                icon: iconMap[game.id] || '🎮'
              }
            })
            setSupportedGames(games)
          }
        }
      } catch (error) {
        console.error('Error fetching games:', error)
        // Fallback to default games
        setSupportedGames([
          { id: 'pokemon', name: 'Pokemon', logo_path: null, icon: '⚡' },
          { id: 'yugioh', name: 'Yu-Gi-Oh!', logo_path: null, icon: '🔮' },
          { id: 'mtg', name: 'MTG', logo_path: null, icon: '🌟' },
          { id: 'onepiece', name: 'One Piece', logo_path: null, icon: '🏴‍☠️' }
        ])
      }
    }
    fetchGames()
  }, [])

  useEffect(() => {
    fetchGameStats()
    fetchFeaturedCards()
  }, [])

  const fetchFeaturedCards = async () => {
    try {
      const response = await fetch('/api/public/population-report/featured?limit=4')
      const result = await response.json()
      if (result.success) {
        setFeaturedCards(result.data)
      }
    } catch (error) {
      console.error('Error fetching featured cards:', error)
    }
  }

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
      const response = await fetch(`/api/population-report${params}`)
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
      const response = await fetch(`/api/population-report?${params}`)
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
      const response = await fetch(`/api/population-report?${params}`)
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
      const response = await fetch(`/api/population-report?${params}`)
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
      const response = await fetch(`/api/population-report/details?${params}`)
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

  const handleSearch = async () => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setSearchResults([])
      return
    }

    try {
      setIsSearching(true)
      const response = await fetch(`/api/public/population-report/search?search=${encodeURIComponent(searchTerm)}`)
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setSearchResults(result.data)
        }
      }
    } catch (error) {
      console.error('Error searching cards:', error)
    } finally {
      setIsSearching(false)
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
    if (grade === '10+') return 'text-pink-500'
    const numGrade = parseFloat(grade)
    if (numGrade >= 10) return 'text-green-500'
    if (numGrade >= 9) return 'text-blue-500'
    if (numGrade >= 8) return 'text-yellow-500'
    if (numGrade >= 7) return 'text-orange-500'
    return 'text-red-500'
  }

  if (isLoading && gameStats.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
        {/* Header */}
        <header className="bg-black/50 border-b border-gray-800 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <Link href="/" className="flex items-center space-x-2 text-[#d83f0a] hover:text-[#d66a0a]">
                <Home className="h-5 w-5" />
                <span>Back to Home</span>
              </Link>
              <h1 className="text-2xl font-bold text-white">Population Report</h1>
              <div></div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-[#d83f0a] animate-pulse mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Loading Population Data</h2>
              <p className="text-gray-400">Please wait while we fetch the latest grading statistics...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
      {/* Header */}
      <header className="bg-black/50 border-b border-gray-800 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-2 text-[#d83f0a] hover:text-[#d66a0a]">
              <Home className="h-5 w-5" />
              <span>Back to Home</span>
            </Link>
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-8 w-8 text-[#d83f0a]" />
              <h1 className="text-3xl font-bold text-white">Population Report</h1>
            </div>
            {(selectedGame || selectedYear || selectedSet || selectedCard) && (
              <button
                onClick={handleBack}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 border border-gray-700"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div id="population-search-section" className="bg-gray-900/50 border border-gray-800 rounded-lg shadow-lg p-6 mb-6 backdrop-blur-md">
          <div className="relative max-w-2xl mx-auto">
            <Search className="h-5 w-5 text-gray-500 absolute left-3 top-3" />
            <input
              id="population-search-input"
              type="text"
              placeholder="Search by card name or card ID number (e.g., 'Charizard' or '00000677')"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-24 py-2 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-[#d83f0a] focus:border-[#d83f0a]"
            />
            <button
              id="population-search-btn"
              onClick={handleSearch}
              disabled={isSearching}
              className="absolute right-2 top-1.5 px-4 py-1.5 bg-gradient-to-r from-[#d83f0a] to-[#d66a0a] text-white rounded-md hover:opacity-90 disabled:bg-gray-700 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div id="population-search-results" className="mt-6 max-w-2xl mx-auto">
              <h4 className="text-sm font-semibold text-white mb-3">
                Search Results ({searchResults.length} cards found)
              </h4>
              <div className="max-h-96 overflow-y-auto border border-gray-700 rounded-lg bg-gray-800/50">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-800 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Card ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Card Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Game</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {searchResults.map((card) => (
                      <tr key={card.id} className="hover:bg-gray-700/50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-mono">
                          <Link href={`/cert/${card.card_id}`}>
                            <span className="text-[#d83f0a] hover:text-[#d66a0a] font-semibold cursor-pointer hover:underline">
                              {card.card_id}
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">
                          {card.card_name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400">
                          {card.card_game}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded text-xs font-medium bg-gray-900 ${getGradeColor(card.card_grade)}`}>
                            {card.card_grade}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {searchTerm.length >= 2 && searchResults.length === 0 && !isSearching && (
            <div id="population-no-results" className="mt-6 max-w-2xl mx-auto text-center py-8 text-gray-400">
              No cards found matching "{searchTerm}"
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div id="population-stats-grid" className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div id="population-stats-total-graded" className="bg-gray-900/50 border border-gray-800 rounded-lg shadow-lg p-6 backdrop-blur-md">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-r from-[#d83f0a] to-[#d66a0a] rounded-lg">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Total Graded</p>
                <p className="text-2xl font-semibold text-white">{totalStats.totalCards.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div id="population-stats-games" className="bg-gray-900/50 border border-gray-800 rounded-lg shadow-lg p-6 backdrop-blur-md">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-r from-[#d83f0a] to-[#d66a0a] rounded-lg">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Games</p>
                <p className="text-2xl font-semibold text-white">{totalStats.totalGames}</p>
              </div>
            </div>
          </div>

          <div id="population-stats-avg-grade" className="bg-gray-900/50 border border-gray-800 rounded-lg shadow-lg p-6 backdrop-blur-md">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-r from-[#d83f0a] to-[#d66a0a] rounded-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Avg Grade</p>
                <p className="text-2xl font-semibold text-white">{totalStats.avgGrade.toFixed(1)}</p>
              </div>
            </div>
          </div>

          <div id="population-stats-gem-mint" className="bg-gray-900/50 border border-gray-800 rounded-lg shadow-lg p-6 backdrop-blur-md">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-r from-[#d83f0a] to-[#d66a0a] rounded-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">GEM MINT</p>
                <p className="text-2xl font-semibold text-white">{gameStats.reduce((sum, game) => sum + game.gem_mint_cards, 0).toLocaleString()}</p>
                <p className="text-xs text-gray-500">Grade 9-10</p>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Cards Section */}
        {featuredCards.length > 0 && !selectedGame && (
          <div id="population-featured-cards" className="bg-gray-900/50 border border-gray-800 rounded-lg shadow-lg p-6 mb-6 backdrop-blur-md">
            <div className="flex items-center mb-6">
              <Star className="h-6 w-6 text-yellow-400 fill-current mr-2" />
              <h3 className="text-lg font-medium text-white">Featured Graded Cards</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredCards.map((card) => (
                <Link
                  key={card.id}
                  href={`/cert/${card.card_id}`}
                  id={`featured-card-${card.id}`}
                  className="block bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-yellow-500/50 hover:bg-gray-700/50 transition-all group"
                >
                  <div className="aspect-[2.5/3.5] bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                    {card.front_image ? (
                      <img
                        src={card.front_image.startsWith('/') ? `/api/storage${card.front_image}` : `/api/storage/${card.front_image}`}
                        alt={card.card_name}
                        className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="text-5xl">🎴</div>
                    )}
                  </div>
                  <div className="mb-2">
                    <span className="inline-block px-2 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded text-xs font-bold">
                      ID: {card.card_id}
                    </span>
                  </div>
                  <h4 className="font-bold text-white mb-1 truncate group-hover:text-yellow-400 transition-colors">
                    {card.card_name}
                  </h4>
                  <p className="text-xs text-gray-400 mb-1">{card.card_game}</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-bold ${getGradeColor(card.card_grade)}`}>
                      Grade: {card.card_grade}
                    </span>
                    <span className="text-xs text-gray-500">{card.set_name}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Navigation Breadcrumbs */}
        {(selectedGame || selectedYear || selectedSet || selectedCard) && (
          <div id="population-breadcrumbs" className="bg-gray-900/50 border border-gray-800 rounded-lg shadow-lg p-4 mb-6 backdrop-blur-md">
            <nav className="flex items-center space-x-2 text-sm">
              <button onClick={() => setSelectedGame(null)} className="text-[#d83f0a] hover:text-[#d66a0a] font-medium">
                All Games
              </button>
              {selectedGame && (
                <>
                  <ChevronRight className="h-4 w-4 text-gray-600" />
                  <button onClick={() => setSelectedYear(null)} className="text-[#d83f0a] hover:text-[#d66a0a] font-medium">
                    {getGameDisplayName(selectedGame)}
                  </button>
                </>
              )}
              {selectedYear && (
                <>
                  <ChevronRight className="h-4 w-4 text-gray-600" />
                  <button onClick={() => setSelectedSet(null)} className="text-[#d83f0a] hover:text-[#d66a0a] font-medium">
                    {selectedYear}
                  </button>
                </>
              )}
              {selectedSet && (
                <>
                  <ChevronRight className="h-4 w-4 text-gray-600" />
                  <button onClick={() => setSelectedCard(null)} className="text-[#d83f0a] hover:text-[#d66a0a] font-medium">
                    {selectedSet}
                  </button>
                </>
              )}
              {selectedCard && (
                <>
                  <ChevronRight className="h-4 w-4 text-gray-600" />
                  <span className="text-gray-300">{selectedCard}</span>
                </>
              )}
            </nav>
          </div>
        )}

        {/* Main Content */}
        <div id="population-main-content" className="bg-gray-900/50 border border-gray-800 rounded-lg shadow-lg overflow-hidden backdrop-blur-md">
          {!selectedGame && (
            /* Game Selection */
            <div id="population-game-selection" className="p-6">
              <h3 className="text-lg font-medium text-white mb-6">Select Category by Game</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {supportedGames.map((game) => (
                  <button
                    key={game.id}
                    id={`population-game-card-${game.id}`}
                    onClick={() => handleGameSelect(game.id)}
                    className="p-6 border-2 border-gray-700 rounded-lg hover:border-[#d83f0a] hover:bg-gray-700/50 transition-all group bg-gray-800/50 flex flex-col items-center justify-center"
                  >
                    {game.logo_path ? (
                      <img
                        src={`/api/storage/${game.logo_path}`}
                        alt={game.name}
                        className="h-[60px] object-contain mb-3"
                      />
                    ) : (
                      <span className="text-4xl mb-3">{game.icon}</span>
                    )}
                    <p className="text-xs text-gray-400 group-hover:text-[#d83f0a] transition-colors">
                      View population report
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedGame && !selectedYear && (
            /* Year Selection */
            <div id="population-year-selection" className="p-6">
              <h3 className="text-lg font-medium text-white mb-6">
                {getGameDisplayName(selectedGame)} - Cards Graded by Year
              </h3>
              <div className="overflow-x-auto">
                <table id="population-year-table" className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Year</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Total Cards</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Sets</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-900/30 divide-y divide-gray-700">
                    {yearData.map((year) => (
                      <tr key={year.year} id={`population-year-row-${year.year}`} className="hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                          {year.year}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {year.total_cards.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {year.total_sets} sets
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleYearSelect(year.year)}
                            className="text-[#d83f0a] hover:text-[#d66a0a] font-medium"
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
            <div id="population-set-selection" className="p-6">
              <h3 className="text-lg font-medium text-white mb-6">
                {getGameDisplayName(selectedGame || '')} {selectedYear} - Sets
              </h3>
              <div className="overflow-x-auto">
                <table id="population-set-table" className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Set Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Total Cards</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-900/30 divide-y divide-gray-700">
                    {setData.map((set) => (
                      <tr key={set.set_name} id={`population-set-row-${set.set_name.replace(/\s+/g, '-')}`} className="hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                          {set.set_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {set.total_cards.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleSetSelect(set.set_name)}
                            className="text-[#d83f0a] hover:text-[#d66a0a] font-medium"
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
            <div id="population-card-selection" className="p-6">
              <h3 className="text-lg font-medium text-white mb-6">
                {selectedSet} - Cards
              </h3>
              <div className="overflow-x-auto">
                <table id="population-card-table" className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Card Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Total Graded</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Grade Distribution</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-900/30 divide-y divide-gray-700">
                    {cardData.map((card) => (
                      <tr key={`${card.card_name}-${card.card_id}`} id={`population-card-row-${card.card_id}`} className="hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                          {card.card_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {card.total_graded.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            {card.grade_10 > 0 && (
                              <span className={`px-2 py-1 rounded text-xs font-medium bg-gray-800 ${getGradeColor('10')}`}>
                                10: {card.grade_10}
                              </span>
                            )}
                            {card.grade_9 > 0 && (
                              <span className={`px-2 py-1 rounded text-xs font-medium bg-gray-800 ${getGradeColor('9')}`}>
                                9: {card.grade_9}
                              </span>
                            )}
                            {card.grade_8 > 0 && (
                              <span className={`px-2 py-1 rounded text-xs font-medium bg-gray-800 ${getGradeColor('8')}`}>
                                8: {card.grade_8}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleCardSelect(card.card_name)}
                            className="text-[#d83f0a] hover:text-[#d66a0a] font-medium"
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

          {selectedCard && cardDetails && (
            /* Card Details */
            <div id="population-card-details" className="p-6">
              <h3 className="text-lg font-medium text-white mb-6">
                {selectedCard} - Grading Report
              </h3>

              {/* Card Summary */}
              <div id="population-card-summary-grid" className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-6">
                <div id="population-card-summary-total" className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-[#d83f0a]">{cardDetails.summary.totalGraded}</div>
                  <div className="text-sm text-gray-400">Total Graded</div>
                </div>
                <div id="population-card-summary-avg" className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-[#d83f0a]">{cardDetails.summary.avgGrade.toFixed(2)}</div>
                  <div className="text-sm text-gray-400">Average Grade</div>
                </div>
                <div id="population-card-summary-highest" className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-[#d83f0a]">{cardDetails.summary.highestGrade}</div>
                  <div className="text-sm text-gray-400">Highest Grade</div>
                </div>
                <div id="population-card-summary-rank" className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-[#d83f0a]">#{cardDetails.summary.popularityRank}</div>
                  <div className="text-sm text-gray-400">Popularity Rank</div>
                </div>
              </div>

              {/* Grade Distribution Chart */}
              <div id="population-grade-distribution" className="mb-8">
                <h4 className="text-md font-medium text-white mb-4">Grade Distribution</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-4">
                  {cardDetails.gradeDistribution.map((grade) => (
                    <div key={grade.grade} id={`population-grade-dist-${grade.grade}`} className="text-center">
                      <div className={`p-4 rounded-lg border border-gray-700 bg-gray-800/50`}>
                        <div className={`text-xl font-bold ${getGradeColor(grade.grade)}`}>
                          {grade.count}
                        </div>
                        <div className="text-sm text-gray-400">Grade {grade.grade}</div>
                        <div className="text-xs text-gray-500">{grade.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed List */}
              <div id="population-individual-cards">
                <h4 className="text-md font-medium text-white mb-4">Individual Cards</h4>
                <div className="overflow-x-auto">
                  <table id="population-individual-cards-table" className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-800/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Grade</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Grade Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rarity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date Graded</th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-900/30 divide-y divide-gray-700">
                      {cardDetails.individualCards.map((detail, index) => (
                        <tr key={index} id={`population-individual-card-${detail.card_id}`} className="hover:bg-gray-700/50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                            <Link href={`/cert/${detail.card_id}`}>
                              <span className="text-[#d83f0a] hover:text-[#d66a0a] font-semibold cursor-pointer hover:underline">
                                {detail.card_id}
                              </span>
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded text-sm font-medium bg-gray-800 ${getGradeColor(detail.grade.toString())}`}>
                              {detail.grade}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                            {detail.grade_notes || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {detail.card_rarity || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
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
    </div>
  )
}