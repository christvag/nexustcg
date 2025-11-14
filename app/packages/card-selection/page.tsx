'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CartItem } from '@/lib/types'
import Image from 'next/image'
import CartSection from './cart-section'
import { yugiohRateLimiter, debounce } from '@/lib/rate-limiter'

const defaultGames = ['All Games', 'Yu Gi Oh', 'Pokemon', 'MTG', 'Metazoo', 'One Piece', 'Player Cards']

const packageInfo: Record<string, { name: string; price: number }> = {
  authentication: { name: 'Authentication', price: 10 },
  bulk: { name: 'Bulk Grading', price: 12 },
  standard: { name: 'Standard', price: 15 },
  express: { name: 'Express', price: 20 },
}

// Helper function to get fallback image based on game
const getFallbackImage = (gameName: string, cardName: string) => {
  // For Pokemon cards, don't use fallback - they should get real images from API
  if (gameName.toLowerCase().includes('pokemon')) return null
  if (gameName.toLowerCase().includes('yu-gi-oh') || gameName.toLowerCase().includes('yugioh')) return '/YuGiOh.png'
  if (gameName.toLowerCase().includes('mtg') || gameName.toLowerCase().includes('magic')) return '/MagictheGathering.png'
  // For other games, default to Pokemon image as a generic card placeholder
  return '/Pokemon.png'
}

function CardSelectionContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const packageId = searchParams.get('package') || 'standard'
  
  const [selectedGame, setSelectedGame] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false)
  const [customCards, setCustomCards] = useState<Card[]>([])
  const [newCardForm, setNewCardForm] = useState({
    name: '',
    game: 'Pokemon',
    type: '',
    rarity: '',
    number: '',
    setName: '',
  })
  const [games, setGames] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())
  const [rateLimitWarning, setRateLimitWarning] = useState(false)
  
  // New dropdown states
  const [showDropdown, setShowDropdown] = useState(false)
  const [dropdownCards, setDropdownCards] = useState<Card[]>([])
  const [currentDropdownPage, setCurrentDropdownPage] = useState(1)
  const [totalDropdownPages, setTotalDropdownPages] = useState(0)
  const [dropdownLoading, setDropdownLoading] = useState(false)
  
  // Card variant selection states
  const [cardSelections, setCardSelections] = useState<Record<string, {
    selectedRarity?: string
    selectedSet?: string
    selectedImageIndex?: number
  }>>({})
  
  // Debug states
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

  // Search Pokemon cards directly using TCGdex API - Show all variations
  const searchPokemonCardsDirect = async (query: string, page: number = 1, onProgressUpdate?: (cards: any[]) => void) => {
    addDebugLog(`[Pokemon Direct] Starting progressive search: "${query}"`)
    
    // Apply rate limiting for TCGdex API
    await yugiohRateLimiter.throttle()
    
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
    
    const totalCount = cardIds.length
    addDebugLog(`[Pokemon Direct] Found ${totalCount} total cards, starting progressive loading`)
    
    const detailedCards = []
    const CARDS_PER_BATCH = 10
    const BATCH_DELAY = 1000 // 1 second
    
    // Process cards in batches of 10 every second
    for (let batchStart = 0; batchStart < cardIds.length; batchStart += CARDS_PER_BATCH) {
      const batchEnd = Math.min(batchStart + CARDS_PER_BATCH, cardIds.length)
      const batch = cardIds.slice(batchStart, batchEnd)
      
      addDebugLog(`[Pokemon Direct] Processing batch ${Math.floor(batchStart/CARDS_PER_BATCH) + 1}: cards ${batchStart + 1}-${batchEnd}`)
      
      // Process current batch
      const batchPromises = batch.map(async (cardBasic, index) => {
        try {
          // Apply rate limiting for each card request
          await yugiohRateLimiter.throttle()
          
          const cardId = cardBasic.id || cardBasic
          const detailUrl = `https://api.tcgdex.net/v2/en/cards/${cardId}`
          const detailResponse = await fetch(detailUrl)
          
          if (detailResponse.ok) {
            const cardDetail = await detailResponse.json()
            
            return {
              id: `pokemon-${cardId}`,
              name: cardDetail.name || 'Unknown Pokemon',
              game: 'Pokemon TCG',
              type: cardDetail.set?.name || 'Unknown Set',
              rarity: cardDetail.rarity || 'Common',
              number: cardDetail.localId || cardId || 'N/A',
              imageUrl: cardDetail.image ? `${cardDetail.image}/low.jpg` : null,
              availableSets: [cardDetail.set?.name || 'Unknown Set'],
              availableRarities: [cardDetail.rarity || 'Common'],
              cardImages: [{
                id: parseInt(cardId.replace(/\D/g, '')) || 0,
                image_url: cardDetail.image ? `${cardDetail.image}/high.jpg` : null,
                image_url_small: cardDetail.image ? `${cardDetail.image}/low.jpg` : null,
                image_url_cropped: cardDetail.image ? `${cardDetail.image}/low.jpg` : null
              }]
            }
          }
          return null
        } catch (error) {
          addDebugLog(`[Pokemon Direct] Error fetching card: ${error}`)
          return null
        }
      })
      
      // Wait for current batch to complete
      const batchResults = await Promise.all(batchPromises)
      const validCards = batchResults.filter(card => card !== null)
      
      detailedCards.push(...validCards)
      addDebugLog(`[Pokemon Direct] Batch complete: ${validCards.length} cards processed, ${detailedCards.length}/${totalCount} total`)
      
      // Update progress if callback provided
      if (onProgressUpdate) {
        onProgressUpdate([...detailedCards])
      }
      
      // Wait 1 second before next batch (except for last batch)
      if (batchEnd < cardIds.length) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY))
      }
    }
    
    addDebugLog(`[Pokemon Direct] Progressive loading complete: ${detailedCards.length} cards loaded`)
    return { cards: detailedCards, totalCount }
  }

  // Search cards function - optimized for dropdown
  const searchCards = async (query: string, game: string = '', page: number = 1) => {
    if (!query.trim()) {
      setDropdownCards([])
      setShowDropdown(false)
      return
    }

    setDropdownLoading(true)
    setShowDropdown(true)
    
    try {
      const limit = 15
      const offset = (page - 1) * limit
      
      addDebugLog(`Starting search: query="${query}", game="${game}", page=${page}, limit=${limit}`)
      
      // Handle Pokemon TCG directly
      if (game === 'Pokemon TCG') {
        if (!query.trim()) {
          addDebugLog('Pokemon search requires a query')
          setDropdownCards([])
          return
        }
        
        // Initialize dropdown with custom cards for immediate display
        setDropdownCards([...customCards])
        
        // Start progressive loading with callback to update cards as they load
        const result = await searchPokemonCardsDirect(query, page, (progressCards) => {
          // Update dropdown with progressively loaded cards
          const allCards = [...customCards, ...progressCards]
          setDropdownCards(allCards)
          addDebugLog(`Progress update: ${progressCards.length} Pokemon cards loaded so far`)
        })
        
        // Final update when complete
        const allCards = [...customCards, ...result.cards]
        setDropdownCards(allCards)
        setTotalDropdownPages(1) // No pagination needed with progressive loading
        addDebugLog(`Pokemon loading complete: ${result.cards.length} total cards loaded`)
        return
      }
      
      // Handle other games through internal API
      const params = new URLSearchParams()
      if (query) params.append('q', query)
      if (game) params.append('game', game)
      params.append('limit', limit.toString())
      params.append('offset', offset.toString())

      // Apply rate limiting for all API calls
      if (game === 'Yu-Gi-Oh!' || game.includes('Yu-Gi-Oh')) {
        await yugiohRateLimiter.throttle()
      }

      const apiUrl = `/api/cards?${params.toString()}`
      addDebugLog(`API call: ${apiUrl}`)
      const response = await fetch(apiUrl)
      addDebugLog(`Response status: ${response.status} ${response.statusText}`)
      
      // Check for rate limiting on YuGiOh API
      if ((game === 'Yu-Gi-Oh!' || game.includes('Yu-Gi-Oh')) && response.status === 429) {
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
        // Add fallback images to cards without images
        const cardsWithFallbacks = data.cards.map((card: Card) => ({
          ...card,
          imageUrl: card.imageUrl || getFallbackImage(card.game, card.name)
        }))
        
        // For search results, replace cards; for pagination, append  
        const dbCards = cardsWithFallbacks
        const allCards = page === 1 ? [...dbCards, ...customCards] : [...dropdownCards, ...dbCards]
        setDropdownCards(allCards)
        setTotalDropdownPages(Math.ceil((data.totalCount || 0) / limit))
        addDebugLog(`Found ${dbCards.length} cards, total count: ${data.totalCount}`)
      } else {
        addDebugLog('No cards found in response')
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      addDebugLog(`Search error: ${errorMsg}`)
      console.error('Failed to search cards:', error)
      if (page === 1) {
        setDropdownCards(customCards)
      }
    } finally {
      setDropdownLoading(false)
    }
  }

  // Load more cards in dropdown
  const loadMoreDropdownCards = async () => {
    if (currentDropdownPage < totalDropdownPages && !dropdownLoading) {
      const nextPage = currentDropdownPage + 1
      setCurrentDropdownPage(nextPage)
      await searchCards(searchQuery, selectedGame, nextPage)
    }
  }

  // Create debounced search function
  const debouncedSearch = debounce((query: string, game: string) => {
    setCurrentDropdownPage(1)
    searchCards(query, game, 1)
  }, 500) // 500ms debounce for rate limiting

  // Effect for search query changes (debounced)
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    if (searchQuery.trim()) {
      // Apply different debounce times based on game for rate limiting
      if (selectedGame === 'Pokemon TCG' || selectedGame.includes('Pokemon')) {
        // Shorter delay for Pokemon but still debounced for rate limiting
        const timeout = setTimeout(() => {
          setCurrentDropdownPage(1)
          searchCards(searchQuery, selectedGame, 1)
        }, 200)
        setSearchTimeout(timeout)
      } else if (selectedGame === 'Yu-Gi-Oh!' || selectedGame.includes('Yu-Gi-Oh')) {
        // Longer debounce for Yu-Gi-Oh due to strict rate limits
        const timeout = setTimeout(() => {
          setCurrentDropdownPage(1)
          searchCards(searchQuery, selectedGame, 1)
        }, 750)
        setSearchTimeout(timeout)
      } else {
        // Standard debounce for other games
        const timeout = setTimeout(() => {
          setCurrentDropdownPage(1)
          searchCards(searchQuery, selectedGame, 1)
        }, 300)
        setSearchTimeout(timeout)
      }
    } else {
      setDropdownCards([])
      setShowDropdown(false)
      setCurrentDropdownPage(1)
      setTotalDropdownPages(0)
    }

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
    }
  }, [searchQuery, selectedGame])

  // Handle dropdown game selection
  const handleDropdownGameChange = (game: string) => {
    setSelectedGame(game)
    if (searchQuery.trim()) {
      setCurrentDropdownPage(1)
      searchCards(searchQuery, game, 1)
    }
  }

  // Add to cart - simple version, variants selected in cart
  const addToCart = (card: Card) => {
    setCart(prev => {
      const existing = prev.find(item => item.card.id === card.id)
      if (existing) {
        return prev.map(item =>
          item.card.id === card.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { 
        card, 
        quantity: 1, 
        selectedRarity: card.rarity,
        selectedSet: card.type || 'Unknown Set',
        selectedImageIndex: 0
      }]
    })
    setShowDropdown(false)
  }
  
  // Update cart item variants
  const updateCartVariant = (itemIndex: number, key: 'selectedRarity' | 'selectedSet' | 'selectedImageIndex', value: string | number) => {
    setCart(prev => 
      prev.map((item, index) => 
        index === itemIndex 
          ? { ...item, [key]: value }
          : item
      )
    )
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
      type: newCardForm.setName.trim() || 'Unknown Set',
      rarity: newCardForm.rarity.trim() || 'Unknown',
      number: newCardForm.number.trim() || 'N/A',
      imageUrl: getFallbackImage(newCardForm.game, newCardForm.name) || '/Pokemon.png',
    }

    setCustomCards(prev => [...prev, customCard])
    setNewCardForm({
      name: '',
      game: 'Pokemon',
      type: '',
      rarity: '',
      number: '',
      setName: '',
    })
    setIsAddCardModalOpen(false)
    addToCart(customCard)
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
          <p className="text-gray-300">
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
                className="appearance-none w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-gaming-primary"
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

            {/* Search Bar with Dropdown */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search for card name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (dropdownCards.length > 0) setShowDropdown(true)
                }}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-gaming-primary"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              
              {/* Search Results Dropdown */}
              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto mt-1"
                  >
                    {dropdownLoading && dropdownCards.length === 0 && (
                      <div className="p-4 text-center text-gray-500">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gaming-primary mx-auto mb-2"></div>
                        <div className="text-sm">
                          {selectedGame === 'Pokemon TCG' || selectedGame.includes('Pokemon') 
                            ? 'Loading Pokemon cards progressively...' 
                            : selectedGame === 'Yu-Gi-Oh!' || selectedGame.includes('Yu-Gi-Oh')
                            ? 'Searching Yu-Gi-Oh cards (rate limited)...'
                            : 'Searching...'}
                        </div>
                      </div>
                    )}
                    
                    {dropdownCards.length === 0 && !dropdownLoading && searchQuery && (
                      <div className="p-4 text-center text-gray-500">
                        No cards found for "{searchQuery}"
                      </div>
                    )}

                    {dropdownCards.map((card, index) => {
                      // Get image URL - simplified without variant selection
                      let currentImageUrl = card.imageUrl
                      
                      if (card.game === 'Yu-Gi-Oh!' && card.cardImages && card.cardImages[0]) {
                        currentImageUrl = card.cardImages[0].image_url_small || card.cardImages[0].image_url
                      } else if (card.game.includes('Pokemon') && card.cardImages && card.cardImages[0]) {
                        currentImageUrl = card.cardImages[0].image_url_small || card.imageUrl
                      }
                      
                      return (
                        <motion.div
                          key={card.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.03 }}
                          className="flex items-center p-3 hover:bg-gray-800 border-b border-gray-800 cursor-pointer"
                          onClick={() => addToCart(card)}
                        >
                          {/* Small thumbnail */}
                          <div className="w-12 h-16 bg-gray-700 rounded overflow-hidden mr-3 flex-shrink-0">
                            {currentImageUrl && !failedImages.has(card.id) ? (
                              (currentImageUrl === '/Pokemon.png' || currentImageUrl === '/YuGiOh.png' || currentImageUrl === '/MagictheGathering.png') ? (
                                // Use regular img tag for local fallback images
                                <img
                                  src={currentImageUrl}
                                  alt={card.name}
                                  className="object-cover w-full h-full"
                                  onError={() => handleImageError(card.id)}
                                />
                              ) : (
                                // Use Next.js Image for external images
                                <Image
                                  src={currentImageUrl}
                                  alt={card.name}
                                  width={48}
                                  height={64}
                                  className="object-cover w-full h-full"
                                  onError={() => handleImageError(card.id)}
                                />
                              )
                            ) : (
                              // Final fallback with regular img tag
                              <img
                                src={getFallbackImage(card.game, card.name)}
                                alt={card.name}
                                className="object-cover w-full h-full"
                                onError={(e) => {
                                  // If fallback image also fails, show text placeholder
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                  const parent = target.parentElement
                                  if (parent) {
                                    parent.innerHTML = `<div class="flex items-center justify-center text-xs text-gray-400 p-1 text-center">${card.name.substring(0, 8)}...</div>`
                                  }
                                }}
                              />
                            )}
                          </div>
                          
                          {/* Card details */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{card.name}</h4>
                            <p className="text-xs text-gray-400">{card.type}</p>
                            <p className="text-xs text-gaming-primary font-medium">{card.rarity}</p>
                            {card.number && (
                              <p className="text-xs text-gray-500">#{card.number}</p>
                            )}
                          </div>
                          
                          {/* Add button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              addToCart(card)
                            }}
                            className="ml-2 w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </motion.div>
                      )
                    })}
                    
                    {/* Load more button - hidden for Pokemon TCG due to progressive loading */}
                    {currentDropdownPage < totalDropdownPages && selectedGame !== 'Pokemon TCG' && !selectedGame.includes('Pokemon') && (
                      <div className="p-3 border-t border-gray-800">
                        <button
                          onClick={loadMoreDropdownCards}
                          disabled={dropdownLoading}
                          className="w-full py-2 px-4 bg-gaming-primary text-white rounded-lg hover:bg-gaming-secondary disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                        >
                          {dropdownLoading && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          )}
                          {dropdownLoading 
                            ? (selectedGame === 'Yu-Gi-Oh!' || selectedGame.includes('Yu-Gi-Oh')
                              ? 'Rate Limited Loading...'
                              : 'Loading...')
                            : 'Load More Cards'}
                        </button>
                      </div>
                    )}
                    
                    {/* Progressive loading indicator for Pokemon TCG */}
                    {(selectedGame === 'Pokemon TCG' || selectedGame.includes('Pokemon')) && dropdownLoading && (
                      <div className="p-3 border-t border-gray-800 text-center">
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gaming-primary"></div>
                          <span>Loading cards progressively... {dropdownCards.length} loaded so far</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Rate limited for optimal performance
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
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
          <div className="mb-6 p-4 bg-amber-900/20 border border-amber-800 rounded-lg">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-amber-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-amber-200 font-medium">
                  Rate Limit Notice
                </p>
                <p className="text-amber-300 text-sm">
                  Yu-Gi-Oh! API has rate limits. Please search more slowly.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-200">
              <span className="font-medium">Search for cards above and select from the dropdown results. Cards load 15 at a time for faster performance.</span>
            </p>
          </div>
        </div>

        {/* Inline Cart Section */}
        {totalCards > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto mb-8"
          >
            <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-lg">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Your Cart ({totalCards} cards)</h2>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">
                      {packageInfo[packageId].name} Package - ${packageInfo[packageId].price} per card
                    </p>
                    <p className="text-lg font-bold text-gaming-primary">
                      Total: ${totalPrice}
                    </p>
                  </div>
                </div>

                <CartSection
                  cart={cart}
                  packageInfo={packageInfo}
                  packageId={packageId}
                  totalCards={totalCards}
                  totalPrice={totalPrice}
                  failedImages={failedImages}
                  updateQuantity={updateQuantity}
                  updateCartVariant={updateCartVariant}
                  handleImageError={handleImageError}
                  handleCheckout={handleCheckout}
                />
              </div>
            </div>
          </motion.div>
        )}


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
                <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold">Add Custom Card</h2>
                      <button
                        onClick={() => setIsAddCardModalOpen(false)}
                        className="p-2 hover:bg-gray-800 rounded-lg"
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
                          className="w-full px-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-800"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Game</label>
                        <select
                          value={newCardForm.game}
                          onChange={(e) => handleFormChange('game', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-800"
                        >
                          {games.map(game => (
                            <option key={game} value={game}>{game}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Set Name</label>
                        <input
                          type="text"
                          value={newCardForm.setName}
                          onChange={(e) => handleFormChange('setName', e.target.value)}
                          placeholder="e.g., Base Set, Sword & Shield, Battle Styles..."
                          className="w-full px-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-800"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Card Type</label>
                        <input
                          type="text"
                          value={newCardForm.type}
                          onChange={(e) => handleFormChange('type', e.target.value)}
                          placeholder="e.g., Fire/Flying, Spellcaster, Artifact..."
                          className="w-full px-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-800"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Rarity</label>
                        <input
                          type="text"
                          value={newCardForm.rarity}
                          onChange={(e) => handleFormChange('rarity', e.target.value)}
                          placeholder="e.g., Rare Holo, Ultra Rare, Common..."
                          className="w-full px-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-800"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Card Number</label>
                        <input
                          type="text"
                          value={newCardForm.number}
                          onChange={(e) => handleFormChange('number', e.target.value)}
                          placeholder="e.g., 4/102, LOB-001..."
                          className="w-full px-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-800"
                        />
                      </div>

                      <div className="flex gap-3 pt-4">
                        <button
                          type="button"
                          onClick={() => setIsAddCardModalOpen(false)}
                          className="flex-1 px-4 py-2 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors"
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

                    <p className="text-xs text-gray-400 mt-4">
                      * This card will be added to your cart automatically.
                    </p>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

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

        {/* Click outside to close dropdown */}
        {showDropdown && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
        )}
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