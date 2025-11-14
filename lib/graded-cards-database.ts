import sqlite3 from 'sqlite3'
import path from 'path'

const DATABASE_PATH = path.join(process.cwd(), 'database', 'graded-cards.db')

interface GradedCard {
  id?: number
  card_id: string
  card_type: string
  card_name: string
  grade: number
  grade_name: string
  year_card?: string
  set_name?: string
  edition?: string
  card_info?: string
  author?: string
  rarity?: string
  owner?: string
  front_image_path?: string
  back_image_path?: string
  date_grade: string
  created_at?: string
  updated_at?: string
}

interface PopulationStats {
  card_type: string
  card_name: string
  set_name?: string
  year_card?: string
  total_graded: number
  average_grade: number
  highest_grade: number
  lowest_grade: number
  pristine_count: number
  mint_plus_count: number
}

class GradedCardsDatabase {
  private db: sqlite3.Database | null = null

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DATABASE_PATH, (err) => {
        if (err) {
          console.error('❌ Error connecting to graded cards database:', err.message)
          reject(err)
        } else {
          console.log('✅ Connected to graded cards database')
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

  async runQuerySingle(sql: string, params: any[] = []): Promise<any> {
    const results = await this.runQuery(sql, params)
    return results.length > 0 ? results[0] : null
  }

  async insertGradedCard(card: Omit<GradedCard, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'))
        return
      }

      const sql = `
        INSERT INTO graded_cards (
          card_id, card_type, card_name, grade, grade_name, 
          year_card, set_name, edition, card_info, author, rarity, owner, 
          front_image_path, back_image_path, date_grade
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `

      this.db.run(sql, [
        card.card_id,
        card.card_type,
        card.card_name,
        card.grade,
        card.grade_name,
        card.year_card,
        card.set_name,
        card.edition,
        card.card_info,
        card.author,
        card.rarity,
        card.owner,
        card.front_image_path,
        card.back_image_path,
        card.date_grade
      ], function(err) {
        if (err) {
          console.error('❌ Error inserting graded card:', err.message)
          reject(err)
        } else {
          resolve(this.lastID)
        }
      })
    })
  }

  async getAllGradedCards(filters?: {
    card_type?: string
    year?: string
    set_name?: string
    limit?: number
    offset?: number
  }): Promise<GradedCard[]> {
    let sql = 'SELECT * FROM graded_cards WHERE 1=1'
    const params: any[] = []

    if (filters?.card_type) {
      sql += ' AND card_type = ?'
      params.push(filters.card_type)
    }

    if (filters?.year) {
      sql += ' AND year_card = ?'
      params.push(filters.year)
    }

    if (filters?.set_name) {
      sql += ' AND set_name = ?'
      params.push(filters.set_name)
    }

    sql += ' ORDER BY created_at DESC'

    if (filters?.limit) {
      sql += ' LIMIT ?'
      params.push(filters.limit)
      
      if (filters?.offset) {
        sql += ' OFFSET ?'
        params.push(filters.offset)
      }
    }

    return await this.runQuery(sql, params)
  }

  async getPopulationStats(filters?: {
    card_type?: string
    year?: string
    set_name?: string
  }): Promise<PopulationStats[]> {
    let sql = 'SELECT * FROM population_stats WHERE 1=1'
    const params: any[] = []

    if (filters?.card_type) {
      sql += ' AND card_type = ?'
      params.push(filters.card_type)
    }

    if (filters?.year) {
      sql += ' AND year_card = ?'
      params.push(filters.year)
    }

    if (filters?.set_name) {
      sql += ' AND set_name = ?'
      params.push(filters.set_name)
    }

    sql += ' ORDER BY total_graded DESC, average_grade DESC'

    return await this.runQuery(sql, params)
  }

  async getCardDetails(cardName: string, filters?: {
    card_type?: string
    year?: string
    set_name?: string
  }): Promise<{
    summary: any
    gradeDistribution: any[]
    individualCards: GradedCard[]
  }> {
    let whereClause = 'WHERE card_name = ?'
    let params = [cardName]

    if (filters?.card_type) {
      whereClause += ' AND card_type = ?'
      params.push(filters.card_type)
    }

    if (filters?.year) {
      whereClause += ' AND year_card = ?'
      params.push(filters.year)
    }

    if (filters?.set_name) {
      whereClause += ' AND set_name = ?'
      params.push(filters.set_name)
    }

    // Get individual cards
    const individualCards = await this.runQuery(`
      SELECT * FROM graded_cards 
      ${whereClause}
      ORDER BY grade DESC, created_at DESC
    `, params)

    // Get grade distribution
    const gradeDistribution = await this.runQuery(`
      SELECT 
        grade,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM graded_cards ${whereClause})), 1) as percentage
      FROM graded_cards 
      ${whereClause}
      GROUP BY grade
      ORDER BY grade DESC
    `, [...params, ...params])

    // Calculate summary stats
    const totalGraded = individualCards.length
    const grades = individualCards.map(card => card.grade)
    const avgGrade = grades.length > 0 ? grades.reduce((a, b) => a + b, 0) / grades.length : 0
    const highestGrade = Math.max(...grades, 0)
    const lowestGrade = grades.length > 0 ? Math.min(...grades) : 0

    return {
      summary: {
        totalGraded,
        avgGrade: parseFloat(avgGrade.toFixed(2)),
        highestGrade,
        lowestGrade
      },
      gradeDistribution,
      individualCards
    }
  }

  async getUniqueValues(column: string): Promise<string[]> {
    const results = await this.runQuery(`
      SELECT DISTINCT ${column} as value 
      FROM graded_cards 
      WHERE ${column} IS NOT NULL AND ${column} != ''
      ORDER BY value
    `)
    return results.map(row => row.value)
  }
}

// Export singleton instance
export const gradedCardsDb = new GradedCardsDatabase()

// Helper function to initialize database connection
export async function initializeGradedCardsDatabase() {
  try {
    await gradedCardsDb.connect()
    console.log('✅ Graded cards database ready')
    return true
  } catch (error) {
    console.error('❌ Failed to initialize graded cards database:', error)
    return false
  }
}

// Helper functions
export async function addGradedCard(card: Omit<GradedCard, 'id' | 'created_at' | 'updated_at'>) {
  return await gradedCardsDb.insertGradedCard(card)
}

export async function getGradedCards(filters?: {
  card_type?: string
  year?: string
  set_name?: string
  limit?: number
  offset?: number
}) {
  return await gradedCardsDb.getAllGradedCards(filters)
}

export async function getPopulationReport(filters?: {
  card_type?: string
  year?: string
  set_name?: string
}) {
  return await gradedCardsDb.getPopulationStats(filters)
}

export async function getCardPopulationDetails(cardName: string, filters?: {
  card_type?: string
  year?: string
  set_name?: string
}) {
  return await gradedCardsDb.getCardDetails(cardName, filters)
}

export async function getUniqueCardTypes() {
  return await gradedCardsDb.getUniqueValues('card_type')
}

export async function getUniqueYears() {
  return await gradedCardsDb.getUniqueValues('year_card')
}

export async function getUniqueSetNames() {
  return await gradedCardsDb.getUniqueValues('set_name')
}

export type { GradedCard, PopulationStats }