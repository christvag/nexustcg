'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, Award, Package, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface CardDetail {
  id: number
  card_id: string
  card_name: string
  card_game: string
  card_grade: string
  grade_name?: string
  year_card?: string
  set_name: string
  edition?: string
  rarity: string
  card_info?: string
  date_graded: string
  front_image?: string
  back_image?: string
  created_at: string
}

export default function CardDetailPage() {
  const params = useParams()
  const router = useRouter()
  const cardId = params.cardId as string
  const [card, setCard] = useState<CardDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCardDetails()
  }, [cardId])

  const fetchCardDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/public/population-report/card/${cardId}`)
      const result = await response.json()

      if (result.success) {
        setCard(result.data)
      } else {
        setError(result.error || 'Card not found')
      }
    } catch (error) {
      console.error('Error fetching card details:', error)
      setError('Failed to load card details')
    } finally {
      setLoading(false)
    }
  }

  const getGradeColor = (grade: string) => {
    if (grade === '10+') return 'from-pink-400 to-pink-600'
    const gradeNum = parseFloat(grade)
    if (gradeNum >= 10) return 'from-yellow-400 to-yellow-600'
    if (gradeNum >= 9) return 'from-blue-400 to-blue-600'
    if (gradeNum >= 8) return 'from-green-400 to-green-600'
    if (gradeNum >= 7) return 'from-purple-400 to-purple-600'
    return 'from-gray-400 to-gray-600'
  }

  const getGradeName = (grade: string) => {
    if (grade === '10+') return 'PRISTINE'
    const gradeNum = parseFloat(grade)
    if (gradeNum >= 10) return 'GEM MINT'
    if (gradeNum >= 9) return 'MINT'
    if (gradeNum >= 8) return 'NM-MT'
    if (gradeNum >= 7) return 'NM'
    if (gradeNum >= 6) return 'EX/NM'
    if (gradeNum >= 5) return 'EX'
    if (gradeNum >= 4) return 'VG'
    if (gradeNum >= 3) return 'GOOD'
    if (gradeNum >= 2) return 'FAIR'
    return 'POOR'
  }

  if (loading) {
    return (
      <div id="card-detail-loading" className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading card details...</p>
        </div>
      </div>
    )
  }

  if (error || !card) {
    return (
      <div id="card-detail-error" className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-white mb-4">Card Not Found</h1>
          <p className="text-gray-400 mb-6">{error || 'The card you are looking for does not exist.'}</p>
          <Link
            href="/#population-report-section"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:scale-105 transition-transform"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Population Report
          </Link>
        </div>
      </div>
    )
  }

  const gradedDate = new Date(card.date_graded)

  return (
    <div id="card-detail-page" className="min-h-screen bg-gray-950">
      {/* Header */}
      <div id="card-detail-header" className="bg-black/50 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link
            href="/#population-report-section"
            className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Population Report
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left Column - Card Images */}
          <div id="card-images-section">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Card ID Badge */}
              <div id="card-id-badge" className="mb-4">
                <span className="inline-block px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full text-sm font-bold">
                  Card ID: {card.card_id}
                </span>
              </div>

              {/* Front Image */}
              <div id="card-front-image-container" className="bg-gray-900 rounded-2xl p-8 mb-6 border-2 border-gray-800 w-fit mx-auto">
                <div className="aspect-[2.5/3.5] bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl flex items-center justify-center overflow-hidden">
                  {card.front_image ? (
                    <img
                      id="card-front-image"
                      src={card.front_image.startsWith('/') ? `/api/storage${card.front_image}` : `/api/storage/${card.front_image}`}
                      alt={`${card.card_name} - Front`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div id="card-front-placeholder" className="text-center text-gray-500">
                      <div className="text-8xl mb-4">🎴</div>
                      <p>Front Image Not Available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Back Image */}
              {card.back_image && (
                <div id="card-back-image-container" className="bg-gray-900 rounded-2xl p-8 border-2 border-gray-800 w-fit mx-auto">
                  <h3 className="text-lg font-bold text-white mb-4">Back Side</h3>
                  <div className="aspect-[2.5/3.5] bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl flex items-center justify-center overflow-hidden">
                    <img
                      id="card-back-image"
                      src={card.back_image.startsWith('/') ? `/api/storage${card.back_image}` : `/api/storage/${card.back_image}`}
                      alt={`${card.card_name} - Back`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column - Card Details */}
          <div id="card-details-section">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              {/* Card Name */}
              <div id="card-name-section">
                <h1 className="text-4xl font-bold text-white mb-2">{card.card_name}</h1>
                <p className="text-xl text-gray-400">{card.card_game}</p>
              </div>

              {/* Grade Display */}
              <div id="card-grade-display" className="bg-gray-900 rounded-2xl p-8 border-2 border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Award className="h-6 w-6 text-yellow-400 mr-2" />
                    <h2 className="text-xl font-bold text-white">Grade</h2>
                  </div>
                </div>
                <div className={`text-6xl font-bold bg-gradient-to-r ${getGradeColor(card.card_grade)} bg-clip-text text-transparent mb-2`}>
                  {card.card_grade}
                </div>
                <p className="text-lg text-gray-400">{card.grade_name || getGradeName(card.card_grade)}</p>
              </div>

              {/* Card Information */}
              <div id="card-info-grid" className="bg-gray-900 rounded-2xl p-8 border-2 border-gray-800 space-y-4">
                <h2 className="text-xl font-bold text-white mb-4">Card Information</h2>

                <div id="card-set-info" className="flex items-start">
                  <Package className="h-5 w-5 text-blue-400 mr-3 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Set</p>
                    <p className="text-white font-medium">{card.set_name}</p>
                  </div>
                </div>

                {card.year_card && (
                  <div id="card-year-info" className="flex items-start">
                    <Calendar className="h-5 w-5 text-purple-400 mr-3 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Year</p>
                      <p className="text-white font-medium">{card.year_card}</p>
                    </div>
                  </div>
                )}

                <div id="card-rarity-info" className="flex items-start">
                  <Sparkles className="h-5 w-5 text-yellow-400 mr-3 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Rarity</p>
                    <p className="text-white font-medium">{card.rarity}</p>
                  </div>
                </div>

                {card.edition && (
                  <div id="card-edition-info" className="flex items-start">
                    <div className="h-5 w-5 text-green-400 mr-3 mt-1 flex items-center justify-center font-bold">
                      E
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Edition</p>
                      <p className="text-white font-medium">{card.edition}</p>
                    </div>
                  </div>
                )}

                <div id="card-graded-date-info" className="flex items-start">
                  <Calendar className="h-5 w-5 text-blue-400 mr-3 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Date Graded</p>
                    <p className="text-white font-medium">
                      {gradedDate.toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              {card.card_info && (
                <div id="card-additional-info" className="bg-gray-900 rounded-2xl p-8 border-2 border-gray-800">
                  <h2 className="text-xl font-bold text-white mb-4">Additional Information</h2>
                  <p className="text-gray-300 leading-relaxed">{card.card_info}</p>
                </div>
              )}

              {/* Certification Info */}
              <div id="card-certification-info" className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-6 border-2 border-blue-500/30">
                <p className="text-sm text-gray-400 text-center">
                  This card has been professionally graded and authenticated by our expert team.
                  The card is sealed in a tamper-proof protective slab.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
