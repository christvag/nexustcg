'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CartItem } from '@/lib/types'
import Image from 'next/image'

// Loading Card Skeleton Component
const LoadingCardSkeleton = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden relative"
    >
      <div className="aspect-[5/7] relative bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        {/* Circular Progress Pie */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-12 h-12">
              {/* Background circle */}
              <div className="absolute inset-0 rounded-full border-4 border-gray-300 dark:border-gray-600"></div>
              {/* Animated progress circle */}
              <div 
                className="absolute inset-0 rounded-full border-4 border-gaming-primary border-t-transparent animate-spin"
                style={{ animationDuration: '1.5s' }}
              ></div>
              {/* Center dot */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-gaming-primary rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-1 animate-pulse"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
      </div>
    </motion.div>
  )
}

const defaultGames = ['All Games', 'Yu Gi Oh', 'Pokemon', 'MTG', 'Metazoo', 'One Piece', 'Player Cards']

const packageInfo: Record<string, { name: string; price: number }> = {
  authentication: { name: 'Authentication', price: 10 },
  bulk: { name: 'Bulk Grading', price: 12 },
  standard: { name: 'Standard', price: 15 },
  express: { name: 'Express', price: 20 },
}

function CardSelectionContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const packageId = searchParams.get('package') || 'standard'
  
  const [selectedGame, setSelectedGame] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [filteredCards, setFilteredCards] = useState<Card[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false)
  const [customCards, setCustomCards] = useState<Card[]>([])
  const [newCardForm, setNewCardForm] = useState({
    name: '',
    game: 'Pokemon',
    type: '',
    rarity: '',
    number: '',
  })
  const [games, setGames] = useState<string[]>([])
  const [sets, setSets] = useState<string[]>([])
  const [selectedSet, setSelectedSet] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalCardsInDB, setTotalCardsInDB] = useState(0)
  const [hasSearched, setHasSearched] = useState(false)
  const [zoomedCard, setZoomedCard] = useState<Card | null>(null)
  const [selectedRarityInModal, setSelectedRarityInModal] = useState<string>('')
  const [selectedSetInModal, setSelectedSetInModal] = useState<string>('')
  const [cardVariations, setCardVariations] = useState<Card[]>([])
  const [selectedVariation, setSelectedVariation] = useState<Card | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [enableInfiniteScroll, setEnableInfiniteScroll] = useState(true)
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())
  const [rateLimitWarning, setRateLimitWarning] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  const [showDebug, setShowDebug] = useState(false)

  // Debug logging function
  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugLogs(prev => [...prev.slice(-19), `[${timestamp}] ${message}`]) // Keep last 20 logs
    console.log(`[DEBUG] ${message}`)
  }

  // Load available games on mount
  useEffect(() => {
    const loadGames = async () => {
      try {
        const response = await fetch('/api/cards?action=games')
        const data = await response.json()
        if (data.games) {
          setGames(data.games)
        }
      } catch (error) {
        console.error('Failed to load games:', error)
      }
    }
    loadGames()
  }, [])

  // Load sets for selected game
  const loadSets = async (game: string) => {
    try {
      const response = await fetch(`/api/cards?action=sets&game=${encodeURIComponent(game)}`)
      const data = await response.json()
      if (data.sets) {
        setSets(data.sets)
        setSelectedSet('')
      }
    } catch (error) {
      console.error('Failed to load sets:', error)
    }
  }
  
  // Load sets when game changes
  useEffect(() => {
    if (selectedGame && selectedGame !== '') {
      loadSets(selectedGame)
    } else {
      setSets([])
      setSelectedSet('')
    }
  }, [selectedGame])

  // Search Pokemon cards directly using TCGdx API
  const searchPokemonCardsDirect = async (query: string, limit: number = 10, offset: number = 0) => {
    addDebugLog(`[Pokemon Direct] Starting search: "${query}" (limit: ${limit}, offset: ${offset})`)
    
    // Step 1: Search for cards by name
    addDebugLog(`[Pokemon Direct] Adding 3-second delay...`)
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    const searchUrl = `https://api.tcgdex.net/v2/en/cards?name=${encodeURIComponent(query)}`
    addDebugLog(`[Pokemon Direct] Step 1 - Fetching from: ${searchUrl}`)
    
    const searchResponse = await fetch(searchUrl)
    addDebugLog(`[Pokemon Direct] Step 1 response status: ${searchResponse.status} ${searchResponse.statusText}`)
    
    if (!searchResponse.ok) {
      throw new Error(`TCGdex search API error: ${searchResponse.status}`)
    }
    
    const searchData = await searchResponse.json()
    addDebugLog(`[Pokemon Direct] Step 1 data: ${JSON.stringify(searchData, null, 2).substring(0, 500)}...`)
    
    let cardIds = searchData || []
    if (!Array.isArray(cardIds) || cardIds.length === 0) {
      addDebugLog(`[Pokemon Direct] No cards found in step 1`)
      return { cards: [], totalCount: 0 }
    }
    
    addDebugLog(`[Pokemon Direct] Found ${cardIds.length} total cards, applying pagination`)
    const totalCount = cardIds.length
    
    // Apply manual pagination
    cardIds = cardIds.slice(offset, offset + limit)
    addDebugLog(`[Pokemon Direct] After pagination: ${cardIds.length} cards to process`)
    
    // Step 2: Fetch detailed info for each card
    const detailedCards = []
    for (let i = 0; i < cardIds.length; i++) {
      const cardBasic = cardIds[i]
      try {
        const cardId = cardBasic.id || cardBasic
        addDebugLog(`[Pokemon Direct] Step 2 (${i + 1}/${cardIds.length}) - Card: ${cardId}`)
        
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const detailUrl = `https://api.tcgdex.net/v2/en/cards/${cardId}`
        const detailResponse = await fetch(detailUrl)
        
        if (detailResponse.ok) {
          const cardDetail = await detailResponse.json()
          
          // Convert to our format
          const convertedCard = {
            id: `pokemon-${cardId}`,
            name: cardDetail.name || 'Unknown Pokemon',
            game: 'Pokemon TCG',
            type: cardDetail.types?.join('/') || cardDetail.category || 'Pokemon',
            rarity: cardDetail.rarity || 'Common',
            number: cardDetail.localId || cardId || 'N/A',
            imageUrl: cardDetail.image ? `${cardDetail.image}/low.jpg` : `https://via.placeholder.com/245x342/FF6B35/FFFFFF?text=${encodeURIComponent(cardDetail.name || 'Pokemon Card')}`,
            sets: [{
              id: `pokemon-${cardId}`,
              setName: cardDetail.set?.name || 'Unknown Set',
              rarity: cardDetail.rarity || 'Common',
              number: cardDetail.localId || cardId || 'N/A',
              imageUrl: cardDetail.image ? `${cardDetail.image}/high.jpg` : `https://via.placeholder.com/245x342/FF6B35/FFFFFF?text=${encodeURIComponent(cardDetail.name || 'Pokemon Card')}`
            }],
            availableSets: [cardDetail.set?.name || 'Unknown Set'],
            availableRarities: [cardDetail.rarity || 'Common'],
            cardImages: [{
              id: parseInt(cardId.replace(/\D/g, '')) || 0,
              image_url: cardDetail.image ? `${cardDetail.image}/high.jpg` : `https://via.placeholder.com/245x342/FF6B35/FFFFFF?text=${encodeURIComponent(cardDetail.name || 'Pokemon Card')}`,
              image_url_small: cardDetail.image ? `${cardDetail.image}/low.jpg` : `https://via.placeholder.com/245x342/FF6B35/FFFFFF?text=${encodeURIComponent(cardDetail.name || 'Pokemon Card')}`,
              image_url_cropped: cardDetail.image ? `${cardDetail.image}/low.jpg` : `https://via.placeholder.com/245x342/FF6B35/FFFFFF?text=${encodeURIComponent(cardDetail.name || 'Pokemon Card')}`
            }]
          }
          
          detailedCards.push(convertedCard)
          addDebugLog(`[Pokemon Direct] Successfully converted: ${convertedCard.name}`)
        }
      } catch (error) {
        addDebugLog(`[Pokemon Direct] Error fetching card details: ${error}`)
      }
    }
    
    return { cards: detailedCards, totalCount }
  }

  // Search cards function
  const searchCards = async (query: string, game: string = '', setName: string = '', page: number = 1) => {
    setLoading(true)
    setHasSearched(true)
    
    try {
      // Use 10 cards per page for Pokemon TCG, 15 for others
      const limit = game === 'Pokemon TCG' ? 10 : 15
      const offset = (page - 1) * limit
      
      addDebugLog(`Starting search: query="${query}", game="${game}", page=${page}, limit=${limit}`)
      
      // Handle Pokemon TCG directly
      if (game === 'Pokemon TCG') {
        if (!query.trim()) {
          addDebugLog('Pokemon search requires a query')
          setFilteredCards([])
          return
        }
        
        const result = await searchPokemonCardsDirect(query, limit, offset)
        const dbCards = result.cards
        const allCards = page === 1 ? [...dbCards, ...customCards] : [...filteredCards, ...dbCards]
        setFilteredCards(allCards)
        setTotalCardsInDB(result.totalCount)
        setTotalPages(Math.ceil(result.totalCount / limit))
        addDebugLog(`Found ${dbCards.length} Pokemon cards, total count: ${result.totalCount}`)
        return
      }
      
      // Handle other games through internal API
      const params = new URLSearchParams()
      if (query) params.append('q', query)
      if (game) params.append('game', game)
      if (setName) params.append('set', setName)
      params.append('limit', limit.toString())
      params.append('offset', offset.toString())

      const apiUrl = `/api/cards?${params.toString()}`
      addDebugLog(`API call: ${apiUrl}`)

      const response = await fetch(apiUrl)
      addDebugLog(`Response status: ${response.status} ${response.statusText}`)
      
      // Check for rate limiting on YuGiOh API
      if (game === 'Yu-Gi-Oh!' && response.status === 429) {
        setRateLimitWarning(true)
        setTimeout(() => setRateLimitWarning(false), 5000)
        addDebugLog('Yu-Gi-Oh rate limit exceeded')
        throw new Error('Rate limit exceeded')
      }
      
      if (!response.ok) {
        addDebugLog(`API error: ${response.status} ${response.statusText}`)
        throw new Error(`API error: ${response.status}`)
      }
      
      const data = await response.json()
      addDebugLog(`Response data: ${JSON.stringify(data, null, 2).substring(0, 500)}...`)
      
      if (data.cards) {
        // For search results, replace cards; for pagination, append
        const dbCards = data.cards
        const allCards = page === 1 ? [...dbCards, ...customCards] : [...filteredCards, ...dbCards]
        setFilteredCards(allCards)
        setTotalCardsInDB(data.totalCount || 0)
        setTotalPages(Math.ceil((data.totalCount || 0) / limit))
        addDebugLog(`Found ${dbCards.length} cards, total count: ${data.totalCount}`)
      } else {
        addDebugLog('No cards found in response')
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      addDebugLog(`Search error: ${errorMsg}`)
      console.error('Failed to search cards:', error)
      if (page === 1) {
        setFilteredCards(customCards)
      }
    } finally {
      setLoading(false)
    }
  }

  // Load more cards for pagination
  const loadMoreCards = async () => {
    if (currentPage < totalPages && !loading && !isLoadingMore) {
      setIsLoadingMore(true)
      try {
        const nextPage = currentPage + 1
        setCurrentPage(nextPage)
        await searchCards(searchQuery, selectedGame, selectedSet, nextPage)
      } finally {
        setIsLoadingMore(false)
      }
    }
  }

  // Effect for search query changes (debounced)
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    if (searchQuery.trim()) {
      // Use longer debounce for YuGiOh API due to rate limiting (20 req/sec)
      const debounceTime = selectedGame === 'Yu-Gi-Oh!' ? 750 : 500
      const timeout = setTimeout(() => {
        setCurrentPage(1)
        searchCards(searchQuery, selectedGame, selectedSet, 1)
      }, debounceTime)
      setSearchTimeout(timeout)
    } else {
      // Clear results when search is empty
      setFilteredCards([])
      setHasSearched(false)
      setCurrentPage(1)
      setTotalPages(0)
    }

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
    }
  }, [searchQuery])

  // Infinite scroll effect
  useEffect(() => {
    if (!enableInfiniteScroll || !hasSearched) return

    const handleScroll = () => {
      if (loading || isLoadingMore || currentPage >= totalPages) return

      const scrollPosition = window.innerHeight + window.scrollY
      const documentHeight = document.documentElement.offsetHeight
      const scrollThreshold = documentHeight - 1000 // Load when 1000px from bottom

      if (scrollPosition >= scrollThreshold) {
        loadMoreCards()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [hasSearched, loading, isLoadingMore, currentPage, totalPages, enableInfiniteScroll])

  // Handle dropdown game selection
  const handleDropdownGameChange = (game: string) => {
    setSelectedGame(game)
    
    if (searchQuery.trim()) {
      setCurrentPage(1)
      searchCards(searchQuery, game, selectedSet, 1)
    }
  }

  // Handle dropdown set selection
  const handleDropdownSetChange = (setName: string) => {
    setSelectedSet(setName)
    if (searchQuery.trim()) {
      setCurrentPage(1)
      searchCards(searchQuery, selectedGame, setName, 1)
    }
  }

  // Handle card zoom
  const handleCardClick = async (card: Card) => {
    setZoomedCard(card)
    setSelectedImageIndex(0) // Reset image variant selection for new card
    
    // For YuGiOh cards, use the sets array directly
    if (card.game === 'Yu-Gi-Oh!' && card.sets && card.sets.length > 0) {
      const firstSet = card.sets[0]
      setSelectedSetInModal(firstSet.setName)
      setSelectedRarityInModal(firstSet.rarity)
      setSelectedVariation({
        ...card,
        type: firstSet.setName,
        rarity: firstSet.rarity,
        number: firstSet.number,
        imageUrl: firstSet.imageUrl
      })
      setCardVariations([card])
    } else if (card.availableSets && card.availableSets.length > 1) {
      // For other games, load card variations if card has multiple sets
      try {
        const response = await fetch(`/api/cards?action=variations&cardName=${encodeURIComponent(card.name)}&cardGame=${encodeURIComponent(card.game)}`)
        const data = await response.json()
        if (data.variations) {
          setCardVariations(data.variations)
          setSelectedVariation(data.variations[0])
          setSelectedSetInModal(data.variations[0].type)
          setSelectedRarityInModal(data.variations[0].rarity)
        }
      } catch (error) {
        console.error('Failed to load card variations:', error)
      }
    } else {
      // Single set card
      setCardVariations([card])
      setSelectedVariation(card)
      setSelectedSetInModal(card.type)
      setSelectedRarityInModal(card.rarity)
    }
  }

  // Close card zoom
  const closeCardZoom = () => {
    setZoomedCard(null)
    setSelectedRarityInModal('')
    setSelectedSetInModal('')
    setCardVariations([])
    setSelectedVariation(null)
    setSelectedImageIndex(0) // Reset image variant selection
  }

  // Handle set change in modal
  const handleSetChange = (setName: string) => {
    setSelectedSetInModal(setName)
    
    // For YuGiOh cards, find the set in the sets array
    if (zoomedCard?.game === 'Yu-Gi-Oh!' && zoomedCard.sets) {
      const selectedSet = zoomedCard.sets.find(set => set.setName === setName)
      if (selectedSet) {
        setSelectedRarityInModal(selectedSet.rarity)
        // Create a variation object for YuGiOh
        const variation = {
          ...zoomedCard,
          type: setName,
          rarity: selectedSet.rarity,
          number: selectedSet.number,
          imageUrl: selectedSet.imageUrl
        }
        setSelectedVariation(variation)
      }
    } else {
      // For other games, find variation for this set
      const variation = cardVariations.find(v => v.type === setName)
      if (variation) {
        setSelectedVariation(variation)
        setSelectedRarityInModal(variation.rarity)
      }
    }
  }

  // Handle rarity change in modal (for same set)
  const handleRarityChange = (rarity: string) => {
    setSelectedRarityInModal(rarity)
    
    // For YuGiOh cards, find the set with this rarity
    if (zoomedCard?.game === 'Yu-Gi-Oh!' && zoomedCard.sets) {
      const selectedSet = zoomedCard.sets.find(set => set.setName === selectedSetInModal && set.rarity === rarity)
      if (selectedSet) {
        // Create a variation object for YuGiOh
        const variation = {
          ...zoomedCard,
          type: selectedSetInModal,
          rarity: selectedSet.rarity,
          number: selectedSet.number,
          imageUrl: selectedSet.imageUrl
        }
        setSelectedVariation(variation)
      }
    } else {
      // For other games, find variation for this set and rarity combination
      const variation = cardVariations.find(v => v.type === selectedSetInModal && v.rarity === rarity)
      if (variation) {
        setSelectedVariation(variation)
      }
    }
  }

  const addToCart = (card: Card, selectedRarity?: string, selectedSet?: string) => {
    // Use the selected variation if available, otherwise use the card itself
    const cardToAdd = selectedVariation || card
    const rarityToAdd = selectedRarity || selectedRarityInModal
    const setToAdd = selectedSet || selectedSetInModal
    const imageIndexToAdd = selectedImageIndex

    setCart(prev => {
      const existing = prev.find(item => 
        item.card.id === cardToAdd.id && 
        item.selectedRarity === rarityToAdd &&
        item.selectedSet === setToAdd &&
        item.selectedImageIndex === imageIndexToAdd
      )
      if (existing) {
        return prev.map(item =>
          item.card.id === cardToAdd.id && 
          item.selectedRarity === rarityToAdd &&
          item.selectedSet === setToAdd &&
          item.selectedImageIndex === imageIndexToAdd
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { 
        card: cardToAdd, 
        quantity: 1, 
        selectedRarity: rarityToAdd,
        selectedSet: setToAdd,
        selectedImageIndex: imageIndexToAdd
      }]
    })
    setIsCartOpen(true)
  }

  const removeFromCart = (cardId: string, selectedRarity?: string, selectedSet?: string, selectedImageIndex?: number) => {
    setCart(prev => prev.filter(item => 
      !(item.card.id === cardId && 
        item.selectedRarity === selectedRarity &&
        item.selectedSet === selectedSet &&
        item.selectedImageIndex === selectedImageIndex)
    ))
  }

  const updateQuantity = (cardId: string, quantity: number, selectedRarity?: string, selectedSet?: string, selectedImageIndex?: number) => {
    if (quantity <= 0) {
      removeFromCart(cardId, selectedRarity, selectedSet, selectedImageIndex)
      return
    }
    setCart(prev =>
      prev.map(item =>
        item.card.id === cardId && 
        item.selectedRarity === selectedRarity &&
        item.selectedSet === selectedSet &&
        item.selectedImageIndex === selectedImageIndex
          ? { ...item, quantity } 
          : item
      )
    )
  }

  const totalCards = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = totalCards * packageInfo[packageId].price

  // Handle image loading errors
  const handleImageError = (cardId: string) => {
    setFailedImages(prev => new Set(prev).add(cardId))
  }

  const handleCheckout = () => {
    const orderData = {
      packageId,
      packageName: packageInfo[packageId].name,
      packagePrice: packageInfo[packageId].price,
      cards: cart,
      totalCards,
      totalPrice,
    }
    localStorage.setItem('orderData', JSON.stringify(orderData))
    router.push('/packages/checkout')
  }

  const handleAddCustomCard = () => {
    if (!newCardForm.name.trim()) return

    const customCard: Card = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newCardForm.name.trim(),
      game: newCardForm.game,
      type: newCardForm.type.trim() || 'Unknown',
      rarity: newCardForm.rarity.trim() || 'Unknown',
      number: newCardForm.number.trim() || 'N/A',
      imageUrl: 'https://via.placeholder.com/200x280?text=Custom+Card',
    }

    setCustomCards(prev => [...prev, customCard])
    setNewCardForm({
      name: '',
      game: 'Pokemon',
      type: '',
      rarity: '',
      number: '',
    })
    setIsAddCardModalOpen(false)

    // Optionally add to cart immediately
    addToCart(customCard, customCard.rarity)
    
    // Trigger a re-search to include the new custom card
    setTimeout(() => {
      searchCards(searchQuery, selectedGame)
    }, 100)
  }

  const handleFormChange = (field: string, value: string) => {
    setNewCardForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-4">
            <span className="text-gradient">Select Your Cards</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Package: <span className="font-semibold">{packageInfo[packageId].name}</span> - 
            ${packageInfo[packageId].price}/card
          </p>
        </motion.div>

        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 space-y-4"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Game Dropdown */}
            <div className="relative w-full md:w-[300px]">
              <select
                value={selectedGame}
                onChange={(e) => handleDropdownGameChange(e.target.value)}
                className="appearance-none w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-gaming-primary"
              >
                <option value="">All Games</option>
                {games.map(game => (
                  <option key={game} value={game}>{game}</option>
                ))}
              </select>
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            

            {/* Search Bar */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search for exact card name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-gaming-primary"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Add Custom Card Button */}
            <button
              onClick={() => setIsAddCardModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:scale-105 transition-transform shadow-lg flex items-center gap-2 whitespace-nowrap"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Custom Card
            </button>
          </div>
        </motion.div>

        {/* Rate Limit Warning */}
        {rateLimitWarning && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-amber-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-amber-800 dark:text-amber-200 font-medium">
                  Rate Limit Notice
                </p>
                <p className="text-amber-700 dark:text-amber-300 text-sm">
                  Yu-Gi-Oh! API has rate limits (20 requests/second). Please search more slowly to avoid being blocked for 1 hour.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-20 min-h-[400px]">
          {loading && !isLoadingMore ? (
            // Show loading skeleton cards for initial search
            <>
              {Array.from({ length: 10 }).map((_, index) => (
                <LoadingCardSkeleton key={`loading-${index}`} />
              ))}
            </>
          ) : !hasSearched && filteredCards.length === 0 ? (
            <div className="col-span-full flex items-center justify-center py-20">
              <div className="text-center max-w-md">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-xl font-semibold mb-4 text-gray-600 dark:text-gray-300">Search for cards by exact name</p>
                <div className="text-gray-500 dark:text-gray-400 space-y-2">
                  <p>Enter the exact card name. Try searching for:</p>
                  <div className="flex flex-wrap gap-2 justify-center mt-4">
                    <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm">Blue-Eyes White Dragon</span>
                    <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-full text-sm">Dark Magician</span>
                    <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm">Pot of Greed</span>
                    <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-3 py-1 rounded-full text-sm">Lightning Bolt</span>
                  </div>
                </div>
              </div>
            </div>
          ) : hasSearched && filteredCards.length === 0 ? (
            <div className="col-span-full flex items-center justify-center py-20">
              <div className="text-center max-w-md">
                <div className="text-6xl mb-4">😕</div>
                <p className="text-xl font-semibold mb-2 text-gray-600 dark:text-gray-300">No cards found</p>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {searchQuery ? `No cards found for "${searchQuery}"` : 'No cards available for the selected filters'}
                </p>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <p>Tips for better search results:</p>
                  <ul className="mt-2 text-left max-w-sm mx-auto space-y-1">
                    <li>• Enter the exact card name</li>
                    <li>• Try without punctuation if no results</li>
                    <li>• The database contains Yu-Gi-Oh! and Magic cards</li>
                    <li>• Example: "Blue-Eyes White Dragon" or "Dark Magician"</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <AnimatePresence>
              {filteredCards.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden card-hover cursor-pointer relative group"
                onClick={() => handleCardClick(card)}
              >
                <div className="aspect-[5/7] relative bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  {card.imageUrl && !failedImages.has(card.id) ? (
                    <Image
                      src={card.imageUrl}
                      alt={card.name}
                      fill
                      className="object-cover"
                      onError={() => handleImageError(card.id)}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs p-2 text-center">
                      {card.name}
                    </div>
                  )}
                </div>
                <div className="p-4 relative">
                  <h3 className="font-semibold text-sm mb-1">{card.name}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{card.game}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">{card.type}</p>
                  <p className="text-xs font-medium text-gaming-primary mt-1">
                    {card.rarity === 'Multiple Rarities' ? (
                      <span className="text-orange-500">Multiple Rarities Available</span>
                    ) : (
                      card.rarity
                    )}
                  </p>
                  <p className="text-xs text-gray-500">#{card.number}</p>
                  
                  {/* Green Plus Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (card.rarities && card.rarities.length > 1) {
                        // For multiple rarities, open the modal to select rarity
                        handleCardClick(card)
                      } else {
                        // For single rarity, add directly
                        addToCart(card, card.rarity)
                      }
                    }}
                    className="absolute bottom-2 right-2 w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </motion.div>
              ))}
            </AnimatePresence>
          )}
          
          {/* Loading skeletons for "Load More" */}
          {isLoadingMore && (
            <AnimatePresence>
              {Array.from({ length: 5 }).map((_, index) => (
                <LoadingCardSkeleton key={`loading-more-${index}`} />
              ))}
            </AnimatePresence>
          )}
          
          {/* Load More Button or Infinite Scroll Indicator */}
          {hasSearched && filteredCards.length > 0 && currentPage < totalPages && (
            <div className="col-span-full flex flex-col items-center mt-8 space-y-4">
              {/* Infinite Scroll Toggle */}
              <div className="flex items-center gap-3">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableInfiniteScroll}
                    onChange={(e) => setEnableInfiniteScroll(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${
                    enableInfiniteScroll ? 'bg-gaming-primary' : 'bg-gray-300 dark:bg-gray-600'
                  }`}>
                    <div className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      enableInfiniteScroll ? 'translate-x-6' : 'translate-x-1'
                    } mt-1`} />
                  </div>
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    Auto-load more cards
                  </span>
                </label>
              </div>

              {/* Manual Load More Button (when infinite scroll is disabled) */}
              {!enableInfiniteScroll && (
                <button
                  onClick={loadMoreCards}
                  disabled={loading || isLoadingMore}
                  className="px-6 py-3 bg-gradient-to-r from-gaming-primary to-gaming-secondary text-white rounded-lg font-medium hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading || isLoadingMore ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Loading More...
                    </>
                  ) : (
                    <>
                      Load More Cards
                      <span className="text-sm opacity-80">({filteredCards.length - customCards.length}/{totalCardsInDB})</span>
                    </>
                  )}
                </button>
              )}

              {/* Loading indicator for infinite scroll */}
              {enableInfiniteScroll && (loading || isLoadingMore) && (
                <div className="flex items-center gap-2 text-gaming-primary">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gaming-primary"></div>
                  <span className="text-sm">Loading more cards...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Search Instructions - only show for Yu-Gi-Oh! */}
        {selectedGame === 'Yu-Gi-Oh!' && (
          <div className="mt-8 text-center max-w-2xl mx-auto">
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <p className="text-sm text-purple-800 dark:text-purple-200">
                <span className="font-medium">Type the Exact Card Name to Search for Exact Card.</span> Not sure which card it is?{' '}
                <a 
                  href="https://ygoprodeck.com/card-database/?num=24&offset=0" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 underline font-medium"
                >
                  Search card here
                </a>.
              </p>
            </div>
          </div>
        )}

        {/* Debug Console */}
        <div className="fixed bottom-4 left-4 z-40">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg"
          >
            Debug {showDebug ? '❌' : '🐛'}
          </button>
          
          {showDebug && (
            <div className="mt-2 bg-black text-green-400 p-4 rounded-lg shadow-2xl max-w-md w-80 max-h-64 overflow-y-auto text-xs font-mono">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-bold">Debug Console</span>
                <button
                  onClick={() => setDebugLogs([])}
                  className="text-red-400 hover:text-red-300 text-xs"
                >
                  Clear
                </button>
              </div>
              {debugLogs.length === 0 ? (
                <div className="text-gray-500">No logs yet...</div>
              ) : (
                debugLogs.map((log, index) => (
                  <div key={index} className="mb-1 break-words">
                    {log}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Cart Sidebar */}
        <AnimatePresence>
          {isCartOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 bg-black z-40"
                onClick={() => setIsCartOpen(false)}
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="fixed right-0 top-0 h-full w-full md:w-96 bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-y-auto"
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Your Cart</h2>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <p className="font-semibold">{packageInfo[packageId].name} Package</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ${packageInfo[packageId].price} per card
                    </p>
                  </div>

                  {cart.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                      Your cart is empty. Click on cards to add them.
                    </p>
                  ) : (
                    <>
                      <div className="space-y-4 mb-6">
                        {cart.map((item, index) => (
                          <div key={`${item.card.id}-${item.selectedSet}-${item.selectedRarity}-${index}`} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="w-16 h-20 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden relative">
                              {(() => {
                                // Get the appropriate image URL based on card type and selected variant
                                let imageUrl = item.card.imageUrl // Default to low quality for cart
                                
                                if (item.card.game === 'Yu-Gi-Oh!' && item.card.cardImages && typeof item.selectedImageIndex === 'number' && item.card.cardImages[item.selectedImageIndex]) {
                                  imageUrl = item.card.cardImages[item.selectedImageIndex].image_url_small || item.card.cardImages[item.selectedImageIndex].image_url
                                } else if (item.card.game === 'Pokemon TCG' && item.card.cardImages && item.card.cardImages[0]) {
                                  // For Pokemon cards, use low quality image for cart thumbnails
                                  imageUrl = item.card.cardImages[0].image_url_small || item.card.imageUrl
                                }
                                
                                return imageUrl && !failedImages.has(item.card.id) ? (
                                  <Image
                                    src={imageUrl}
                                    alt={item.card.name}
                                    fill
                                    className="object-cover"
                                    sizes="64px"
                                    onError={() => handleImageError(item.card.id)}
                                  />
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs p-1 text-center">
                                    {item.card.name}
                                  </div>
                                )
                              })()}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{item.card.name}</h4>
                              <p className="text-xs text-gray-600 dark:text-gray-400">{item.card.game}</p>
                              {item.selectedSet && (
                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                  <span className="font-medium">Set:</span> {item.selectedSet}
                                </p>
                              )}
                              {item.selectedRarity && (
                                <p className="text-xs text-gaming-primary mt-1">
                                  <span className="font-medium">Rarity:</span> {item.selectedRarity}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  updateQuantity(item.card.id, item.quantity - 1, item.selectedRarity, item.selectedSet, item.selectedImageIndex)
                                }}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                              </button>
                              <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  updateQuantity(item.card.id, item.quantity + 1, item.selectedRarity, item.selectedSet, item.selectedImageIndex)
                                }}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <div className="flex justify-between mb-2">
                          <span>Total Cards:</span>
                          <span className="font-semibold">{totalCards}</span>
                        </div>
                        <div className="flex justify-between mb-6">
                          <span>Total Price:</span>
                          <span className="font-bold text-xl text-gradient">${totalPrice}</span>
                        </div>

                        <button
                          onClick={handleCheckout}
                          disabled={cart.length === 0}
                          className="w-full bg-gradient-to-r from-gaming-primary to-gaming-secondary text-white py-3 rounded-lg font-medium hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Proceed to Checkout
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Floating Cart Button */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-gaming-primary to-gaming-secondary text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform z-30"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {totalCards > 0 && (
            <span className="absolute -top-2 -right-2 bg-gaming-accent text-white text-xs w-6 h-6 rounded-full flex items-center justify-center">
              {totalCards}
            </span>
          )}
        </button>

        {/* Add Custom Card Modal */}
        <AnimatePresence>
          {isAddCardModalOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 bg-black z-50"
                onClick={() => setIsAddCardModalOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
              >
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold">Add Custom Card</h2>
                      <button
                        onClick={() => setIsAddCardModalOpen(false)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                      >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleAddCustomCard(); }}>
                      <div>
                        <label className="block text-sm font-medium mb-2">Card Name *</label>
                        <input
                          type="text"
                          value={newCardForm.name}
                          onChange={(e) => handleFormChange('name', e.target.value)}
                          placeholder="Enter card name..."
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-800"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Game</label>
                        <select
                          value={newCardForm.game}
                          onChange={(e) => handleFormChange('game', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-800"
                        >
                          {games.map(game => (
                            <option key={game} value={game}>{game}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Card Type</label>
                        <input
                          type="text"
                          value={newCardForm.type}
                          onChange={(e) => handleFormChange('type', e.target.value)}
                          placeholder="e.g., Fire/Flying, Spellcaster, Artifact..."
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-800"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Rarity</label>
                        <input
                          type="text"
                          value={newCardForm.rarity}
                          onChange={(e) => handleFormChange('rarity', e.target.value)}
                          placeholder="e.g., Rare Holo, Ultra Rare, Common..."
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-800"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Card Number</label>
                        <input
                          type="text"
                          value={newCardForm.number}
                          onChange={(e) => handleFormChange('number', e.target.value)}
                          placeholder="e.g., 4/102, LOB-001..."
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-800"
                        />
                      </div>

                      <div className="flex gap-3 pt-4">
                        <button
                          type="button"
                          onClick={() => setIsAddCardModalOpen(false)}
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={!newCardForm.name.trim()}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                          Add Card
                        </button>
                      </div>
                    </form>

                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                      * This card will be added to your selection and automatically added to your cart.
                    </p>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Card Zoom Modal */}
        <AnimatePresence>
          {zoomedCard && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 bg-black z-50"
                onClick={closeCardZoom}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                onClick={closeCardZoom}
              >
                <div 
                  className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Close Button */}
                  <button
                    onClick={closeCardZoom}
                    className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {/* Card Image */}
                  <div className="aspect-[5/7] relative bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    {(() => {
                      // Get the image URL based on card type and selected variant
                      let imageUrl = selectedVariation?.imageUrl || zoomedCard.imageUrl || ''
                      
                      if (zoomedCard.game === 'Yu-Gi-Oh!' && zoomedCard.cardImages && zoomedCard.cardImages[selectedImageIndex]) {
                        imageUrl = zoomedCard.cardImages[selectedImageIndex].image_url
                      } else if (zoomedCard.game === 'Pokemon TCG') {
                        // For Pokemon cards, use high quality image from sets or cardImages
                        if (zoomedCard.cardImages && zoomedCard.cardImages[0]) {
                          imageUrl = zoomedCard.cardImages[0].image_url // High quality
                        } else if (selectedVariation?.imageUrl) {
                          imageUrl = selectedVariation.imageUrl // High quality from sets
                        } else if (zoomedCard.sets && zoomedCard.sets[0]) {
                          imageUrl = zoomedCard.sets[0].imageUrl // High quality from sets
                        }
                      }
                      
                      return imageUrl && !failedImages.has(selectedVariation?.id || zoomedCard.id) ? (
                        <Image
                          src={imageUrl}
                          alt={zoomedCard.name}
                          fill
                          className="object-contain"
                          onError={() => handleImageError(selectedVariation?.id || zoomedCard.id)}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xl font-semibold">
                          {zoomedCard.name}
                        </div>
                      )
                    })()}
                  </div>

                  {/* Card Details */}
                  <div className="p-6">
                    <h2 className="text-2xl font-bold mb-3">{zoomedCard.name}</h2>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600 dark:text-gray-400">Game:</span>
                        <span>{zoomedCard.game}</span>
                      </div>
                      
                      {/* Set Selection */}
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-600 dark:text-gray-400">Set:</span>
                        <div className="flex-1 text-right">
                          {zoomedCard.game === 'Yu-Gi-Oh!' && zoomedCard.sets && zoomedCard.sets.length > 1 ? (
                            <select
                              value={selectedSetInModal}
                              onChange={(e) => handleSetChange(e.target.value)}
                              className="text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-gaming-primary text-gaming-primary font-medium max-w-[200px]"
                            >
                              {[...new Set(zoomedCard.sets.map(set => set.setName))].map(setName => (
                                <option key={setName} value={setName}>{setName}</option>
                              ))}
                            </select>
                          ) : zoomedCard.availableSets && zoomedCard.availableSets.length > 1 ? (
                            <select
                              value={selectedSetInModal}
                              onChange={(e) => handleSetChange(e.target.value)}
                              className="text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-gaming-primary text-gaming-primary font-medium max-w-[200px]"
                            >
                              {zoomedCard.availableSets.map(set => (
                                <option key={set} value={set}>{set}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="font-medium text-gaming-primary">{selectedVariation?.type || zoomedCard.type}</span>
                          )}
                        </div>
                      </div>

                      {/* Rarity Selection */}
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-600 dark:text-gray-400">Rarity:</span>
                        <div className="flex-1 text-right">
                          {zoomedCard.game === 'Yu-Gi-Oh!' && zoomedCard.sets && zoomedCard.sets.length > 1 ? (
                            <select
                              value={selectedRarityInModal}
                              onChange={(e) => handleRarityChange(e.target.value)}
                              className="text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-gaming-primary text-gaming-primary font-medium max-w-[200px]"
                            >
                              {[...new Set(zoomedCard.sets
                                .filter(set => set.setName === selectedSetInModal)
                                .map(set => set.rarity))].map(rarity => (
                                <option key={rarity} value={rarity}>{rarity}</option>
                              ))}
                            </select>
                          ) : cardVariations.length > 1 ? (
                            <select
                              value={selectedRarityInModal}
                              onChange={(e) => handleRarityChange(e.target.value)}
                              className="text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-gaming-primary text-gaming-primary font-medium max-w-[200px]"
                            >
                              {cardVariations
                                .filter(v => v.type === selectedSetInModal)
                                .map(v => (
                                  <option key={v.id} value={v.rarity}>{v.rarity}</option>
                                ))}
                            </select>
                          ) : (
                            <span className="font-medium text-gaming-primary">{selectedVariation?.rarity || zoomedCard.rarity}</span>
                          )}
                        </div>
                      </div>

                      {/* Image Variant Selection - only for Yu-Gi-Oh! cards with multiple images */}
                      {zoomedCard.game === 'Yu-Gi-Oh!' && zoomedCard.cardImages && zoomedCard.cardImages.length > 1 && (
                        <div className="flex flex-col gap-2">
                          <span className="font-medium text-gray-600 dark:text-gray-400">Image Variant:</span>
                          <div className="flex flex-wrap gap-2">
                            {zoomedCard.cardImages.map((image, index) => (
                              <button
                                key={index}
                                onClick={() => setSelectedImageIndex(index)}
                                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-medium transition-colors ${
                                  selectedImageIndex === index
                                    ? 'bg-gaming-primary text-white border-gaming-primary'
                                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-gaming-primary'
                                }`}
                              >
                                {index + 1}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600 dark:text-gray-400">Number:</span>
                        <span>#{selectedVariation?.number || zoomedCard.number}</span>
                      </div>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      onClick={() => {
                        addToCart(zoomedCard, selectedRarityInModal)
                        closeCardZoom()
                      }}
                      className="w-full mt-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-lg font-medium hover:scale-105 transition-transform shadow-lg"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default function CardSelectionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gaming-primary"></div>
      </div>
    }>
      <CardSelectionContent />
    </Suspense>
  )
}