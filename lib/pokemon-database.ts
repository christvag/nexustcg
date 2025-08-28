import sqlite3 from 'sqlite3'
import path from 'path'

// Database connection
let db: sqlite3.Database | null = null

const getDatabasePath = () => {
  // Path to the Pokemon SQLite database
  return path.join(process.cwd(), 'database', 'pokemon_cards_complete.db')
}

const getDatabase = (): sqlite3.Database => {
  if (!db) {
    const dbPath = getDatabasePath()
    db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        console.error('Error opening Pokemon database:', err.message)
        throw err
      }
      console.log('Connected to the Pokemon cards SQLite database.')
    })
  }
  return db
}

// Enhanced Pokemon card interface with all fields
export interface PokemonCard {
  id: number
  card_game: string
  set_name: string
  card_name: string
  card_number: string | null
  rarity: string | null
  card_type: string | null
  hp: number | null
  attacks: string | null
  weakness: string | null
  resistance: string | null
  retreat_cost: number | null
  illustrator: string | null
  print_versions: string | null
  card_image_url: string | null
  source_url: string | null
  created_at: string
  updated_at: string
}

// Card interface for the frontend
export interface Card {
  id: string
  name: string
  game: string
  type: string
  rarity: string
  number: string
  imageUrl?: string
  hp?: number
  attacks?: any[]
  weakness?: string
  resistance?: string
  retreatCost?: number
  illustrator?: string
  setName?: string
}

// Convert database card to frontend card format
const convertToFrontendCard = (dbCard: PokemonCard): Card => {
  let attacks = []
  if (dbCard.attacks) {
    try {
      attacks = JSON.parse(dbCard.attacks)
    } catch (e) {
      attacks = [{ name: dbCard.attacks, details: dbCard.attacks }]
    }
  }

  return {
    id: `pk-${dbCard.id}`,
    name: dbCard.card_name,
    game: 'Pokemon',
    type: dbCard.card_type || 'Pokemon',
    rarity: dbCard.rarity || 'Unknown',
    number: dbCard.card_number || 'N/A',
    imageUrl: dbCard.card_image_url || 'https://via.placeholder.com/200x280?text=' + encodeURIComponent(dbCard.card_name),
    hp: dbCard.hp || undefined,
    attacks: attacks.length > 0 ? attacks : undefined,
    weakness: dbCard.weakness || undefined,
    resistance: dbCard.resistance || undefined,
    retreatCost: dbCard.retreat_cost || undefined,
    illustrator: dbCard.illustrator || undefined,
    setName: dbCard.set_name
  }
}

// Search Pokemon cards by name
export const searchPokemonByName = (query: string, limit: number = 50): Promise<Card[]> => {
  return new Promise((resolve, reject) => {
    const database = getDatabase()
    const sql = `
      SELECT * FROM trading_cards_enhanced 
      WHERE card_name LIKE ? 
      ORDER BY card_name 
      LIMIT ?
    `
    
    database.all(sql, [`%${query}%`, limit], (err, rows: PokemonCard[]) => {
      if (err) {
        console.error('Error searching Pokemon cards:', err.message)
        reject(err)
        return
      }
      
      const cards = rows.map(convertToFrontendCard)
      resolve(cards)
    })
  })
}

// Get Pokemon cards by set
export const getPokemonBySet = (setName: string, limit: number = 50, offset: number = 0): Promise<Card[]> => {
  return new Promise((resolve, reject) => {
    const database = getDatabase()
    const sql = `
      SELECT * FROM trading_cards_enhanced 
      WHERE set_name = ? 
      ORDER BY CAST(card_number AS INTEGER), card_name 
      LIMIT ? OFFSET ?
    `
    
    database.all(sql, [setName, limit, offset], (err, rows: PokemonCard[]) => {
      if (err) {
        console.error('Error getting Pokemon by set:', err.message)
        reject(err)
        return
      }
      
      const cards = rows.map(convertToFrontendCard)
      resolve(cards)
    })
  })
}

// Search Pokemon cards with advanced filters
export const searchPokemon = (
  query?: string,
  setName?: string,
  rarity?: string,
  cardType?: string,
  limit: number = 15,
  offset: number = 0
): Promise<Card[]> => {
  return new Promise((resolve, reject) => {
    const database = getDatabase()
    
    let sql = 'SELECT * FROM trading_cards_enhanced WHERE 1=1'
    const params: any[] = []
    
    if (query) {
      sql += ' AND (LOWER(card_name) LIKE LOWER(?) OR LOWER(card_number) LIKE LOWER(?))'
      params.push(`%${query}%`, `%${query}%`)
    }
    
    if (setName && setName !== 'All Sets') {
      sql += ' AND set_name = ?'
      params.push(setName)
    }
    
    if (rarity && rarity !== 'All Rarities') {
      sql += ' AND rarity = ?'
      params.push(rarity)
    }
    
    if (cardType && cardType !== 'All Types') {
      sql += ' AND card_type LIKE ?'
      params.push(`%${cardType}%`)
    }
    
    sql += ' ORDER BY set_name, CAST(card_number AS INTEGER), card_name LIMIT ? OFFSET ?'
    params.push(limit, offset)
    
    console.log('Executing Pokemon search SQL:', sql)
    console.log('With parameters:', params)
    
    database.all(sql, params, (err, rows: PokemonCard[]) => {
      if (err) {
        console.error('Error searching Pokemon cards:', err.message)
        reject(err)
        return
      }
      
      console.log('Database returned rows:', rows.length)
      if (rows.length > 0) {
        console.log('First few results:', rows.slice(0, 3).map(r => `${r.card_name} (${r.set_name} #${r.card_number})`))
      }
      
      const cards = rows.map(convertToFrontendCard)
      resolve(cards)
    })
  })
}

// Get available Pokemon sets
export const getAvailableSets = (): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const database = getDatabase()
    const sql = 'SELECT DISTINCT set_name FROM trading_cards_enhanced ORDER BY set_name'
    
    database.all(sql, [], (err, rows: { set_name: string }[]) => {
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

// Get available rarities
export const getAvailableRarities = (): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const database = getDatabase()
    const sql = 'SELECT DISTINCT rarity FROM trading_cards_enhanced WHERE rarity IS NOT NULL ORDER BY rarity'
    
    database.all(sql, [], (err, rows: { rarity: string }[]) => {
      if (err) {
        console.error('Error getting rarities:', err.message)
        reject(err)
        return
      }
      
      const rarities = rows.map(row => row.rarity)
      resolve(rarities)
    })
  })
}

// Get available card types
export const getAvailableTypes = (): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const database = getDatabase()
    const sql = 'SELECT DISTINCT card_type FROM trading_cards_enhanced WHERE card_type IS NOT NULL ORDER BY card_type'
    
    database.all(sql, [], (err, rows: { card_type: string }[]) => {
      if (err) {
        console.error('Error getting card types:', err.message)
        reject(err)
        return
      }
      
      const types = rows.map(row => row.card_type)
      resolve(types)
    })
  })
}

// Get total count for pagination
export const getPokemonCount = (
  query?: string,
  setName?: string,
  rarity?: string,
  cardType?: string
): Promise<number> => {
  return new Promise((resolve, reject) => {
    const database = getDatabase()
    
    let sql = 'SELECT COUNT(*) as count FROM trading_cards_enhanced WHERE 1=1'
    const params: any[] = []
    
    if (query) {
      sql += ' AND (LOWER(card_name) LIKE LOWER(?) OR LOWER(card_number) LIKE LOWER(?))'
      params.push(`%${query}%`, `%${query}%`)
    }
    
    if (setName && setName !== 'All Sets') {
      sql += ' AND set_name = ?'
      params.push(setName)
    }
    
    if (rarity && rarity !== 'All Rarities') {
      sql += ' AND rarity = ?'
      params.push(rarity)
    }
    
    if (cardType && cardType !== 'All Types') {
      sql += ' AND card_type LIKE ?'
      params.push(`%${cardType}%`)
    }
    
    database.get(sql, params, (err, row: { count: number }) => {
      if (err) {
        console.error('Error getting Pokemon count:', err.message)
        reject(err)
        return
      }
      
      resolve(row.count)
    })
  })
}

// Get Pokemon card by ID
export const getPokemonById = (id: string): Promise<Card | null> => {
  return new Promise((resolve, reject) => {
    const database = getDatabase()
    // Remove 'pk-' prefix to get the actual database ID
    const dbId = parseInt(id.replace('pk-', ''))
    
    const sql = 'SELECT * FROM trading_cards_enhanced WHERE id = ?'
    
    database.get(sql, [dbId], (err, row: PokemonCard) => {
      if (err) {
        console.error('Error getting Pokemon by ID:', err.message)
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

// Get random Pokemon cards (for featured/showcase)
export const getRandomPokemon = (limit: number = 10): Promise<Card[]> => {
  return new Promise((resolve, reject) => {
    const database = getDatabase()
    const sql = `
      SELECT * FROM trading_cards_enhanced 
      ORDER BY RANDOM() 
      LIMIT ?
    `
    
    database.all(sql, [limit], (err, rows: PokemonCard[]) => {
      if (err) {
        console.error('Error getting random Pokemon:', err.message)
        reject(err)
        return
      }
      
      const cards = rows.map(convertToFrontendCard)
      resolve(cards)
    })
  })
}

// Close database connection
export const closeDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          console.error('Error closing Pokemon database:', err.message)
          reject(err)
          return
        }
        console.log('Pokemon database connection closed.')
        db = null
        resolve()
      })
    } else {
      resolve()
    }
  })
}