import sqlite3 from 'sqlite3'
import path from 'path'

// Database connection
let db: sqlite3.Database | null = null

const getDatabasePath = () => {
  // Path to the SQLite database in the project database folder
  return path.join(process.cwd(), 'database', 'FINAL_TRADING_CARDS_DATABASE.db')
}

const getDatabase = (): sqlite3.Database => {
  if (!db) {
    const dbPath = getDatabasePath()
    db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        console.error('Error opening database:', err.message)
        throw err
      }
      console.log('Connected to the trading cards SQLite database.')
    })
  }
  return db
}

// Database interface matching the schema
export interface TradingCard {
  id: number
  card_game: string
  set_name: string
  card_name: string
  rarity: string | null
  card_number: string | null
  card_image_url: string | null
  created_at: string
  updated_at: string
}

// Card interface for the frontend (matching existing Card interface)
export interface Card {
  id: string
  name: string
  game: string
  type: string
  rarity: string
  number: string
  imageUrl?: string
  sets?: Array<{
    id: string
    setName: string
    rarity: string
    number: string
    imageUrl?: string
  }>
  availableSets?: string[]
  availableRarities?: string[]
  cardImages?: Array<{
    id: number
    image_url: string
    image_url_small: string
    image_url_cropped: string
  }>
  selectedImageIndex?: number
}

// Generate better Pokemon card image URL
const getPokemonCardImageUrl = (cardName: string): string => {
  // For Pokemon cards, use local fallback image
  return '/Pokemon.png'
}

// Convert database card to frontend card format
const convertToFrontendCard = (dbCard: TradingCard): Card => {
  // Fix Pokemon card images that use placeholder icons
  let imageUrl = dbCard.card_image_url
  
  if (dbCard.card_game.toLowerCase().includes('pokemon') && 
      dbCard.card_image_url && 
      dbCard.card_image_url.includes('cardmarket.png')) {
    // Replace placeholder icon with proper Pokemon card placeholder
    imageUrl = getPokemonCardImageUrl(dbCard.card_name)
  }
  
  // Determine fallback based on game type
  const getFallbackForGame = (gameName: string) => {
    if (gameName.toLowerCase().includes('pokemon')) return '/Pokemon.png'
    if (gameName.toLowerCase().includes('yu-gi-oh') || gameName.toLowerCase().includes('yugioh')) return '/YuGiOh.png'
    if (gameName.toLowerCase().includes('mtg') || gameName.toLowerCase().includes('magic')) return '/MagictheGathering.png'
    return '/Pokemon.png'
  }
  
  const finalImageUrl = imageUrl || getFallbackForGame(dbCard.card_game)
  
  return {
    id: `db-${dbCard.id}`,
    name: dbCard.card_name,
    game: dbCard.card_game,
    type: dbCard.set_name, // Using set_name as type for now
    rarity: dbCard.rarity || 'Unknown',
    number: dbCard.card_number || 'N/A',
    imageUrl: finalImageUrl,
    // Add required fields for dropdown functionality
    availableSets: [dbCard.set_name].filter(Boolean),
    availableRarities: [dbCard.rarity || 'Unknown'],
    cardImages: [{
      id: dbCard.id,
      image_url: finalImageUrl,
      image_url_small: finalImageUrl,
      image_url_cropped: finalImageUrl
    }]
  }
}

// Search cards by name
export const searchCardsByName = (query: string, limit: number = 50): Promise<Card[]> => {
  return new Promise((resolve, reject) => {
    const database = getDatabase()
    const sql = `
      SELECT * FROM trading_cards 
      WHERE card_name LIKE ? 
      ORDER BY card_name 
      LIMIT ?
    `
    
    database.all(sql, [`%${query}%`, limit], (err, rows: TradingCard[]) => {
      if (err) {
        console.error('Error searching cards:', err.message)
        reject(err)
        return
      }
      
      const cards = rows.map(convertToFrontendCard)
      resolve(cards)
    })
  })
}

// Get cards by game
export const getCardsByGame = (game: string, limit: number = 50, offset: number = 0): Promise<Card[]> => {
  return new Promise((resolve, reject) => {
    const database = getDatabase()
    const sql = `
      SELECT * FROM trading_cards 
      WHERE card_game = ? 
      ORDER BY card_name 
      LIMIT ? OFFSET ?
    `
    
    database.all(sql, [game, limit, offset], (err, rows: TradingCard[]) => {
      if (err) {
        console.error('Error getting cards by game:', err.message)
        reject(err)
        return
      }
      
      const cards = rows.map(convertToFrontendCard)
      resolve(cards)
    })
  })
}

// Group cards by name and combine all variations (sets and rarities)
const groupCardsByName = (cards: TradingCard[]): Card[] => {
  const groupedMap = new Map<string, { mainCard: TradingCard, variations: TradingCard[] }>()
  
  cards.forEach(card => {
    const key = `${card.card_name}-${card.card_game}` // Group only by name and game, not set
    if (!groupedMap.has(key)) {
      groupedMap.set(key, { mainCard: card, variations: [card] })
    } else {
      // Add this variation if it's unique (different set or rarity)
      const existing = groupedMap.get(key)!
      const variationExists = existing.variations.some(v => 
        v.set_name === card.set_name && v.rarity === card.rarity && v.card_number === card.card_number
      )
      if (!variationExists) {
        existing.variations.push(card)
      }
    }
  })
  
  const result: Card[] = []
  groupedMap.forEach(({ mainCard, variations }) => {
    const convertedCard = convertToFrontendCard(mainCard)
    
    if (variations.length > 1) {
      // Multiple variations available
      convertedCard.type = 'Multiple Sets'
      convertedCard.rarity = 'Multiple Rarities'
      
      // Get unique sets and rarities
      const uniqueSets = [...new Set(variations.map(v => v.set_name))]
      const uniqueRarities = [...new Set(variations.map(v => v.rarity || 'Unknown'))]
      
      convertedCard.availableSets = uniqueSets
      convertedCard.availableRarities = uniqueRarities
      
      // Create sets array with all variations
      convertedCard.sets = variations.map(v => ({
        id: `db-${v.id}`,
        setName: v.set_name,
        rarity: v.rarity || 'Unknown',
        number: v.card_number || 'N/A',
        imageUrl: v.card_image_url || '/components/src/Pokemon.png'
      }))
    }
    
    result.push(convertedCard)
  })
  
  return result
}

// Cache for Pokemon card counts to support pagination
const pokemonCountCache = new Map<string, number>()

// Search Pokemon TCG cards using the TCGdx API with two-step flow
const searchPokemonCards = async (query?: string, limit: number = 10, offset: number = 0): Promise<Card[]> => {
  try {
    if (!query?.trim()) {
      return []
    }
    
    // Step 1: Search for cards by name to get basic info
    console.log(`[Pokemon API] Starting search: "${query}" (limit: ${limit}, offset: ${offset})`)
    
    // Add 3-second delay to prevent API stress
    console.log(`[Pokemon API] Adding 3-second delay...`)
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    const searchUrl = `https://api.tcgdex.net/v2/en/cards?name=${encodeURIComponent(query)}`
    console.log(`[Pokemon API] Step 1 - Fetching from: ${searchUrl}`)
    const searchResponse = await fetch(searchUrl)
    
    console.log(`[Pokemon API] Step 1 response status: ${searchResponse.status} ${searchResponse.statusText}`)
    if (!searchResponse.ok) {
      console.error(`[Pokemon API] Step 1 failed: ${searchResponse.status}`)
      throw new Error(`TCGdex search API error: ${searchResponse.status}`)
    }
    
    const searchData = await searchResponse.json()
    console.log(`[Pokemon API] Step 1 data:`, JSON.stringify(searchData, null, 2).substring(0, 500))
    let cardIds = searchData || []
    
    if (!Array.isArray(cardIds) || cardIds.length === 0) {
      console.log(`[Pokemon API] No cards found in step 1`)
      return []
    }
    
    console.log(`[Pokemon API] Found ${cardIds.length} total cards, applying pagination (offset: ${offset}, limit: ${limit})`)
    
    // Cache the total count for pagination
    const cacheKey = query.toLowerCase()
    pokemonCountCache.set(cacheKey, cardIds.length)
    
    // Apply manual pagination since API doesn't support it
    cardIds = cardIds.slice(offset, offset + limit)
    console.log(`[Pokemon API] After pagination: ${cardIds.length} cards to process`)
    
    // Step 2: Fetch detailed info for each card using their IDs
    const detailedCards: Card[] = []
    console.log(`[Pokemon API] Step 2 - Fetching details for ${cardIds.length} cards...`)
    
    for (let i = 0; i < cardIds.length; i++) {
      const cardBasic = cardIds[i]
      try {
        const cardId = cardBasic.id || cardBasic
        console.log(`[Pokemon API] Step 2 (${i + 1}/${cardIds.length}) - Card: ${cardId}`)
        
        // Add small delay between detailed card fetches
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const detailUrl = `https://api.tcgdex.net/v2/en/cards/${cardId}`
        console.log(`[Pokemon API] Fetching details from: ${detailUrl}`)
        const detailResponse = await fetch(detailUrl)
        
        console.log(`[Pokemon API] Detail response status: ${detailResponse.status}`)
        if (detailResponse.ok) {
          const cardDetail = await detailResponse.json()
          console.log(`[Pokemon API] Card detail:`, JSON.stringify(cardDetail, null, 2).substring(0, 300))
          const convertedCard = convertPokemonCard(cardDetail)
          if (convertedCard) {
            detailedCards.push(convertedCard)
            console.log(`[Pokemon API] Successfully converted card: ${convertedCard.name}`)
          } else {
            console.log(`[Pokemon API] Failed to convert card`)
          }
        } else {
          console.error(`[Pokemon API] Failed to fetch details for ${cardId}: ${detailResponse.status}`)
        }
      } catch (error) {
        console.error(`[Pokemon API] Error fetching Pokemon card details for ${cardId}:`, error)
        // Continue with other cards even if one fails
      }
    }
    
    console.log(`[Pokemon API] Step 2 complete. Converted ${detailedCards.length} cards`)
    return detailedCards
  } catch (error) {
    console.error('Error fetching Pokemon TCG cards:', error)
    return []
  }
}

// Convert Pokemon API card to our Card format
function convertPokemonCard(pokemonCard: any): Card | null {
  try {
    console.log(`[Pokemon Convert] Converting card:`, pokemonCard.name || 'Unknown')
    const cardId = pokemonCard.id || 'unknown'
    
    // Create image URLs with correct extensions
    const baseImageUrl = pokemonCard.image || '/components/src/Pokemon.png'
    const lowQualityImageUrl = baseImageUrl.includes('placeholder') ? baseImageUrl : `${baseImageUrl}/low.jpg`
    const highQualityImageUrl = baseImageUrl.includes('placeholder') ? baseImageUrl : `${baseImageUrl}/high.jpg`
    
    console.log(`[Pokemon Convert] Images - Base: ${baseImageUrl}, Low: ${lowQualityImageUrl}, High: ${highQualityImageUrl}`)
    
    // Get set and rarity information
    const setName = pokemonCard.set?.name || 'Unknown Set'
    const rarity = pokemonCard.rarity || 'Common'
    const cardNumber = pokemonCard.localId || pokemonCard.id || 'N/A'
    
    console.log(`[Pokemon Convert] Card info - Set: ${setName}, Rarity: ${rarity}, Number: ${cardNumber}`)
    
    return {
      id: `pokemon-${cardId}`,
      name: pokemonCard.name || 'Unknown Pokemon',
      game: 'Pokemon TCG',
      type: pokemonCard.types?.join('/') || pokemonCard.category || 'Pokemon',
      rarity: rarity,
      number: cardNumber,
      imageUrl: lowQualityImageUrl, // Use low quality for search/cart
      sets: [{
        id: `pokemon-${cardId}`,
        setName: setName,
        rarity: rarity,
        number: cardNumber,
        imageUrl: highQualityImageUrl // Use high quality for sets/popup
      }],
      availableSets: [setName],
      availableRarities: [rarity],
      // Store both image qualities for Pokemon cards
      cardImages: [{
        id: parseInt(cardId.replace(/\D/g, '')) || 0,
        image_url: highQualityImageUrl, // High quality for popup
        image_url_small: lowQualityImageUrl, // Low quality for thumbnails
        image_url_cropped: lowQualityImageUrl
      }]
    }
  } catch (error) {
    console.error('Error converting Pokemon card:', error)
    return null
  }
}

// Search Yu-Gi-Oh! cards directly using the YGOPRODeck API
const searchYuGiOhCards = async (query?: string, limit: number = 15, offset: number = 0): Promise<Card[]> => {
  try {
    // Import the YuGiOh API functions directly to avoid fetch issues
    const { yugiohRateLimiter, yugiohCache } = await import('@/lib/rate-limiter')
    
    // Return empty array if no query provided
    if (!query?.trim()) {
      return []
    }
    
    const searchQuery = query
    
    // Check cache first
    const cacheKey = `search:${searchQuery}:${limit}:${offset}`
    const cached = yugiohCache.get(cacheKey)
    
    if (cached) {
      return cached.cards || []
    }
    
    // Apply rate limiting
    await yugiohRateLimiter.throttle()
    
    const apiUrl = `https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(searchQuery)}`
    
    const response = await fetch(apiUrl)
    if (!response.ok) {
      throw new Error(`YuGiOh API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Apply pagination
    const paginatedCards = data.data.slice(offset, offset + limit)
    
    // Convert to our format
    const cards = paginatedCards.map((yugCard: any) => convertYuGiOhApiCard(yugCard))
    
    // Cache the result
    const result = { cards }
    yugiohCache.set(cacheKey, result)
    
    return cards
  } catch (error) {
    console.error('Error fetching Yu-Gi-Oh! cards:', error)
    return []
  }
}

// Convert YuGiOh API card to our Card format (moved from API file)
function convertYuGiOhApiCard(yugCard: any) {
  const cardId = yugCard.id.toString()
  const imageUrl = yugCard.card_images[0]?.image_url_small || '/components/src/YuGiOh.png'
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
  const availableSets = yugCard.card_sets?.map((set: any) => set.set_name) || [setName]
  const availableRarities = yugCard.card_sets?.map((set: any) => set.set_rarity) || [rarity]
  
  return {
    id: `yugioh-${cardId}`,
    name: yugCard.name,
    game: 'Yu-Gi-Oh!',
    type: yugCard.humanReadableCardType || yugCard.type,
    rarity: rarity,
    number: cardId,
    imageUrl,
    sets: yugCard.card_sets?.map((set: any) => ({
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

// Search cards with filters and prioritized results
export const searchCards = (
  query?: string,
  game?: string,
  setName?: string,
  limit: number = 15,
  offset: number = 0
): Promise<Card[]> => {
  // Check if this is a Pokemon search - route to API instead of database
  if (game && (game.toLowerCase().includes('pokemon') || game === 'Pokemon TCG')) {
    return searchPokemonCards(query, limit, offset)
  }
  
  // Check if this is a Yu-Gi-Oh! search - route to API instead of database
  if (game && (game.toLowerCase().includes('yu-gi-oh') || game === 'Yu-Gi-Oh!')) {
    return searchYuGiOhCards(query, limit, offset)
  }
  
  return new Promise((resolve, reject) => {
    const database = getDatabase()
    
    if (!query) {
      // No search query - just filter by game/set
      let sql = 'SELECT * FROM trading_cards WHERE 1=1'
      const params: any[] = []
      
      if (game && game !== 'All Games') {
        sql += ' AND card_game = ?'
        params.push(game)
      }
      
      if (setName) {
        sql += ' AND set_name = ?'
        params.push(setName)
      }
      
      sql += ' ORDER BY card_name LIMIT ? OFFSET ?'
      params.push(limit, offset)
      
      database.all(sql, params, (err, rows: TradingCard[]) => {
        if (err) {
          console.error('Error searching cards:', err.message)
          reject(err)
          return
        }
        
        // Return individual cards instead of grouped ones to show all variants
        const cards = rows.map(convertToFrontendCard)
        resolve(cards)
      })
      return
    }

    // With search query - implement highly accurate prioritized search
    const searchTerm = query.trim()
    
    // First, try an exact match query
    let sql = `
      SELECT *, 
        CASE 
          WHEN LOWER(card_name) = LOWER(?) THEN 0
          WHEN LOWER(REPLACE(card_name, ',', '')) = LOWER(REPLACE(?, ',', '')) THEN 1
          WHEN LOWER(REPLACE(card_name, '-', ' ')) = LOWER(REPLACE(?, '-', ' ')) THEN 2
          WHEN LOWER(card_name) LIKE LOWER(?) THEN 3
          WHEN LOWER(card_name) LIKE LOWER(?) THEN 4
          ELSE 5
        END as priority
      FROM trading_cards 
      WHERE (
        LOWER(card_name) = LOWER(?)
        OR LOWER(REPLACE(card_name, ',', '')) = LOWER(REPLACE(?, ',', ''))
        OR LOWER(REPLACE(card_name, '-', ' ')) = LOWER(REPLACE(?, '-', ' '))
        OR LOWER(card_name) LIKE LOWER(?)
        OR LOWER(card_name) LIKE LOWER(?)
    `
    
    const params: any[] = [
      searchTerm,              // Exact match priority 0
      searchTerm,              // Match without commas priority 1
      searchTerm,              // Match with hyphens/spaces priority 2
      searchTerm + '%',        // Starts with priority 3
      '%' + searchTerm + '%',  // Contains priority 4
      searchTerm,              // Exact match WHERE
      searchTerm,              // Match without commas WHERE
      searchTerm,              // Match with hyphens/spaces WHERE
      searchTerm + '%',        // Starts with WHERE
      '%' + searchTerm + '%'   // Contains WHERE
    ]
    
    sql += ')'
    
    if (game && game !== 'All Games') {
      sql += ' AND card_game = ?'
      params.push(game)
    }
    
    if (setName) {
      sql += ' AND set_name = ?'
      params.push(setName)
    }
    
    sql += ' ORDER BY priority ASC, card_name ASC LIMIT ? OFFSET ?'
    params.push(limit, offset)
    
    console.log('Executing search SQL:', sql)
    console.log('With parameters:', params)
    
    database.all(sql, params, (err, rows: TradingCard[]) => {
      if (err) {
        console.error('Error searching cards:', err.message)
        reject(err)
        return
      }
      
      console.log('Database returned rows:', rows.length)
      if (rows.length > 0) {
        console.log('First few results:', rows.slice(0, 3).map(r => r.card_name))
      }
      
      // Return individual cards instead of grouped ones to show all variants
      const cards = rows.map(convertToFrontendCard)
      resolve(cards)
    })
  })
}

// Get available games
export const getAvailableGames = (): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const database = getDatabase()
    const sql = 'SELECT DISTINCT card_game FROM trading_cards ORDER BY card_game'
    
    database.all(sql, [], (err, rows: { card_game: string }[]) => {
      if (err) {
        console.error('Error getting games:', err.message)
        reject(err)
        return
      }
      
      let games = rows.map(row => row.card_game)
      
      // Filter out any database Yu-Gi-Oh games to avoid duplicates
      games = games.filter(game => !game.toLowerCase().includes('yu'))
      
      // Filter out any database Pokemon games to avoid duplicates
      games = games.filter(game => !game.toLowerCase().includes('pokemon'))
      
      // Add Pokemon TCG from TCGdx API
      games.push('Pokemon TCG')
      
      // Add Yu-Gi-Oh! from YGOPRODeck API
      if (!games.includes('Yu-Gi-Oh!')) {
        games.push('Yu-Gi-Oh!')
      }
      games.sort()
      resolve(games)
    })
  })
}

// Get Pokemon TCG sets using the TCGdx API
const getPokemonSets = async (): Promise<string[]> => {
  try {
    const response = await fetch('/api/tcgdex?action=sets')
    if (!response.ok) {
      throw new Error(`TCGdx API error: ${response.status}`)
    }
    
    const data = await response.json()
    return data.sets || []
  } catch (error) {
    console.error('Error fetching Pokemon TCG sets:', error)
    return []
  }
}

// Get Yu-Gi-Oh! sets using the YGOPRODeck API
const getYuGiOhSets = async (): Promise<string[]> => {
  try {
    // Return common YuGiOh sets
    return [
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
    ]
  } catch (error) {
    console.error('Error fetching Yu-Gi-Oh! sets:', error)
    return []
  }
}

// Get available sets for a game
export const getAvailableSets = (game: string): Promise<string[]> => {
  // Check if this is a Pokemon request - route to API instead of database
  if (game && (game.toLowerCase().includes('pokemon') || game === 'Pokemon TCG')) {
    return getPokemonSets()
  }
  
  // Check if this is a Yu-Gi-Oh! request - route to API instead of database
  if (game && (game.toLowerCase().includes('yu-gi-oh') || game === 'Yu-Gi-Oh!')) {
    return getYuGiOhSets()
  }
  
  return new Promise((resolve, reject) => {
    const database = getDatabase()
    const sql = 'SELECT DISTINCT set_name FROM trading_cards WHERE card_game = ? ORDER BY set_name'
    
    database.all(sql, [game], (err, rows: { set_name: string }[]) => {
      if (err) {
        console.error('Error getting sets:', err.message)
        reject(err)
        return
      }
      
      const sets = rows.map(row => row.set_name)
      resolve(sets)
    })
  })
}

// Get total count for pagination - matching the search logic
export const getCardCount = (
  query?: string,
  game?: string,
  setName?: string
): Promise<number> => {
  // Check if this is a Pokemon search - return cached count or estimate
  if (game && (game.toLowerCase().includes('pokemon') || game === 'Pokemon TCG')) {
    if (query) {
      const cacheKey = query.toLowerCase()
      const cachedCount = pokemonCountCache.get(cacheKey)
      if (cachedCount !== undefined) {
        return Promise.resolve(cachedCount)
      }
    }
    return Promise.resolve(100) // Return a reasonable default count for Pokemon TCG
  }
  
  // Check if this is a Yu-Gi-Oh! search - return approximate count for now
  if (game && (game.toLowerCase().includes('yu-gi-oh') || game === 'Yu-Gi-Oh!')) {
    return Promise.resolve(500) // Return a reasonable default count for Yu-Gi-Oh!
  }
  
  return new Promise((resolve, reject) => {
    const database = getDatabase()
    
    if (!query) {
      // No search query - just count by game/set filters
      let sql = 'SELECT COUNT(*) as count FROM trading_cards WHERE 1=1'
      const params: any[] = []
      
      if (game && game !== 'All Games') {
        sql += ' AND card_game = ?'
        params.push(game)
      }
      
      if (setName) {
        sql += ' AND set_name = ?'
        params.push(setName)
      }
      
      database.get(sql, params, (err, row: { count: number }) => {
        if (err) {
          console.error('Error getting card count:', err.message)
          reject(err)
          return
        }
        
        resolve(row.count)
      })
      return
    }

    // With search query - count matching cards
    const searchTerm = query.trim()
    
    let sql = `
      SELECT COUNT(*) as count 
      FROM trading_cards 
      WHERE (
        LOWER(card_name) = LOWER(?)
        OR LOWER(REPLACE(card_name, ',', '')) = LOWER(REPLACE(?, ',', ''))
        OR LOWER(REPLACE(card_name, '-', ' ')) = LOWER(REPLACE(?, '-', ' '))
        OR LOWER(card_name) LIKE LOWER(?)
        OR LOWER(card_name) LIKE LOWER(?)
    `
    
    const params: any[] = [
      searchTerm,              // Exact match
      searchTerm,              // Match without commas
      searchTerm,              // Match with hyphens/spaces
      searchTerm + '%',        // Starts with
      '%' + searchTerm + '%'   // Contains
    ]
    
    sql += ')'
    
    if (game && game !== 'All Games') {
      sql += ' AND card_game = ?'
      params.push(game)
    }
    
    if (setName) {
      sql += ' AND set_name = ?'
      params.push(setName)
    }
    
    database.get(sql, params, (err, row: { count: number }) => {
      if (err) {
        console.error('Error getting card count:', err.message)
        reject(err)
        return
      }
      
      resolve(row.count)
    })
  })
}

// Get card by ID
export const getCardById = (id: string): Promise<Card | null> => {
  return new Promise((resolve, reject) => {
    const database = getDatabase()
    // Remove 'db-' prefix to get the actual database ID
    const dbId = parseInt(id.replace('db-', ''))
    
    const sql = 'SELECT * FROM trading_cards WHERE id = ?'
    
    database.get(sql, [dbId], (err, row: TradingCard) => {
      if (err) {
        console.error('Error getting card by ID:', err.message)
        reject(err)
        return
      }
      
      if (!row) {
        resolve(null)
        return
      }
      
      const card = convertToFrontendCard(row)
      resolve(card)
    })
  })
}

// Get Pokemon TCG card variations using the TCGdx API
const getPokemonCardVariations = async (cardName: string): Promise<Card[]> => {
  try {
    const params = new URLSearchParams()
    params.append('action', 'variations')
    params.append('cardName', cardName)
    
    const response = await fetch(`/api/tcgdex?${params}`)
    if (!response.ok) {
      throw new Error(`TCGdx API error: ${response.status}`)
    }
    
    const data = await response.json()
    return data.variations || []
  } catch (error) {
    console.error('Error fetching Pokemon TCG card variations:', error)
    return []
  }
}

// Get Yu-Gi-Oh! card variations using the YGOPRODeck API
const getYuGiOhCardVariations = async (cardName: string): Promise<Card[]> => {
  try {
    const { yugiohRateLimiter, yugiohCache } = await import('@/lib/rate-limiter')
    
    const cacheKey = `variations:${cardName}`
    const cached = yugiohCache.get(cacheKey)
    
    if (cached) {
      return cached
    }
    
    // Apply rate limiting
    await yugiohRateLimiter.throttle()
    
    const apiUrl = `https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(cardName)}`
    const response = await fetch(apiUrl)
    
    if (!response.ok) {
      throw new Error(`YuGiOh API error: ${response.status}`)
    }
    
    const data = await response.json()
    const variations = data.data.map((yugCard: any) => convertYuGiOhApiCard(yugCard))
    
    // Cache the result
    yugiohCache.set(cacheKey, variations)
    
    return variations
  } catch (error) {
    console.error('Error fetching Yu-Gi-Oh! card variations:', error)
    return []
  }
}

// Get all variations of a card by name and game
export const getCardVariations = (cardName: string, cardGame: string): Promise<Card[]> => {
  // Check if this is a Pokemon search - route to API instead of database
  if (cardGame && (cardGame.toLowerCase().includes('pokemon') || cardGame === 'Pokemon TCG')) {
    return getPokemonCardVariations(cardName)
  }
  
  // Check if this is a Yu-Gi-Oh! search - route to API instead of database
  if (cardGame && (cardGame.toLowerCase().includes('yu-gi-oh') || cardGame === 'Yu-Gi-Oh!')) {
    return getYuGiOhCardVariations(cardName)
  }
  
  return new Promise((resolve, reject) => {
    const database = getDatabase()
    const sql = `
      SELECT * FROM trading_cards 
      WHERE LOWER(card_name) = LOWER(?) AND card_game = ?
      ORDER BY set_name, rarity
    `
    
    database.all(sql, [cardName, cardGame], (err, rows: TradingCard[]) => {
      if (err) {
        console.error('Error getting card variations:', err.message)
        reject(err)
        return
      }
      
      // Group by set and rarity
      const groupedVariations = new Map<string, TradingCard>()
      rows.forEach(card => {
        const key = `${card.set_name}-${card.rarity}-${card.card_number}`
        if (!groupedVariations.has(key)) {
          groupedVariations.set(key, card)
        }
      })
      
      const variations = Array.from(groupedVariations.values()).map(convertToFrontendCard)
      resolve(variations)
    })
  })
}

// Close database connection
export const closeDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message)
          reject(err)
          return
        }
        console.log('Database connection closed.')
        db = null
        resolve()
      })
    } else {
      resolve()
    }
  })
}