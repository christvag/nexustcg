import { NextRequest, NextResponse } from 'next/server'

const TCGDEX_BASE_URL = 'https://api.tcgdex.net/v2/en'

interface TCGdexCard {
  id: string
  localId: string
  name: string
  image?: string
  set?: {
    id: string
    name: string
  }
  rarity?: string
  hp?: number
  types?: string[]
  category?: string
  stage?: string
  dexId?: number[]
}

interface TCGdexSet {
  id: string
  name: string
  logo?: string
  symbol?: string
  cardCount?: {
    total: number
    official: number
  }
}

// Convert TCGdx card to our Card format
function convertTCGdexCard(tcgCard: TCGdexCard) {
  const cardId = tcgCard.id
  const imageUrl = tcgCard.image || `https://via.placeholder.com/245x342/FF6B35/FFFFFF?text=${encodeURIComponent(tcgCard.name)}`
  
  // Extract set name from card ID (e.g., "base1-58" -> "Base Set")
  const setId = cardId.split('-')[0]
  let setName = 'Unknown Set'
  
  // Map common set IDs to readable names
  const setMappings: { [key: string]: string } = {
    'base1': 'Base Set',
    'base2': 'Jungle',
    'base3': 'Fossil',
    'base4': 'Team Rocket',
    'basep': 'Promotional',
    'gym1': 'Gym Heroes',
    'gym2': 'Gym Challenge',
    'neo1': 'Neo Genesis',
    'neo2': 'Neo Discovery',
    'neo3': 'Neo Destiny',
    'neo4': 'Neo Revelation',
    'xy1': 'XY Base Set',
    'xy2': 'Flashfire',
    'xy3': 'Furious Fists',
    'sm1': 'Sun & Moon',
    'sm2': 'Guardians Rising',
    'sm3': 'Burning Shadows',
    'swsh1': 'Sword & Shield',
    'swsh2': 'Rebel Clash',
    'swsh3': 'Darkness Ablaze',
    'sv01': 'Scarlet & Violet',
    'sv02': 'Paldea Evolved',
    'cel25': 'Celebrations'
  }
  
  setName = setMappings[setId] || setId.toUpperCase()
  
  return {
    id: `tcgdex-${cardId}`,
    name: tcgCard.name,
    game: 'Pokemon TCG',
    type: setName,
    rarity: tcgCard.rarity || 'Common',
    number: tcgCard.localId || 'N/A',
    imageUrl,
    sets: [{
      id: `tcgdex-${cardId}`,
      setName: setName,
      rarity: tcgCard.rarity || 'Common',
      number: tcgCard.localId || 'N/A',
      imageUrl
    }],
    availableSets: [setName],
    availableRarities: [tcgCard.rarity || 'Common']
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
      // Get available Pokemon TCG sets
      try {
        const setsResponse = await fetch(`${TCGDEX_BASE_URL}/sets`)
        if (!setsResponse.ok) {
          throw new Error(`TCGdx API error: ${setsResponse.status}`)
        }

        const setsData: TCGdexSet[] = await setsResponse.json()
        const setNames = setsData.map(set => set.name)

        return NextResponse.json({
          sets: setNames,
          game: 'Pokemon TCG'
        })
      } catch (error) {
        console.error('Error fetching sets:', error)
        return NextResponse.json({
          sets: ['Base Set', 'Jungle', 'Fossil', 'Team Rocket'],
          game: 'Pokemon TCG'
        })
      }
    }

    if (action === 'variations') {
      const cardName = searchParams.get('cardName')
      if (!cardName) {
        return NextResponse.json(
          { error: 'cardName parameter is required' },
          { status: 400 }
        )
      }

      // Search for all variations of this card
      try {
        const searchResponse = await fetch(`${TCGDEX_BASE_URL}/cards`)
        if (!searchResponse.ok) {
          throw new Error(`TCGdx API error: ${searchResponse.status}`)
        }
        
        const cardsData: TCGdexCard[] = await searchResponse.json()
        const matchingCards = cardsData.filter(card => 
          card.name.toLowerCase().includes(cardName.toLowerCase())
        )
        
        const variations = matchingCards.map(convertTCGdexCard)
        
        return NextResponse.json({
          variations,
          cardName,
          cardGame: 'Pokemon TCG'
        })
      } catch (error) {
        console.error('Error fetching variations:', error)
        return NextResponse.json({
          variations: [],
          cardName,
          cardGame: 'Pokemon TCG'
        })
      }
    }

    // Search functionality
    let apiUrl = `${TCGDEX_BASE_URL}/cards`
    
    // Add query parameter if search term provided
    if (query) {
      apiUrl += `?name=${encodeURIComponent(query)}`
    }
    
    try {
      const response = await fetch(apiUrl)
      if (!response.ok) {
        throw new Error(`TCGdx API error: ${response.status}`)
      }

      const cardsData: TCGdexCard[] = await response.json()
      
      let filteredCards = cardsData
      
      // Apply pagination
      const paginatedCards = filteredCards.slice(offset, offset + limit)
      
      // Convert to our format
      const cards = paginatedCards.map(convertTCGdexCard)
      
      // Group by name if we have multiple cards with same name
      const cardMap = new Map()
      cards.forEach(card => {
        if (!cardMap.has(card.name)) {
          cardMap.set(card.name, {
            ...card,
            sets: [card.sets![0]],
            availableSets: [card.type],
            availableRarities: [card.rarity]
          })
        } else {
          const existingCard = cardMap.get(card.name)
          // Add this set if it's not already included
          if (!existingCard.availableSets.includes(card.type)) {
            existingCard.sets.push(card.sets![0])
            existingCard.availableSets.push(card.type)
          }
          if (!existingCard.availableRarities.includes(card.rarity)) {
            existingCard.availableRarities.push(card.rarity)
          }
        }
      })

      const consolidatedCards = Array.from(cardMap.values())

      return NextResponse.json({
        cards: consolidatedCards,
        query,
        game: 'Pokemon TCG',
        limit,
        offset,
        count: consolidatedCards.length,
        totalCount: filteredCards.length,
        hasMore: offset + limit < filteredCards.length
      })

    } catch (error) {
      console.error('TCGdx API error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch Pokemon TCG cards from TCGdx API' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('TCGdx API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Pokemon TCG cards from API' },
      { status: 500 }
    )
  }
}