import sqlite3 from 'sqlite3'
import path from 'path'

const DATABASE_PATH = path.join(process.cwd(), 'database', 'graded-cards.db')

interface CardGame {
  id?: number
  game_name: string
  logo_path?: string
  is_active?: number
  display_order?: number
  created_at?: string
  updated_at?: string
}

class CardGamesDatabase {
  private db: sqlite3.Database | null = null

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DATABASE_PATH, (err) => {
        if (err) {
          console.error('❌ Error connecting to card games database:', err.message)
          reject(err)
        } else {
          console.log('✅ Connected to card games database')
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

  async getAllGames(): Promise<CardGame[]> {
    const sql = 'SELECT * FROM card_games ORDER BY display_order ASC, game_name ASC'
    return await this.runQuery(sql)
  }

  async getActiveGames(): Promise<CardGame[]> {
    const sql = 'SELECT * FROM card_games WHERE is_active = 1 ORDER BY display_order ASC, game_name ASC'
    return await this.runQuery(sql)
  }

  async getGameByName(gameName: string): Promise<CardGame | null> {
    const sql = 'SELECT * FROM card_games WHERE game_name = ?'
    const results = await this.runQuery(sql, [gameName])
    return results.length > 0 ? results[0] : null
  }

  async addGame(game: Omit<CardGame, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'))
        return
      }

      const sql = `
        INSERT INTO card_games (game_name, logo_path, is_active, display_order)
        VALUES (?, ?, ?, ?)
      `

      this.db.run(sql, [
        game.game_name,
        game.logo_path || null,
        game.is_active ?? 1,
        game.display_order ?? 0
      ], function(err) {
        if (err) {
          console.error('❌ Error adding game:', err.message)
          reject(err)
        } else {
          resolve(this.lastID)
        }
      })
    })
  }

  async updateGame(gameName: string, updates: Partial<CardGame>): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'))
        return
      }

      const fields: string[] = []
      const values: any[] = []

      if (updates.logo_path !== undefined) {
        fields.push('logo_path = ?')
        values.push(updates.logo_path)
      }
      if (updates.is_active !== undefined) {
        fields.push('is_active = ?')
        values.push(updates.is_active)
      }
      if (updates.display_order !== undefined) {
        fields.push('display_order = ?')
        values.push(updates.display_order)
      }

      if (fields.length === 0) {
        resolve()
        return
      }

      values.push(gameName)
      const sql = `UPDATE card_games SET ${fields.join(', ')} WHERE game_name = ?`

      this.db.run(sql, values, (err) => {
        if (err) {
          console.error('❌ Error updating game:', err.message)
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  async deleteGame(gameName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'))
        return
      }

      const sql = 'DELETE FROM card_games WHERE game_name = ?'
      this.db.run(sql, [gameName], (err) => {
        if (err) {
          console.error('❌ Error deleting game:', err.message)
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }
}

// Export singleton instance
export const cardGamesDb = new CardGamesDatabase()

// Helper function to initialize database
export async function initializeCardGamesDatabase() {
  try {
    await cardGamesDb.connect()
    console.log('✅ Card games database ready')
    return true
  } catch (error) {
    console.error('❌ Failed to initialize card games database:', error)
    return false
  }
}

export type { CardGame }
