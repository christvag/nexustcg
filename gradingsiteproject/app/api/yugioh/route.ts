import { NextRequest, NextResponse } from 'next/server'
import { yugiohRateLimiter, yugiohCache } from '@/lib/rate-limiter'

const YUGIOH_API_BASE_URL = 'https://db.ygoprodeck.com/api/v7'

interface YuGiOhCard {
  id: number
  name: string
  type: string
  humanReadableCardType: string
  frameType: string
  desc: string
  race?: string
  atk?: number
  def?: number
  level?: number
  attribute?: string
  archetype?: string
  ygoprodeck_url: string
  card_sets?: Array<{
    set_name: string
    set_code: string
    set_rarity: string
    set_rarity_code: string
    set_price: string
  }>
  card_images: Array<{
    id: number
    image_url: string
    image_url_small: string
    image_url_cropped: string
  }>
  card_prices?: Array<{
    cardmarket_price: string
    tcgplayer_price: string
    ebay_price: string
    amazon_price: string
    coolstuffinc_price: string
  }>
}

interface YuGiOhApiResponse {
  data: YuGiOhCard[]
}

// Convert YuGiOh API card to our Card format
function convertYuGiOhCard(yugCard: YuGiOhCard) {
  const cardId = yugCard.id.toString()
  const imageUrl = yugCard.card_images[0]?.image_url_small || yugCard.card_images[0]?.image_url || '/components/src/YuGiOh.png'
  const fullImageUrl = yugCard.card_images[0]?.image_url || imageUrl
  
  // Store all card images for variant selection
  const cardImages = yugCard.card_images || [{
    id: yugCard.id,
    image_url: fullImageUrl,
    image_url_small: imageUrl,
    image_url_cropped: imageUrl
  }]
  
  // Get set information if available
  const primarySet = yugCard.card_sets?.[0]
  const setName = primarySet?.set_name || 'Unknown Set'
  const rarity = primarySet?.set_rarity || 'Common'
  
  // Get all available sets and rarities
  const availableSets = yugCard.card_sets?.map(set => set.set_name) || [setName]
  const availableRarities = yugCard.card_sets?.map(set => set.set_rarity) || [rarity]
  
  return {
    id: `yugioh-${cardId}`,
    name: yugCard.name,
    game: 'Yu-Gi-Oh!',
    type: yugCard.humanReadableCardType || yugCard.type,
    rarity: rarity,
    number: cardId,
    imageUrl,
    sets: yugCard.card_sets?.map(set => ({
      id: `yugioh-${cardId}-${set.set_code}`,
      setName: set.set_name,
      rarity: set.set_rarity,
      number: set.set_code,
      imageUrl: fullImageUrl
    })) || [{
      id: `yugioh-${cardId}`,
      setName: setName,
      rarity: rarity,
      number: cardId,
      imageUrl: fullImageUrl
    }],
    availableSets: [...new Set(availableSets)],
    availableRarities: [...new Set(availableRarities)],
    cardImages: cardImages // Add all available images for YuGiOh cards
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '15')
    const offset = parseInt(searchParams.get('offset') || '0')
    const action = searchParams.get('action')

    // Special actions
    if (action === 'sets') {
      // Return some common YuGiOh sets
      return NextResponse.json({
        sets: [
          'Legend of Blue Eyes White Dragon',
          'Metal Raiders',
          'Spell Ruler',
          'Pharaoh\'s Servant',
          'Labyrinth of Nightmare',
          'Legacy of Darkness',
          'Pharaonic Guardian',
          'Magician\'s Force',
          'Dark Crisis',
          'Invasion of Chaos'
        ],
        game: 'Yu-Gi-Oh!'
      })
    }

    if (action === 'variations') {
      const cardName = searchParams.get('cardName')
      if (!cardName) {
        return NextResponse.json(
          { error: 'cardName parameter is required' },
          { status: 400 }
        )
      }

      // Search for variations of this card
      try {
        const cacheKey = `variations:${cardName}`
        const cached = yugiohCache.get(cacheKey)
        
        if (cached) {
          return NextResponse.json({
            variations: cached,
            cardName,
            cardGame: 'Yu-Gi-Oh!',
            cached: true
          })
        }
        
        // Apply rate limiting
        await yugiohRateLimiter.throttle()
        
        const apiUrl = `${YUGIOH_API_BASE_URL}/cardinfo.php?name=${encodeURIComponent(cardName)}`
        const response = await fetch(apiUrl)
        
        if (!response.ok) {
          throw new Error(`YuGiOh API error: ${response.status}`)
        }
        
        const data: YuGiOhApiResponse = await response.json()
        const variations = data.data.map(convertYuGiOhCard)
        
        // Cache the result
        yugiohCache.set(cacheKey, variations)
        
        return NextResponse.json({
          variations,
          cardName,
          cardGame: 'Yu-Gi-Oh!'
        })
      } catch (error) {
        console.error('Error fetching variations:', error)
        return NextResponse.json({
          variations: [],
          cardName,
          cardGame: 'Yu-Gi-Oh!'
        })
      }
    }

    // Search functionality
    if (!query?.trim()) {
      return NextResponse.json({
        cards: [],
        query: '',
        game: 'Yu-Gi-Oh!',
        limit,
        offset,
        count: 0,
        totalCount: 0,
        hasMore: false
      })
    }
    
    const searchQuery = query
    
    // Check cache first
    const cacheKey = `search:${searchQuery}:${limit}:${offset}`
    const cached = yugiohCache.get(cacheKey)
    
    if (cached) {
      return NextResponse.json({
        ...cached,
        cached: true
      })
    }
    
    // Apply rate limiting
    await yugiohRateLimiter.throttle()
    
    let apiUrl = `${YUGIOH_API_BASE_URL}/cardinfo.php`
    // Add search parameter
    apiUrl += `?name=${encodeURIComponent(searchQuery)}`
    
    try {
      const response = await fetch(apiUrl)
      if (!response.ok) {
        throw new Error(`YuGiOh API error: ${response.status}`)
      }

      const data: YuGiOhApiResponse = await response.json()
      
      // Apply pagination
      const paginatedCards = data.data.slice(offset, offset + limit)
      
      // Convert to our format
      const cards = paginatedCards.map(convertYuGiOhCard)
      
      // Group by name if we have multiple cards with same name
      const cardMap = new Map()
      cards.forEach(card => {
        if (!cardMap.has(card.name)) {
          cardMap.set(card.name, {
            ...card,
            sets: card.sets,
            availableSets: card.availableSets,
            availableRarities: card.availableRarities
          })
        } else {
          const existingCard = cardMap.get(card.name)
          // Merge sets and rarities
          const allSets = [...existingCard.sets, ...card.sets]
          const allSetNames = [...existingCard.availableSets, ...card.availableSets]
          const allRarities = [...existingCard.availableRarities, ...card.availableRarities]
          
          existingCard.sets = allSets
          existingCard.availableSets = [...new Set(allSetNames)]
          existingCard.availableRarities = [...new Set(allRarities)]
        }
      })

      const consolidatedCards = Array.from(cardMap.values())

      const result = {
        cards: consolidatedCards,
        query: searchQuery,
        game: 'Yu-Gi-Oh!',
        limit,
        offset,
        count: consolidatedCards.length,
        totalCount: data.data.length,
        hasMore: offset + limit < data.data.length
      }
      
      // Cache the result
      yugiohCache.set(cacheKey, result)

      return NextResponse.json(result)

    } catch (error) {
      console.error('YuGiOh API error:', error)
      
      return NextResponse.json(
        { error: 'Failed to fetch Yu-Gi-Oh! cards from API' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('YuGiOh API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Yu-Gi-Oh! cards from API' },
      { status: 500 }
    )
  }
}