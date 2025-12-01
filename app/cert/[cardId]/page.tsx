'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckCircle, Calendar, Hash, Award, Star, Package, Info } from 'lucide-react'

interface CardData {
  id: number
  card_id: string
  card_game: string
  card_name: string
  card_grade: string
  grade_name?: string
  year_card?: string
  set_name: string
  edition?: string
  rarity: string
  card_number?: string
  card_info?: string
  language?: string
  date_graded: string
  front_image?: string
  back_image?: string
  created_at: string
  updated_at: string
}

export default function CardCertificationPage() {
  const params = useParams()
  const cardId = params?.cardId as string

  const [card, setCard] = useState<CardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [magnifierPos, setMagnifierPos] = useState({ x: 0, y: 0, imgX: 0, imgY: 0 })
  const [showMagnifier, setShowMagnifier] = useState(false)
  const [activeImage, setActiveImage] = useState<'front' | 'back' | null>(null)
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (cardId) {
      fetchCardData()
    }
  }, [cardId])

  const fetchCardData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/cert/${cardId}`)
      const data = await response.json()

      if (data.success) {
        setCard(data.card)
      } else {
        setError(data.error || 'Card not found')
      }
    } catch (err) {
      console.error('Error fetching card:', err)
      setError('Failed to load card data')
    } finally {
      setLoading(false)
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, imageType: 'front' | 'back') => {
    const elem = e.currentTarget
    const img = elem.querySelector('img') as HTMLImageElement
    if (!img) return

    const imgRect = img.getBoundingClientRect()

    // Get natural image dimensions
    const naturalWidth = img.naturalWidth
    const naturalHeight = img.naturalHeight

    // Calculate mouse position relative to container
    const containerRect = elem.getBoundingClientRect()
    const x = e.clientX - containerRect.left
    const y = e.clientY - containerRect.top

    // Calculate mouse position relative to the actual image (accounting for object-contain)
    const imgX = e.clientX - imgRect.left
    const imgY = e.clientY - imgRect.top

    // Check if mouse is within the image bounds
    if (imgX >= 0 && imgX <= imgRect.width && imgY >= 0 && imgY <= imgRect.height) {
      // Calculate percentage position on the image
      const percentX = imgX / imgRect.width
      const percentY = imgY / imgRect.height

      setMagnifierPos({
        x,
        y,
        imgX: percentX * naturalWidth,
        imgY: percentY * naturalHeight
      })
      setImgDimensions({ width: naturalWidth, height: naturalHeight })
      setActiveImage(imageType)
      setShowMagnifier(true)
    } else {
      setShowMagnifier(false)
    }
  }

  const handleMouseEnter = () => {
    // Magnifier will be shown in handleMouseMove when over image
  }

  const handleMouseLeave = () => {
    setShowMagnifier(false)
    setActiveImage(null)
  }

  if (loading) {
    return (
      <div id="cert-loading" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#d83f0a] mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading certification...</p>
        </div>
      </div>
    )
  }

  if (error || !card) {
    return (
      <div id="cert-error" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center max-w-md">
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Card Not Found</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#d83f0a] to-[#d66a0a] text-white rounded-lg hover:scale-105 transition-transform"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div id="cert-page" className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
      {/* Header */}
      <header id="cert-header" className="bg-black/50 border-b border-gray-800 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex flex-col items-start">
              <img
                src="/api/storage/nexustcg_textandlogo_white.png"
                alt="Nexus TCGrading"
                className="h-10 mb-1"
                id="cert-header-logo"
              />
              <span className="text-xs text-gray-400">Official Grading Service</span>
            </Link>
            <div className="flex items-center space-x-2 text-green-400">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">Certified Authentic</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Certification Badge */}
        <motion.div
          id="cert-badge"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#d83f0a]/20 to-[#d66a0a]/20 border border-[#d83f0a]/50 rounded-lg p-4 mb-8"
        >
          <div className="flex items-center justify-center space-x-3">
            <Award className="h-8 w-8 text-[#d83f0a]" />
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white">Certification Number</h1>
              <p className="text-3xl font-bold text-gradient">{card.card_id}</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Card Images */}
          <motion.div
            id="cert-images"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-6">
              <h2 className="text-xl font-bold text-white mb-4">Card Images</h2>

              {/* Front Image */}
              <div id="cert-front-image-section">
                <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">Front</h3>
                <div
                  className="relative bg-gray-800 rounded-lg overflow-hidden aspect-[2.5/3.5] flex items-center justify-center border-2 border-gray-700 hover:border-[#d83f0a] transition-colors"
                  onMouseMove={(e) => handleMouseMove(e, 'front')}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  {card.front_image ? (
                    <>
                      <img
                        id="cert-front-image"
                        src={card.front_image.startsWith('/') ? `/api/storage${card.front_image}` : `/api/storage/${card.front_image}`}
                        alt={`${card.card_name} - Front`}
                        className="w-full h-full object-contain"
                      />
                      {showMagnifier && activeImage === 'front' && imgDimensions.width > 0 && (
                        <div
                          id="cert-front-magnifier"
                          className="absolute pointer-events-none border-4 border-[#d83f0a] rounded-full shadow-2xl overflow-hidden z-50"
                          style={{
                            width: '250px',
                            height: '250px',
                            left: `${magnifierPos.x - 125}px`,
                            top: `${magnifierPos.y - 125}px`,
                            backgroundColor: 'rgba(0, 0, 0, 0.1)'
                          }}
                        >
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              backgroundImage: `url(${card.front_image.startsWith('/') ? `/api/storage${card.front_image}` : `/api/storage/${card.front_image}`})`,
                              backgroundSize: `${imgDimensions.width * 2}px ${imgDimensions.height * 2}px`,
                              backgroundPosition: `-${magnifierPos.imgX * 2 - 125}px -${magnifierPos.imgY * 2 - 125}px`,
                              backgroundRepeat: 'no-repeat'
                            }}
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center p-8">
                      <Package className="h-16 w-16 text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No front image available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Back Image */}
              <div id="cert-back-image-section">
                <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">Back</h3>
                <div
                  className="relative bg-gray-800 rounded-lg overflow-hidden aspect-[2.5/3.5] flex items-center justify-center border-2 border-gray-700 hover:border-[#d83f0a] transition-colors"
                  onMouseMove={(e) => handleMouseMove(e, 'back')}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  {card.back_image ? (
                    <>
                      <img
                        id="cert-back-image"
                        src={card.back_image.startsWith('/') ? `/api/storage${card.back_image}` : `/api/storage/${card.back_image}`}
                        alt={`${card.card_name} - Back`}
                        className="w-full h-full object-contain"
                      />
                      {showMagnifier && activeImage === 'back' && imgDimensions.width > 0 && (
                        <div
                          id="cert-back-magnifier"
                          className="absolute pointer-events-none border-4 border-[#d83f0a] rounded-full shadow-2xl overflow-hidden z-50"
                          style={{
                            width: '250px',
                            height: '250px',
                            left: `${magnifierPos.x - 125}px`,
                            top: `${magnifierPos.y - 125}px`,
                            backgroundColor: 'rgba(0, 0, 0, 0.1)'
                          }}
                        >
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              backgroundImage: `url(${card.back_image.startsWith('/') ? `/api/storage${card.back_image}` : `/api/storage/${card.back_image}`})`,
                              backgroundSize: `${imgDimensions.width * 2}px ${imgDimensions.height * 2}px`,
                              backgroundPosition: `-${magnifierPos.imgX * 2 - 125}px -${magnifierPos.imgY * 2 - 125}px`,
                              backgroundRepeat: 'no-repeat'
                            }}
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center p-8">
                      <Package className="h-16 w-16 text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No back image available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Card Details */}
          <motion.div
            id="cert-details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Grade */}
            <div id="cert-grade-box" className="bg-gradient-to-br from-[#d83f0a] to-[#d66a0a] rounded-xl p-8 text-center">
              <h2 className="text-white text-lg font-semibold mb-2">GRADE</h2>
              <div className="text-6xl font-bold text-white mb-2">{card.card_grade}</div>
              {card.grade_name && (
                <p className="text-white/90 text-xl font-medium">{card.grade_name}</p>
              )}
            </div>

            {/* Card Information */}
            <div id="cert-info-box" className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <Info className="h-5 w-5 mr-2" />
                Card Information
              </h2>

              <div className="space-y-4">
                <div id="cert-card-name" className="border-b border-gray-800 pb-3">
                  <label className="text-gray-400 text-sm uppercase tracking-wider">Card Name</label>
                  <p className="text-white text-lg font-semibold mt-1">{card.card_name} - {card.language || 'English'}</p>
                </div>

                <div id="cert-card-game" className="border-b border-gray-800 pb-3">
                  <label className="text-gray-400 text-sm uppercase tracking-wider flex items-center">
                    <Package className="h-4 w-4 mr-1" />
                    Game
                  </label>
                  <p className="text-white font-medium mt-1">{card.card_game}</p>
                </div>

                <div id="cert-set-name" className="border-b border-gray-800 pb-3">
                  <label className="text-gray-400 text-sm uppercase tracking-wider">Set Name</label>
                  <p className="text-white font-medium mt-1">{card.set_name}</p>
                </div>

                {card.year_card && (
                  <div id="cert-year" className="border-b border-gray-800 pb-3">
                    <label className="text-gray-400 text-sm uppercase tracking-wider flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Year
                    </label>
                    <p className="text-white font-medium mt-1">{card.year_card}</p>
                  </div>
                )}

                {card.edition && (
                  <div id="cert-edition" className="border-b border-gray-800 pb-3">
                    <label className="text-gray-400 text-sm uppercase tracking-wider">Edition</label>
                    <p className="text-white font-medium mt-1">{card.edition}</p>
                  </div>
                )}

                <div id="cert-rarity" className="border-b border-gray-800 pb-3">
                  <label className="text-gray-400 text-sm uppercase tracking-wider flex items-center">
                    <Star className="h-4 w-4 mr-1" />
                    Rarity
                  </label>
                  <p className="text-white font-medium mt-1">{card.rarity}</p>
                </div>

                <div id="cert-language" className="border-b border-gray-800 pb-3">
                  <label className="text-gray-400 text-sm uppercase tracking-wider">Language</label>
                  <p className="text-white font-medium mt-1">{card.language || 'English'}</p>
                </div>

                {card.card_number && (
                  <div id="cert-card-number" className="border-b border-gray-800 pb-3">
                    <label className="text-gray-400 text-sm uppercase tracking-wider flex items-center">
                      <Hash className="h-4 w-4 mr-1" />
                      Card Number
                    </label>
                    <p className="text-white font-medium mt-1">{card.card_number}</p>
                  </div>
                )}

                {card.card_info && (
                  <div id="cert-card-info" className="border-b border-gray-800 pb-3">
                    <label className="text-gray-400 text-sm uppercase tracking-wider">Additional Info</label>
                    <p className="text-white font-medium mt-1">{card.card_info}</p>
                  </div>
                )}

                <div id="cert-date-graded">
                  <label className="text-gray-400 text-sm uppercase tracking-wider flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Date Graded
                  </label>
                  <p className="text-white font-medium mt-1">
                    {new Date(card.date_graded).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Certification Seal */}
            <div id="cert-seal" className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 text-center">
              <div className="inline-block p-4 bg-green-900/20 rounded-full border-2 border-green-500 mb-3">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <h3 className="text-white font-bold text-lg mb-1">Officially Certified</h3>
              <p className="text-gray-400 text-sm">
                This card has been authenticated and graded by NEXUS TCGrading
              </p>
            </div>
          </motion.div>
        </div>

        {/* Footer Note */}
        <motion.div
          id="cert-footer-note"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-gray-900/30 border border-gray-800 rounded-lg p-6 text-center"
        >
          <p className="text-gray-400 text-sm">
            To verify this certification, visit our website and enter the certification number: <span className="text-[#d83f0a] font-mono font-semibold">{card.card_id}</span>
          </p>
        </motion.div>
      </main>
    </div>
  )
}
