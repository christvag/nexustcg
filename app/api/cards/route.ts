import { NextRequest, NextResponse } from 'next/server'

// Stub: the previous tcgdex-backed card search was removed.
// Returns an empty payload so the card-selection dropdown fails silently
// instead of throwing 404s. Re-implement against a real cards source when ready.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  if (action === 'games') {
    return NextResponse.json({ games: [] })
  }

  return NextResponse.json({
    cards: [],
    totalCount: 0,
    hasMore: false,
  })
}
