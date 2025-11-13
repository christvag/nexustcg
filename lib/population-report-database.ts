import sqlite3 from 'sqlite3'
import path from 'path'

const DATABASE_PATH = path.join(process.cwd(), 'database', 'graded-cards.db')

interface PopulationReportCard {
  id?: number
  card_id: string
  card_game: string
  card_name: string
  card_grade: string
  set_name: string
  edition?: string
  rarity: string
  card_info?: string
  card_owner: string
  date_graded: string
  front_image?: string
  back_image?: string
  created_at?: string
  updated_at?: string
}

interface AnalyticsData {
  totalCards: number
  lastSubmission: {
    cardName: string
    date: string
    grade: string
  } | null
  byGame: { game: string; count: number }[]
  byRarity: { rarity: string; count: number }[]
  byOwner: { owner: string; count: number }[]
  byMonth: { month: string; count: number }[]
}

class PopulationReportDatabase {
  private db: sqlite3.Database | null = null

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DATABASE_PATH, (err) => {
        if (err) {
          console.error('❌ Error connecting to population report database:', err.message)
          reject(err)
        } else {
          console.log('✅ Connected to population report database')
          this.initializeSchema().then(resolve).catch(reject)
        }
      })
    })
  }

  private async initializeSchema(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'))
        return
      }

      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS population_report_cards (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          card_id TEXT NOT NULL UNIQUE,
          card_game TEXT NOT NULL,
          card_name TEXT NOT NULL,
          card_grade TEXT NOT NULL,
          set_name TEXT NOT NULL,
          edition TEXT,
          rarity TEXT NOT NULL,
          card_info TEXT,
          card_owner TEXT NOT NULL,
          date_graded TEXT NOT NULL,
          front_image TEXT,
          back_image TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `

      this.db.run(createTableSQL, (err) => {
        if (err) {
          console.error('❌ Error creating table:', err.message)
          reject(err)
        } else {
          console.log('✅ Population report table ready')
          resolve()
        }
      })
    })
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(err)
          } else {
            this.db = null
            resolve()
          }
        })
      } else {
        resolve()
      }
    })
  }

  async runQuery(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'))
        return
      }

      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('❌ Database query error:', err.message)
          reject(err)
        } else {
          resolve(rows)
        }
      })
    })
  }

  async insertCard(card: Omit<PopulationReportCard, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'))
        return
      }

      const sql = `
        INSERT INTO population_report_cards (
          card_id, card_game, card_name, card_grade,
          set_name, edition, rarity, card_info, card_owner, date_graded,
          front_image, back_image
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `

      this.db.run(sql, [
        card.card_id,
        card.card_game,
        card.card_name,
        card.card_grade,
        card.set_name,
        card.edition || '',
        card.rarity,
        card.card_info || '',
        card.card_owner,
        card.date_graded,
        card.front_image || '',
        card.back_image || ''
      ], function(err) {
        if (err) {
          console.error('❌ Error inserting card:', err.message)
          reject(err)
        } else {
          resolve(this.lastID)
        }
      })
    })
  }

  async getAllCards(): Promise<PopulationReportCard[]> {
    const sql = 'SELECT * FROM population_report_cards ORDER BY created_at DESC'
    return await this.runQuery(sql)
  }

  async deleteCard(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'))
        return
      }

      const sql = 'DELETE FROM population_report_cards WHERE id = ?'
      this.db.run(sql, [id], (err) => {
        if (err) {
          console.error('❌ Error deleting card:', err.message)
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  async getAnalytics(): Promise<AnalyticsData> {
    const cards = await this.getAllCards()
    const totalCards = cards.length

    // Last submission
    const lastSubmission = cards.length > 0 ? {
      cardName: cards[0].card_name,
      date: cards[0].date_graded,
      grade: cards[0].card_grade
    } : null

    // By Game
    const gameMap = new Map<string, number>()
    cards.forEach(card => {
      gameMap.set(card.card_game, (gameMap.get(card.card_game) || 0) + 1)
    })
    const byGame = Array.from(gameMap.entries())
      .map(([game, count]) => ({ game, count }))
      .sort((a, b) => b.count - a.count)

    // By Rarity
    const rarityMap = new Map<string, number>()
    cards.forEach(card => {
      rarityMap.set(card.rarity, (rarityMap.get(card.rarity) || 0) + 1)
    })
    const byRarity = Array.from(rarityMap.entries())
      .map(([rarity, count]) => ({ rarity, count }))
      .sort((a, b) => b.count - a.count)

    // By Owner
    const ownerMap = new Map<string, number>()
    cards.forEach(card => {
      ownerMap.set(card.card_owner, (ownerMap.get(card.card_owner) || 0) + 1)
    })
    const byOwner = Array.from(ownerMap.entries())
      .map(([owner, count]) => ({ owner, count }))
      .sort((a, b) => b.count - a.count)

    // By Month
    const monthMap = new Map<string, number>()
    cards.forEach(card => {
      const date = new Date(card.date_graded)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1)
    })
    const byMonth = Array.from(monthMap.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6) // Last 6 months

    return {
      totalCards,
      lastSubmission,
      byGame,
      byRarity,
      byOwner,
      byMonth
    }
  }
}

// Export singleton instance
export const populationReportDb = new PopulationReportDatabase()

// Helper function to initialize database
export async function initializePopulationReportDatabase() {
  try {
    await populationReportDb.connect()
    console.log('✅ Population report database ready')
    return true
  } catch (error) {
    console.error('❌ Failed to initialize population report database:', error)
    return false
  }
}

export type { PopulationReportCard, AnalyticsData }
