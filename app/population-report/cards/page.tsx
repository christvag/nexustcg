'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Award, Calendar, Hash } from 'lucide-react'

interface CardItem {
  id: number
  card_id: string
  card_name: string
  card_game: string
  card_grade: string
  grade_name?: string
  set_name?: string
  rarity?: string
  edition?: string
  year_card?: string
  card_number?: string
  date_graded: string
  front_image?: string
}

function CardsByGradeContent() {
  const searchParams = useSearchParams()
  const cardName = searchParams.get('card_name') || ''
  const cardGame = searchParams.get('card_game') || ''
  const grade = searchParams.get('grade') || ''

  const [cards, setCards] = useState<CardItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!cardName || !cardGame || !grade) {
      setError('Missing required parameters')
      setLoading(false)
      return
    }

    const fetchCards = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `/api/public/population-report/cards-by-grade?card_name=${encodeURIComponent(cardName)}&card_game=${encodeURIComponent(cardGame)}&grade=${encodeURIComponent(grade)}`
        )
        const result = await response.json()

        if (result.success) {
          setCards(result.data.cards)
        } else {
          setError(result.error || 'Failed to load cards')
        }
      } catch {
        setError('Failed to load cards')
      } finally {
        setLoading(false)
      }
    }

    fetchCards()
  }, [cardName, cardGame, grade])

  if (loading) {
    return (
      <div id="cards-by-grade-loading" className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d83f0a] mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading cards...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div id="cards-by-grade-error" className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <Link
              href="/population-report"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#d83f0a] to-[#d66a0a] text-white rounded-lg hover:scale-105 transition-transform"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Population Report
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div id="cards-by-grade-page" className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
      {/* Header */}
      <div id="cards-by-grade-header" className="bg-black/50 border-b border-gray-800 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/population-report"
            className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Population Report
          </Link>
          <div className="flex items-center text-gray-400 text-sm">
            <Award className="h-4 w-4 mr-1 text-[#d83f0a]" />
            <span>{cards.length} card{cards.length !== 1 ? 's' : ''} found</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Title */}
        <motion.div
          id="cards-by-grade-title-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 id="cards-by-grade-title" className="text-3xl font-bold text-white mb-2">
            {cardName}
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-block px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm border border-gray-700">
              {cardGame}
            </span>
            <span className="inline-block px-3 py-1 bg-gradient-to-r from-[#d83f0a] to-[#d66a0a] text-white rounded-full text-sm font-semibold">
              Grade: {grade}
            </span>
          </div>
        </motion.div>

        {/* Cards Table */}
        {cards.length === 0 ? (
          <motion.div
            id="cards-by-grade-empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <p className="text-gray-400 text-lg">No cards found matching these criteria.</p>
          </motion.div>
        ) : (
          <motion.div
            id="cards-by-grade-table-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table id="cards-by-grade-table" className="w-full">
                <thead>
                  <tr id="cards-by-grade-table-header" className="bg-gray-800/80 border-b border-gray-700">
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">
                      Cert #
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">
                      Grade
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">
                      Grade Name
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">
                      Set
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">
                      Rarity
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">
                      Year
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">
                      Date Graded
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {cards.map((card) => (
                    <tr
                      key={card.card_id}
                      id={`cards-by-grade-row-${card.card_id}`}
                      className="hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/cert/${card.card_id}`}
                          className="text-[#d83f0a] hover:text-[#d66a0a] font-mono font-semibold transition-colors"
                        >
                          {card.card_id}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-0.5 bg-gray-800 text-white rounded text-sm font-bold">
                          {card.card_grade}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-sm">
                        {card.grade_name || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-sm">
                        {card.set_name || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-sm">
                        {card.rarity || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-sm">
                        {card.year_card || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm">
                        {card.date_graded ? new Date(card.date_graded).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default function CardsByGradePage() {
  return (
    <Suspense fallback={
      <div id="cards-by-grade-suspense" className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d83f0a] mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <CardsByGradeContent />
    </Suspense>
  )
}
