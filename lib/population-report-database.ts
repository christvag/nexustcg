import sqlite3 from 'sqlite3'
import path from 'path'

const DATABASE_PATH = path.join(process.cwd(), 'database', 'graded-cards.db')

interface PopulationReportCard {
  id?: number
  card_id: string
  card_game: string
  card_name: string
  card_grade: string
  grade_name?: string
  year_card?: string
  set_name?: string
  edition?: string
  rarity: string
  card_number?: string
  card_info?: string
  card_owner?: string
  date_graded: string
  front_image?: string
  back_image?: string
  is_featured?: number
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
          grade_name TEXT,
          year_card TEXT,
          set_name TEXT NOT NULL,
          edition TEXT,
          rarity TEXT NOT NULL,
          card_number TEXT,
          card_info TEXT,
          date_graded TEXT NOT NULL,
          front_image TEXT,
          back_image TEXT,
          is_featured INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `

      this.db.run(createTableSQL, (err) => {
        if (err) {
          console.error('❌ Error creating table:', err.message)
          reject(err)
        } else {
          // Add is_featured column if it doesn't exist (for existing databases)
          this.db!.run(`ALTER TABLE population_report_cards ADD COLUMN is_featured INTEGER DEFAULT 0`, (alterErr) => {
            // Ignore error if column already exists
            if (alterErr && !alterErr.message.includes('duplicate column')) {
              console.log('ℹ️ is_featured column may already exist:', alterErr.message)
            }
            // Add card_number column if it doesn't exist (for existing databases)
            this.db!.run(`ALTER TABLE population_report_cards ADD COLUMN card_number TEXT`, (cardNumErr) => {
              if (cardNumErr && !cardNumErr.message.includes('duplicate column')) {
                console.log('ℹ️ card_number column may already exist:', cardNumErr.message)
              }
              console.log('✅ Population report table ready')
              resolve()
            })
          })
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
          card_id, card_game, card_name, card_grade, grade_name, year_card,
          set_name, edition, rarity, card_number, card_info, card_owner, date_graded,
          front_image, back_image
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `

      this.db.run(sql, [
        card.card_id,
        card.card_game,
        card.card_name,
        card.card_grade,
        card.grade_name || '',
        card.year_card || '',
        card.set_name || '',
        card.edition || '',
        card.rarity,
        card.card_number || '',
        card.card_info || '',
        card.card_owner || 'Nexus TCG Grading',
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

  async getCardByCardId(cardId: string): Promise<PopulationReportCard | null> {
    const sql = 'SELECT * FROM population_report_cards WHERE card_id = ?'
    const results = await this.runQuery(sql, [cardId])
    return results.length > 0 ? results[0] : null
  }

  async getCardById(id: number): Promise<PopulationReportCard | null> {
    const sql = 'SELECT * FROM population_report_cards WHERE id = ?'
    const results = await this.runQuery(sql, [id])
    return results.length > 0 ? results[0] : null
  }

  async getNextCardId(): Promise<string> {
    const sql = 'SELECT card_id FROM population_report_cards ORDER BY id DESC LIMIT 1'
    const results = await this.runQuery(sql)

    if (results.length === 0) {
      // First card
      return '00000001'
    }

    const lastCardId = results[0].card_id
    const lastNumber = parseInt(lastCardId, 10)
    const nextNumber = lastNumber + 1

    // Format to 8 digits with leading zeros
    return nextNumber.toString().padStart(8, '0')
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

  async updateCard(id: number, cardData: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'))
        return
      }

      const sql = `UPDATE population_report_cards SET
        card_id = ?,
        card_game = ?,
        card_name = ?,
        card_grade = ?,
        grade_name = ?,
        year_card = ?,
        set_name = ?,
        edition = ?,
        card_number = ?,
        card_info = ?,
        card_owner = ?,
        rarity = ?,
        front_image = ?,
        back_image = ?,
        updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`

      const params = [
        cardData.card_id,
        cardData.card_game,
        cardData.card_name,
        cardData.card_grade,
        cardData.grade_name || '',
        cardData.year_card || '',
        cardData.set_name,
        cardData.edition || '',
        cardData.card_number || '',
        cardData.card_info || '',
        cardData.card_owner || '',
        cardData.rarity,
        cardData.front_image_path || '',
        cardData.back_image_path || '',
        id
      ]

      this.db.run(sql, params, (err) => {
        if (err) {
          console.error('❌ Error updating card:', err.message)
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  async toggleFeatured(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'))
        return
      }

      // First get current featured status
      this.db.get('SELECT is_featured FROM population_report_cards WHERE id = ?', [id], (err, row: any) => {
        if (err) {
          console.error('❌ Error getting featured status:', err.message)
          reject(err)
          return
        }

        const newFeaturedStatus = row?.is_featured ? 0 : 1

        this.db!.run(
          'UPDATE population_report_cards SET is_featured = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [newFeaturedStatus, id],
          (updateErr) => {
            if (updateErr) {
              console.error('❌ Error toggling featured status:', updateErr.message)
              reject(updateErr)
            } else {
              resolve(newFeaturedStatus === 1)
            }
          }
        )
      })
    })
  }

  async getFeaturedCards(limit: number = 4): Promise<PopulationReportCard[]> {
    const sql = 'SELECT * FROM population_report_cards WHERE is_featured = 1 ORDER BY updated_at DESC LIMIT ?'
    return await this.runQuery(sql, [limit])
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
