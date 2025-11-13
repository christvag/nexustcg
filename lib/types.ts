export interface Card {
  id: string
  name: string
  game: string
  type: string
  rarity: string
  number: string
  imageUrl?: string
  sets?: Array<{
    id: string
    setName: string
    rarity: string
    number: string
    imageUrl?: string
  }>
  availableSets?: string[]
  availableRarities?: string[]
  cardImages?: Array<{
    id: number
    image_url: string
    image_url_small: string
    image_url_cropped: string
  }>
  selectedImageIndex?: number
}

export interface CartItem {
  card: Card
  quantity: number
  selectedRarity?: string
  selectedSet?: string
  selectedImageIndex?: number
}

export interface OrderPackage {
  id: string
  name: string
  price: number
  cards: CartItem[]
}