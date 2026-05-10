import Database from 'better-sqlite3'
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
  private db: Database.Database | null = null
  private schemaReady = false

  /** Lazily open + initialize the connection. Sync under the hood; async signature kept for back-compat. */
  async connect(): Promise<void> {
    if (this.db) return
    try {
      this.db = new Database(DATABASE_PATH)
      this.db.pragma('foreign_keys = ON')
      this.db.pragma('journal_mode = WAL')
      this.initializeSchema()
      console.log('✅ Connected to population report database')
    } catch (err: any) {
      console.error('❌ Error connecting to population report database:', err.message)
      this.db = null
      throw err
    }
  }

  private getDb(): Database.Database {
    if (!this.db) {
      this.db = new Database(DATABASE_PATH)
      this.db.pragma('foreign_keys = ON')
      this.db.pragma('journal_mode = WAL')
      this.initializeSchema()
    }
    return this.db
  }

  private initializeSchema(): void {
    if (this.schemaReady) return
    const db = this.db!

    db.exec(`
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
    `)

    // Idempotent column adds (ignore "duplicate column" errors)
    const addColumn = (sql: string) => {
      try { db.exec(sql) } catch (e: any) {
        if (!String(e.message).includes('duplicate column')) {
          console.log('ℹ️ Column add note:', e.message)
        }
      }
    }
    addColumn('ALTER TABLE population_report_cards ADD COLUMN is_featured INTEGER DEFAULT 0')
    addColumn('ALTER TABLE population_report_cards ADD COLUMN card_number TEXT')
    addColumn('ALTER TABLE population_report_cards ADD COLUMN card_owner TEXT')
    addColumn("ALTER TABLE population_report_cards ADD COLUMN language TEXT DEFAULT 'English'")

    this.schemaReady = true
    console.log('✅ Population report table ready')
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close()
      this.db = null
      this.schemaReady = false
    }
  }

  async runQuery(sql: string, params: any[] = []): Promise<any[]> {
    try {
      const db = this.getDb()
      const stmt = db.prepare(sql)
      const trimmed = sql.trim().toUpperCase()
      // SELECT and PRAGMA return rows; everything else is a write.
      if (trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA') || trimmed.startsWith('WITH')) {
        return stmt.all(...params) as any[]
      }
      const info = stmt.run(...params)
      return [{ changes: info.changes, lastInsertRowid: info.lastInsertRowid }]
    } catch (err: any) {
      console.error('❌ Database query error:', err.message)
      throw err
    }
  }

  async insertCard(card: Omit<PopulationReportCard, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const db = this.getDb()
    const stmt = db.prepare(`
      INSERT INTO population_report_cards (
        card_id, card_game, card_name, card_grade, grade_name, year_card,
        set_name, edition, rarity, card_number, card_info, card_owner, date_graded,
        front_image, back_image
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    // Trim free-text fields so they don't carry trailing/leading whitespace into shareable URLs
    const t = (v: string | null | undefined) => String(v ?? '').trim()
    const info = stmt.run(
      card.card_id,
      card.card_game,
      t(card.card_name),
      card.card_grade,
      t(card.grade_name),
      t(card.year_card),
      t(card.set_name),
      t(card.edition),
      card.rarity,
      t(card.card_number),
      t(card.card_info),
      t(card.card_owner) || 'Nexus TCG Grading',
      card.date_graded,
      card.front_image || '',
      card.back_image || ''
    )
    return Number(info.lastInsertRowid)
  }

  async getAllCards(): Promise<PopulationReportCard[]> {
    const db = this.getDb()
    return db.prepare('SELECT * FROM population_report_cards ORDER BY created_at DESC').all() as PopulationReportCard[]
  }

  async getCardByCardId(cardId: string): Promise<PopulationReportCard | null> {
    const db = this.getDb()
    const row = db.prepare('SELECT * FROM population_report_cards WHERE card_id = ?').get(cardId)
    return (row as PopulationReportCard) || null
  }

  async getCardById(id: number): Promise<PopulationReportCard | null> {
    const db = this.getDb()
    const row = db.prepare('SELECT * FROM population_report_cards WHERE id = ?').get(id)
    return (row as PopulationReportCard) || null
  }

  async getNextCardId(): Promise<string> {
    const db = this.getDb()
    const row = db.prepare('SELECT card_id FROM population_report_cards ORDER BY id DESC LIMIT 1').get() as { card_id: string } | undefined
    if (!row) return '00000001'
    const nextNumber = parseInt(row.card_id, 10) + 1
    return nextNumber.toString().padStart(8, '0')
  }

  async deleteCard(id: number): Promise<void> {
    const db = this.getDb()
    db.prepare('DELETE FROM population_report_cards WHERE id = ?').run(id)
  }

  async updateCard(id: number, cardData: any): Promise<void> {
    const db = this.getDb()
    const stmt = db.prepare(`
      UPDATE population_report_cards SET
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
      WHERE id = ?
    `)
    const t = (v: string | null | undefined) => String(v ?? '').trim()
    stmt.run(
      cardData.card_id,
      cardData.card_game,
      t(cardData.card_name),
      cardData.card_grade,
      t(cardData.grade_name),
      t(cardData.year_card),
      t(cardData.set_name),
      t(cardData.edition),
      t(cardData.card_number),
      t(cardData.card_info),
      t(cardData.card_owner),
      cardData.rarity,
      cardData.front_image_path || '',
      cardData.back_image_path || '',
      id
    )
  }

  async toggleFeatured(id: number): Promise<boolean> {
    const db = this.getDb()
    const row = db.prepare('SELECT is_featured FROM population_report_cards WHERE id = ?').get(id) as { is_featured: number } | undefined
    const newFeaturedStatus = row?.is_featured ? 0 : 1
    db.prepare('UPDATE population_report_cards SET is_featured = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newFeaturedStatus, id)
    return newFeaturedStatus === 1
  }

  async getFeaturedCards(limit: number = 4): Promise<PopulationReportCard[]> {
    const db = this.getDb()
    return db.prepare('SELECT * FROM population_report_cards WHERE is_featured = 1 ORDER BY updated_at DESC LIMIT ?').all(limit) as PopulationReportCard[]
  }

  async getAnalytics(): Promise<AnalyticsData> {
    const cards = await this.getAllCards()
    const totalCards = cards.length

    const lastSubmission = cards.length > 0 ? {
      cardName: cards[0].card_name,
      date: cards[0].date_graded,
      grade: cards[0].card_grade
    } : null

    const gameMap = new Map<string, number>()
    cards.forEach(card => {
      gameMap.set(card.card_game, (gameMap.get(card.card_game) || 0) + 1)
    })
    const byGame = Array.from(gameMap.entries())
      .map(([game, count]) => ({ game, count }))
      .sort((a, b) => b.count - a.count)

    const rarityMap = new Map<string, number>()
    cards.forEach(card => {
      rarityMap.set(card.rarity, (rarityMap.get(card.rarity) || 0) + 1)
    })
    const byRarity = Array.from(rarityMap.entries())
      .map(([rarity, count]) => ({ rarity, count }))
      .sort((a, b) => b.count - a.count)

    const monthMap = new Map<string, number>()
    cards.forEach(card => {
      const date = new Date(card.date_graded)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1)
    })
    const byMonth = Array.from(monthMap.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6)

    return { totalCards, lastSubmission, byGame, byRarity, byMonth }
  }
}

export const populationReportDb = new PopulationReportDatabase()

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
