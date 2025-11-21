'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'

interface PopulationCard {
  id: number
  card_id: string
  card_name: string
  card_game: string
  card_grade: string
  set_name: string
  rarity: string
  card_owner: string
  month_graded: number
  year_graded: number
  front_image?: string
}

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<PopulationCard[]>([])
  const [pokemonCards, setPokemonCards] = useState<PopulationCard[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [totalPokemon, setTotalPokemon] = useState(0)
  const [showAllPokemon, setShowAllPokemon] = useState(false)

  // Fetch Pokemon cards on mount
  useEffect(() => {
    fetchPokemonCards()
  }, [])

  // Debounced search
  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(() => {
      handleSearch()
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const fetchPokemonCards = async () => {
    try {
      const response = await fetch('/api/public/population-report/pokemon?limit=20')
      const result = await response.json()
      if (result.success) {
        setPokemonCards(result.data.cards)
        setTotalPokemon(result.data.total)
      }
    } catch (error) {
      console.error('Error fetching Pokemon cards:', error)
    }
  }

  const handleSearch = async () => {
    if (searchTerm.trim().length < 2) return

    setIsSearching(true)
    try {
      const response = await fetch(`/api/public/population-report/search?search=${encodeURIComponent(searchTerm)}`)
      const result = await response.json()
      if (result.success) {
        setSearchResults(result.data)
      }
    } catch (error) {
      console.error('Error searching cards:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const displayedPokemonCards = showAllPokemon ? pokemonCards : pokemonCards.slice(0, 8)

  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold mb-6"
          >
            <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Professional TCG
            </span>
            <br />
            <span className="text-white">Grading Service</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto"
          >
            Get your Pokemon, Yu-Gi-Oh!, MTG, and other trading cards professionally graded
            with our fast and reliable service.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/packages"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg hover:scale-105 transition-transform shadow-lg"
            >
              Get Started
              <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white border-2 border-gray-700 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Learn More
            </Link>
          </motion.div>
        </div>

        {/* Floating Cards Animation */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-32 h-44 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-transparent bg-clip-border opacity-30"
              style={{
                background: 'linear-gradient(#1f2937, #1f2937) padding-box, linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%) border-box',
                border: '2px solid transparent'
              }}
              initial={{
                x: typeof window !== 'undefined' ? Math.random() * (window.innerWidth - 128) : Math.random() * 800,
                y: -200,
                rotate: Math.random() * 360,
              }}
              animate={{
                y: typeof window !== 'undefined' ? window.innerHeight + 200 : 1000,
                rotate: Math.random() * 360,
              }}
              transition={{
                duration: 20 + Math.random() * 10,
                repeat: Infinity,
                delay: i * 2,
                ease: "linear",
              }}
            />
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-black/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-12"
          >
            <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Our Grading Process
            </span>
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Authentication",
                description: "Every card is thoroughly authenticated by our experts",
                icon: "🔍",
              },
              {
                title: "Grading",
                description: "Professional grading based on condition and rarity",
                icon: "⭐",
              },
              {
                title: "Protection",
                description: "Cards are sealed in tamper-proof protective slabs",
                icon: "🛡️",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="bg-gray-900 rounded-2xl p-8 shadow-xl border-2 border-transparent transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                style={{
                  background: 'linear-gradient(#1f2937, #1f2937) padding-box, linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%) border-box',
                  border: '2px solid transparent'
                }}
              >
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-2xl font-bold mb-4 text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Games Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-12"
          >
            <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Supported Games
            </span>
          </motion.h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              "Pokemon",
              "Yu-Gi-Oh!",
              "Magic: The Gathering",
              "Metazoo",
              "One Piece",
              "Sports Cards",
            ].map((game, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-6 text-center hover:from-blue-500/20 hover:to-purple-500/20 transition-all cursor-pointer hover:scale-105"
              >
                <div className="text-3xl mb-2">🎴</div>
                <p className="font-medium text-white">{game}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Population Report Section */}
      <section id="population-report-section" className="py-20 px-4 bg-black/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-8"
          >
            <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Population Report
            </span>
          </motion.h2>

          {/* Search Bar */}
          <motion.div
            id="pop-report-search-container"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto mb-12"
          >
            <div id="pop-report-search-wrapper" className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                id="pop-report-search-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search cards by name, game, or set..."
                className="w-full pl-12 pr-4 py-4 bg-gray-900 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              {isSearching && (
                <div id="pop-report-search-loading" className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div id="pop-report-search-results" className="mt-4 bg-gray-900 border-2 border-gray-700 rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  {searchResults.map((card) => (
                    <div
                      key={card.id}
                      id={`search-result-${card.id}`}
                      className="p-4 border-b border-gray-700 last:border-b-0 hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div id={`search-result-card-id-${card.id}`} className="mb-1">
                            <Link href={`/cert/${card.card_id}`}>
                              <span className="inline-block px-2 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded text-xs font-bold hover:scale-105 transition-transform cursor-pointer">
                                ID: {card.card_id}
                              </span>
                            </Link>
                          </div>
                          <Link href={`/card/${card.card_id}`}>
                            <h3 className="font-bold text-white hover:text-blue-400 transition-colors cursor-pointer">{card.card_name}</h3>
                          </Link>
                          <p className="text-sm text-gray-400">{card.card_game} - {card.set_name}</p>
                          <p className="text-sm text-gray-500">Owner: {card.card_owner}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-400">Grade: {card.card_grade}</div>
                          <div className="text-sm text-gray-400">
                            {new Date(card.year_graded, card.month_graded - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Game Categories */}
          <div id="pop-report-categories" className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { name: 'Pokemon', logo: '⚡', active: true },
              { name: 'Yu-Gi-Oh!', logo: '🎴', active: false },
              { name: 'MTG', logo: '✨', active: false },
              { name: 'One Piece', logo: '⚓', active: false },
            ].map((game, index) => (
              <motion.div
                id={`game-category-${game.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`p-6 rounded-xl text-center cursor-pointer transition-all ${
                  game.active
                    ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-blue-500'
                    : 'bg-gray-900 border-2 border-gray-700 opacity-50'
                }`}
              >
                <div className="text-4xl mb-2">{game.logo}</div>
                <h3 className="font-bold text-white">{game.name}</h3>
                {game.active && (
                  <p className="text-sm text-blue-400 mt-2">{totalPokemon} cards graded</p>
                )}
              </motion.div>
            ))}
          </div>

          {/* Pokemon Cards Display */}
          {pokemonCards.length > 0 && (
            <div id="pokemon-cards-section">
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-2xl font-bold text-white mb-6"
              >
                Pokemon Graded Cards
              </motion.h3>

              <div id="pokemon-cards-grid" className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {displayedPokemonCards.map((card, index) => (
                  <motion.div
                    id={`pokemon-card-${card.id}`}
                    key={card.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gray-900 rounded-xl overflow-hidden border-2 border-gray-700 hover:border-blue-500 transition-all hover:scale-105"
                  >
                    <div id={`pokemon-card-content-${card.id}`} className="p-4">
                      <Link href={`/card/${card.card_id}`}>
                        <div className="aspect-[2.5/3.5] bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg mb-4 flex items-center justify-center cursor-pointer">
                          {card.front_image ? (
                            <img
                              src={card.front_image.startsWith('/') ? `/api/storage${card.front_image}` : `/api/storage/${card.front_image}`}
                              alt={card.card_name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <div className="text-6xl">🎴</div>
                          )}
                        </div>
                      </Link>
                      <div id={`pokemon-card-id-badge-${card.id}`} className="mb-2">
                        <Link href={`/cert/${card.card_id}`}>
                          <span className="inline-block px-2 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded text-xs font-bold hover:scale-105 transition-transform cursor-pointer">
                            ID: {card.card_id}
                          </span>
                        </Link>
                      </div>
                      <Link href={`/card/${card.card_id}`}>
                        <h4 id={`pokemon-card-name-${card.id}`} className="font-bold text-white mb-2 truncate cursor-pointer hover:text-blue-400 transition-colors">{card.card_name}</h4>
                      </Link>
                      <div id={`pokemon-card-details-${card.id}`} className="space-y-1 text-sm">
                        <p className="text-gray-400">Grade: <span className="text-blue-400 font-bold">{card.card_grade}</span></p>
                        <p className="text-gray-400">
                          Graded: {new Date(card.year_graded, card.month_graded - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </p>
                        <p className="text-gray-400">Owner: <span className="text-white">{card.card_owner}</span></p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {pokemonCards.length > 8 && (
                <div id="pokemon-show-more-container" className="text-center mt-8">
                  <button
                    id="pokemon-show-more-btn"
                    onClick={() => setShowAllPokemon(!showAllPokemon)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:scale-105 transition-transform"
                  >
                    {showAllPokemon ? 'Show Less' : `Show All ${totalPokemon} Cards`}
                  </button>
                </div>
              )}
            </div>
          )}

          {pokemonCards.length === 0 && (
            <div id="no-pokemon-cards" className="text-center text-gray-400 py-12">
              <p>No Pokemon cards available in the population report yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-white mb-6"
          >
            Ready to Grade Your Cards?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-white/90 mb-8"
          >
            Choose from our flexible packages and get started today.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <Link
              href="/packages"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-blue-600 bg-white rounded-lg hover:scale-105 transition-transform shadow-lg"
            >
              View Packages
              <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}