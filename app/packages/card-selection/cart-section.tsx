import { motion } from 'framer-motion'
import Image from 'next/image'
import { CartItem } from '@/lib/types'

interface CartSectionProps {
  cart: CartItem[]
  packageInfo: Record<string, { name: string; price: number }>
  packageId: string
  totalCards: number
  totalPrice: number
  failedImages: Set<string>
  updateQuantity: (cardId: string, quantity: number, selectedRarity?: string, selectedSet?: string, selectedImageIndex?: number) => void
  updateCartVariant: (itemIndex: number, key: 'selectedRarity' | 'selectedSet' | 'selectedImageIndex', value: string | number) => void
  handleImageError: (cardId: string) => void
  handleCheckout: () => void
}

export default function CartSection({
  cart,
  packageInfo,
  packageId,
  totalCards,
  totalPrice,
  failedImages,
  updateQuantity,
  updateCartVariant,
  handleImageError,
  handleCheckout
}: CartSectionProps) {
  return (
    <>
      <div className="mb-4 p-4 bg-gray-800 rounded-lg">
        <p className="font-semibold">{packageInfo[packageId].name} Package</p>
        <p className="text-sm text-gray-400">
          ${packageInfo[packageId].price} per card
        </p>
      </div>

      {cart.length === 0 ? (
        <p className="text-gray-400 text-center py-8">
          Your cart is empty. Search and click on cards to add them.
        </p>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {cart.map((item, index) => {
              // Get current image URL based on selected variant
              let currentImageUrl = item.card.imageUrl
              if (item.card.game === 'Yu-Gi-Oh!' && item.card.cardImages && item.selectedImageIndex !== undefined && item.card.cardImages[item.selectedImageIndex]) {
                currentImageUrl = item.card.cardImages[item.selectedImageIndex].image_url_small || item.card.cardImages[item.selectedImageIndex].image_url
              } else if (item.card.cardImages && item.card.cardImages[0]) {
                currentImageUrl = item.card.cardImages[0].image_url_small || item.card.imageUrl
              }
              
              return (
                <motion.div 
                  key={`${item.card.id}-${index}`} 
                  className="p-4 bg-gray-800 rounded-lg"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {/* Main card info */}
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-16 h-20 bg-gray-700 rounded overflow-hidden relative">
                      {currentImageUrl && !failedImages.has(item.card.id) ? (
                        <Image
                          src={currentImageUrl}
                          alt={item.card.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                          onError={() => handleImageError(item.card.id)}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs p-1 text-center">
                          {item.card.name}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.card.name}</h4>
                      <p className="text-xs text-gray-400">{item.card.game}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.card.id, item.quantity - 1, item.selectedRarity, item.selectedSet, item.selectedImageIndex)}
                          className="p-1 hover:bg-gray-700 rounded"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.card.id, item.quantity + 1, item.selectedRarity, item.selectedSet, item.selectedImageIndex)}
                          className="p-1 hover:bg-gray-700 rounded"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Variant selection dropdowns */}
                  <div className="space-y-3 border-t border-gray-700 pt-3">
                    {/* Set Selection */}
                    {item.card.availableSets && item.card.availableSets.length > 1 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-400">Set:</span>
                        <select
                          value={item.selectedSet || ''}
                          onChange={(e) => updateCartVariant(index, 'selectedSet', e.target.value)}
                          className="text-sm px-3 py-1.5 border border-gray-600 rounded-lg bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gaming-primary max-w-[200px] truncate"
                        >
                          {item.card.availableSets.map(set => (
                            <option key={set} value={set}>{set}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    {/* Rarity Selection */}
                    {item.card.availableRarities && item.card.availableRarities.length > 1 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-400">Rarity:</span>
                        <select
                          value={item.selectedRarity || ''}
                          onChange={(e) => updateCartVariant(index, 'selectedRarity', e.target.value)}
                          className="text-sm px-3 py-1.5 border border-gray-600 rounded-lg bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gaming-primary max-w-[160px] truncate"
                        >
                          {item.card.availableRarities.map(rarity => (
                            <option key={rarity} value={rarity}>{rarity}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    {/* Yu-Gi-Oh Set/Rarity Selection */}
                    {item.card.game === 'Yu-Gi-Oh!' && item.card.sets && item.card.sets.length > 1 && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-400">Set:</span>
                          <select
                            value={item.selectedSet || (item.card.sets[0]?.setName || '')}
                            onChange={(e) => {
                              updateCartVariant(index, 'selectedSet', e.target.value)
                              // Auto-select first rarity for this set
                              const selectedSetData = item.card.sets?.find(s => s.setName === e.target.value)
                              if (selectedSetData) {
                                updateCartVariant(index, 'selectedRarity', selectedSetData.rarity)
                              }
                            }}
                            className="text-sm px-3 py-1.5 border border-gray-600 rounded-lg bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gaming-primary max-w-[200px] truncate"
                          >
                            {[...new Set(item.card.sets.map(set => set.setName))].map(setName => (
                              <option key={setName} value={setName}>{setName}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-400">Rarity:</span>
                          <select
                            value={item.selectedRarity || (item.card.sets[0]?.rarity || '')}
                            onChange={(e) => updateCartVariant(index, 'selectedRarity', e.target.value)}
                            className="text-sm px-3 py-1.5 border border-gray-600 rounded-lg bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gaming-primary max-w-[160px] truncate"
                          >
                            {[...new Set(item.card.sets
                              .filter(set => !item.selectedSet || set.setName === item.selectedSet)
                              .map(set => set.rarity))].map(rarity => (
                              <option key={rarity} value={rarity}>{rarity}</option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}
                    
                    {/* Image Variant Selection - only for Yu-Gi-Oh! cards with multiple images */}
                    {item.card.game === 'Yu-Gi-Oh!' && item.card.cardImages && item.card.cardImages.length > 1 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-400">Image:</span>
                        <div className="flex gap-2">
                          {item.card.cardImages.map((image, imgIndex) => (
                            <button
                              key={imgIndex}
                              onClick={() => updateCartVariant(index, 'selectedImageIndex', imgIndex)}
                              className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center text-sm font-medium transition-all hover:scale-105 ${
                                (item.selectedImageIndex || 0) === imgIndex
                                  ? 'bg-gaming-primary text-white border-gaming-primary shadow-lg'
                                  : 'bg-gray-700 text-gray-300 border-gray-600 hover:border-gaming-primary'
                              }`}
                            >
                              {imgIndex + 1}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Current selections display */}
                    <div className="flex flex-wrap gap-3 text-xs pt-2 border-t border-gray-700">
                      <span className="px-2 py-1 bg-blue-900/30 text-blue-300 rounded">
                        📦 {item.selectedSet || 'Default Set'}
                      </span>
                      <span className="px-2 py-1 bg-purple-900/30 text-purple-300 rounded">
                        ⭐ {item.selectedRarity || 'Default Rarity'}
                      </span>
                      {item.card.game === 'Yu-Gi-Oh!' && item.card.cardImages && item.card.cardImages.length > 1 && (
                        <span className="px-2 py-1 bg-green-900/30 text-green-300 rounded">
                          🖼️ Image {(item.selectedImageIndex || 0) + 1}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          <div className="border-t border-gray-700 pt-4">
            <div className="flex justify-between mb-2">
              <span>Total Cards:</span>
              <span className="font-semibold">{totalCards}</span>
            </div>
            <div className="flex justify-between mb-6">
              <span>Total Price:</span>
              <span className="font-bold text-xl text-gradient">${totalPrice}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full bg-gradient-to-r from-gaming-primary to-gaming-secondary text-white py-3 rounded-lg font-medium hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Proceed to Checkout
            </button>
          </div>
        </>
      )}
    </>
  )
}