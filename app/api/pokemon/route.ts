import { NextRequest, NextResponse } from 'next/server'
import { 
  searchPokemon, 
  getPokemonCount, 
  getAvailableSets,
  getAvailableRarities,
  getAvailableTypes,
  getRandomPokemon
} from '@/lib/pokemon-database'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')
    
    // Get filters (for featured cards, random selection, etc.)
    if (action === 'featured') {
      const limit = parseInt(searchParams.get('limit') || '10')
      const cards = await getRandomPokemon(limit)
      return NextResponse.json({ success: true, cards })
    }
    
    // Get available sets
    if (action === 'sets') {
      const sets = await getAvailableSets()
      return NextResponse.json({ success: true, sets })
    }
    
    // Get available rarities
    if (action === 'rarities') {
      const rarities = await getAvailableRarities()
      return NextResponse.json({ success: true, rarities })
    }
    
    // Get available types
    if (action === 'types') {
      const types = await getAvailableTypes()
      return NextResponse.json({ success: true, types })
    }
    
    // Regular search
    const query = searchParams.get('q') || ''
    const setName = searchParams.get('set') || undefined
    const rarity = searchParams.get('rarity') || undefined
    const cardType = searchParams.get('type') || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '15')
    const offset = (page - 1) * limit
    
    // Get cards and total count
    const [cards, totalCount] = await Promise.all([
      searchPokemon(query, setName, rarity, cardType, limit, offset),
      getPokemonCount(query, setName, rarity, cardType)
    ])
    
    const totalPages = Math.ceil(totalCount / limit)
    
    return NextResponse.json({
      success: true,
      cards,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore: page < totalPages
      }
    })
  } catch (error) {
    console.error('Pokemon API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch Pokemon cards',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}