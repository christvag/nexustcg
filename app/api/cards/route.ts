import { NextRequest, NextResponse } from 'next/server'
import { searchCards, getAvailableGames, getAvailableSets, getCardCount, getCardVariations } from '@/lib/card-database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const game = searchParams.get('game') || 'All Games'
    const setName = searchParams.get('set') || ''
    const limit = parseInt(searchParams.get('limit') || '15')
    const offset = parseInt(searchParams.get('offset') || '0')
    const action = searchParams.get('action')

    // If requesting available games
    if (action === 'games') {
      const games = await getAvailableGames()
      return NextResponse.json({ games })
    }

    // If requesting available sets for a game
    if (action === 'sets' && game) {
      const sets = await getAvailableSets(game)
      return NextResponse.json({ sets, game })
    }

    // If requesting card variations
    if (action === 'variations') {
      const cardName = searchParams.get('cardName')
      const cardGame = searchParams.get('cardGame')
      
      if (!cardName || !cardGame) {
        return NextResponse.json(
          { error: 'cardName and cardGame parameters are required for variations' },
          { status: 400 }
        )
      }
      
      const variations = await getCardVariations(cardName, cardGame)
      return NextResponse.json({ variations, cardName, cardGame })
    }

    // Search for cards
    console.log('Search API called with:', { query, game, setName, limit, offset })
    
    const cards = await searchCards(query, game, setName, limit, offset)
    const totalCount = await getCardCount(query, game, setName)
    
    console.log('Search results:', { foundCards: cards.length, totalCount })
    
    return NextResponse.json({ 
      cards,
      query,
      game,
      set: setName,
      limit,
      offset,
      count: cards.length,
      totalCount,
      hasMore: offset + limit < totalCount
    })

  } catch (error) {
    console.error('Card search API error:', error)
    return NextResponse.json(
      { error: 'Failed to search cards' },
      { status: 500 }
    )
  }
}