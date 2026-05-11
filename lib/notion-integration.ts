import { Client } from '@notionhq/client'
import Database from 'better-sqlite3'
import path from 'path'

function getDb() {
  const dbPath = path.join(process.cwd(), 'database', 'user-management.db')
  return new Database(dbPath, { readonly: true })
}

interface NotionConfig {
  auth: string
  databaseId: string
}

interface CardPopularityData {
  id: number
  card_name: string
  card_game: string
  search_count: number
  order_count: number
  last_searched: string
  created_at: string
}

export class NotionIntegration {
  private notion: Client
  private databaseId: string

  constructor(config: NotionConfig) {
    this.notion = new Client({
      auth: config.auth,
    })
    this.databaseId = config.databaseId
  }

  async createNotionDatabase() {
    try {
      const database = await this.notion.databases.create({
        parent: {
          type: 'page_id',
          page_id: process.env.NOTION_PARENT_PAGE_ID!,
        },
        title: [
          {
            type: 'text',
            text: {
              content: 'NEXUS TCGrading - Card Population Report',
            },
          },
        ],
        properties: {
          'Card Name': {
            title: {},
          },
          'Set Name': {
            rich_text: {},
          },
          'Card Number': {
            rich_text: {},
          },
          'Game/Sport': {
            select: {
              options: [
                { name: 'Pokémon', color: 'red' },
                { name: 'Yu-Gi-Oh!', color: 'blue' },
                { name: 'Magic: The Gathering', color: 'green' },
                { name: 'Sports Cards', color: 'purple' },
                { name: 'One Piece', color: 'orange' },
                { name: 'Dragon Ball', color: 'yellow' },
                { name: 'Other TCG', color: 'gray' },
              ],
            },
          },
          'Rarity': {
            select: {
              options: [
                { name: 'Common', color: 'gray' },
                { name: 'Uncommon', color: 'blue' },
                { name: 'Rare', color: 'green' },
                { name: 'Rare Holo', color: 'yellow' },
                { name: 'Ultra Rare', color: 'orange' },
                { name: 'Secret Rare', color: 'red' },
                { name: 'Promo', color: 'purple' },
              ],
            },
          },
          'Total Graded': {
            number: {
              format: 'number',
            },
          },
          'Grade 10': {
            number: {
              format: 'number',
            },
          },
          'Grade 9.5': {
            number: {
              format: 'number',
            },
          },
          'Grade 9': {
            number: {
              format: 'number',
            },
          },
          'Grade 8.5': {
            number: {
              format: 'number',
            },
          },
          'Grade 8': {
            number: {
              format: 'number',
            },
          },
          'Grade 7.5': {
            number: {
              format: 'number',
            },
          },
          'Grade 7': {
            number: {
              format: 'number',
            },
          },
          'Grade 6': {
            number: {
              format: 'number',
            },
          },
          'Grade 5': {
            number: {
              format: 'number',
            },
          },
          'Grade 4': {
            number: {
              format: 'number',
            },
          },
          'Grade 3': {
            number: {
              format: 'number',
            },
          },
          'Grade 2': {
            number: {
              format: 'number',
            },
          },
          'Grade 1': {
            number: {
              format: 'number',
            },
          },
          'Population %': {
            formula: {
              expression: 'if(prop("Total Graded") > 0, round((prop("Grade 10") / prop("Total Graded")) * 100, 2), 0)',
            },
          },
          'Rarity Index': {
            formula: {
              expression: 'if(prop("Total Graded") > 0, round(1000 / prop("Total Graded"), 2), 1000)',
            },
          },
          'Last Updated': {
            date: {},
          },
          'Report Status': {
            select: {
              options: [
                { name: 'Active', color: 'green' },
                { name: 'New Release', color: 'blue' },
                { name: 'High Demand', color: 'red' },
                { name: 'Stable', color: 'yellow' },
                { name: 'Low Volume', color: 'gray' },
              ],
            },
          },
          'Image URL': {
            url: {},
          },
          'Notes': {
            rich_text: {},
          },
        },
      })

      console.log('✅ Professional Population Report database created:', database.id)
      return database.id
    } catch (error) {
      console.error('❌ Error creating Notion database:', error)
      throw error
    }
  }

  async syncCardPopularityData(): Promise<{ synced: number; errors: number }> {
    const db = getDb()
    try {
      // Generate comprehensive population report data from order items
      const populationData = db.prepare(`
        SELECT
          card_name,
          card_game,
          card_rarity,
          card_number,
          card_type AS card_set,
          card_image_url AS image_url,
          COUNT(*) as total_graded,
          COUNT(CASE WHEN grade = '10' THEN 1 END) as grade_10,
          COUNT(CASE WHEN grade = '9.5' THEN 1 END) as grade_9_5,
          COUNT(CASE WHEN grade = '9' THEN 1 END) as grade_9,
          COUNT(CASE WHEN grade = '8.5' THEN 1 END) as grade_8_5,
          COUNT(CASE WHEN grade = '8' THEN 1 END) as grade_8,
          COUNT(CASE WHEN grade = '7.5' THEN 1 END) as grade_7_5,
          COUNT(CASE WHEN grade = '7' THEN 1 END) as grade_7,
          COUNT(CASE WHEN grade = '6' THEN 1 END) as grade_6,
          COUNT(CASE WHEN grade = '5' THEN 1 END) as grade_5,
          COUNT(CASE WHEN grade = '4' THEN 1 END) as grade_4,
          COUNT(CASE WHEN grade = '3' THEN 1 END) as grade_3,
          COUNT(CASE WHEN grade = '2' THEN 1 END) as grade_2,
          COUNT(CASE WHEN grade = '1' THEN 1 END) as grade_1,
          MAX(created_at) as last_updated
        FROM order_items
        WHERE grade IS NOT NULL AND grade <> ''
        GROUP BY card_name, card_game, card_rarity, card_number, card_type
        HAVING COUNT(*) > 0
        ORDER BY total_graded DESC
      `).all() as any[]

      db.close()

      let synced = 0
      let errors = 0

      // Clear existing data 
      await this.clearNotionDatabase()

      // Sync each card population report
      for (const card of populationData) {
        try {
          await this.createPopulationReportPage(card)
          synced++
        } catch (error) {
          console.error(`❌ Error syncing card ${card.card_name}:`, error)
          errors++
        }
      }

      console.log(`✅ Population Report sync completed: ${synced} cards synced, ${errors} errors`)
      return { synced, errors }
    } catch (error) {
      console.error('❌ Error syncing to Notion:', error)
      try { db.close() } catch {}
      throw error
    }
  }

  private async clearNotionDatabase() {
    try {
      const response = await this.notion.databases.query({
        database_id: this.databaseId,
      })

      // Delete existing pages
      for (const page of response.results) {
        await this.notion.pages.update({
          page_id: page.id,
          archived: true,
        })
      }
    } catch (error) {
      console.warn('Warning: Could not clear existing Notion data:', error)
    }
  }

  private async createPopulationReportPage(card: any) {
    // Determine status based on population
    let status = 'Low Volume'
    if (card.total_graded >= 100) status = 'High Demand'
    else if (card.total_graded >= 50) status = 'Active'
    else if (card.total_graded >= 20) status = 'Stable'
    
    // Check for new releases (cards graded in last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    if (card.last_updated > thirtyDaysAgo && card.total_graded <= 10) {
      status = 'New Release'
    }

    const properties: any = {
      'Card Name': {
        title: [
          {
            text: {
              content: card.card_name || 'Unknown Card',
            },
          },
        ],
      },
      'Game/Sport': {
        select: {
          name: this.normalizeGameName(card.card_game),
        },
      },
      'Total Graded': {
        number: card.total_graded,
      },
      'Grade 10': {
        number: card.grade_10 || 0,
      },
      'Grade 9.5': {
        number: card.grade_9_5 || 0,
      },
      'Grade 9': {
        number: card.grade_9 || 0,
      },
      'Grade 8.5': {
        number: card.grade_8_5 || 0,
      },
      'Grade 8': {
        number: card.grade_8 || 0,
      },
      'Grade 7.5': {
        number: card.grade_7_5 || 0,
      },
      'Grade 7': {
        number: card.grade_7 || 0,
      },
      'Grade 6': {
        number: card.grade_6 || 0,
      },
      'Grade 5': {
        number: card.grade_5 || 0,
      },
      'Grade 4': {
        number: card.grade_4 || 0,
      },
      'Grade 3': {
        number: card.grade_3 || 0,
      },
      'Grade 2': {
        number: card.grade_2 || 0,
      },
      'Grade 1': {
        number: card.grade_1 || 0,
      },
      'Last Updated': {
        date: {
          start: new Date(card.last_updated).toISOString().split('T')[0],
        },
      },
      'Report Status': {
        select: {
          name: status,
        },
      },
    }

    // Add optional properties if they exist
    if (card.card_set) {
      properties['Set Name'] = {
        rich_text: [
          {
            text: {
              content: card.card_set,
            },
          },
        ],
      }
    }

    if (card.card_number) {
      properties['Card Number'] = {
        rich_text: [
          {
            text: {
              content: card.card_number,
            },
          },
        ],
      }
    }

    if (card.card_rarity) {
      properties['Rarity'] = {
        select: {
          name: this.normalizeRarity(card.card_rarity),
        },
      }
    }

    if (card.image_url) {
      properties['Image URL'] = {
        url: card.image_url,
      }
    }

    await this.notion.pages.create({
      parent: {
        database_id: this.databaseId,
      },
      properties,
    })
  }

  private normalizeGameName(game: string): string {
    if (!game) return 'Other TCG'
    
    const gameMap: { [key: string]: string } = {
      'pokemon': 'Pokémon',
      'yu-gi-oh': 'Yu-Gi-Oh!',
      'yugioh': 'Yu-Gi-Oh!',
      'mtg': 'Magic: The Gathering',
      'magic': 'Magic: The Gathering',
      'onepiece': 'One Piece',
      'one-piece': 'One Piece',
      'dragonball': 'Dragon Ball',
      'dragon-ball': 'Dragon Ball'
    }
    
    return gameMap[game.toLowerCase()] || game
  }

  private normalizeRarity(rarity: string): string {
    if (!rarity) return 'Common'
    
    const rarityMap: { [key: string]: string } = {
      'common': 'Common',
      'uncommon': 'Uncommon',
      'rare': 'Rare',
      'rare holo': 'Rare Holo',
      'ultra rare': 'Ultra Rare',
      'secret rare': 'Secret Rare',
      'promo': 'Promo'
    }
    
    return rarityMap[rarity.toLowerCase()] || rarity
  }

  async updateCardData(_cardName: string, _game: string, _type: 'search' | 'order') {
    // The legacy card_popularity table was removed with database/tcgrading.db.
    // Search/order tracking is no longer persisted. Kept as a no-op so existing
    // call sites don't error; remove this method once nothing imports it.
    return true
  }

  async getPopularityReport(): Promise<any[]> {
    const db = getDb()
    try {
      // Population report data derived from graded order items.
      const report = db.prepare(`
        SELECT
          card_name,
          card_game,
          card_rarity,
          card_number,
          card_type AS card_set,
          card_image_url AS image_url,
          COUNT(*) as total_graded,
          COUNT(CASE WHEN grade = '10' THEN 1 END) as grade_10,
          COUNT(CASE WHEN grade = '9.5' THEN 1 END) as grade_9_5,
          COUNT(CASE WHEN grade = '9' THEN 1 END) as grade_9,
          COUNT(CASE WHEN grade = '8.5' THEN 1 END) as grade_8_5,
          COUNT(CASE WHEN grade = '8' THEN 1 END) as grade_8,
          COUNT(CASE WHEN grade = '7.5' THEN 1 END) as grade_7_5,
          COUNT(CASE WHEN grade = '7' THEN 1 END) as grade_7,
          COUNT(CASE WHEN grade = '6' THEN 1 END) as grade_6,
          COUNT(CASE WHEN grade = '5' THEN 1 END) as grade_5,
          COUNT(CASE WHEN grade = '4' THEN 1 END) as grade_4,
          COUNT(CASE WHEN grade = '3' THEN 1 END) as grade_3,
          COUNT(CASE WHEN grade = '2' THEN 1 END) as grade_2,
          COUNT(CASE WHEN grade = '1' THEN 1 END) as grade_1,
          ROUND((CAST(COUNT(CASE WHEN grade = '10' THEN 1 END) AS FLOAT) / CAST(COUNT(*) AS FLOAT)) * 100, 2) as grade_10_percentage,
          MAX(created_at) as last_updated
        FROM order_items
        WHERE grade IS NOT NULL AND grade <> ''
        GROUP BY card_name, card_game, card_rarity, card_number, card_type
        HAVING COUNT(*) > 0
        ORDER BY total_graded DESC
        LIMIT 50
      `).all()

      db.close()
      return report
    } catch (error) {
      console.error('❌ Error generating population report:', error)
      try { db.close() } catch {}
      throw error
    }
  }
}

// Utility function to get configured Notion client
export function getNotionIntegration(): NotionIntegration | null {
  const auth = process.env.NOTION_SECRET_KEY
  const databaseId = process.env.NOTION_DATABASE_ID

  if (!auth || !databaseId) {
    console.warn('⚠️ Notion integration not configured. Missing environment variables.')
    return null
  }

  return new NotionIntegration({ auth, databaseId })
}