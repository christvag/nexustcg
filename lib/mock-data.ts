import { Card } from './types'

export const mockCards: Card[] = [
  // Pokemon Cards
  {
    id: 'pk-001',
    name: 'Charizard',
    game: 'Pokemon',
    type: 'Fire/Flying',
    rarity: 'Rare Holo',
    number: '4/102',
    imageUrl: 'https://via.placeholder.com/200x280?text=Charizard',
  },
  {
    id: 'pk-002',
    name: 'Pikachu',
    game: 'Pokemon',
    type: 'Electric',
    rarity: 'Common',
    number: '58/102',
    imageUrl: 'https://via.placeholder.com/200x280?text=Pikachu',
  },
  {
    id: 'pk-003',
    name: 'Blastoise',
    game: 'Pokemon',
    type: 'Water',
    rarity: 'Rare Holo',
    number: '2/102',
    imageUrl: 'https://via.placeholder.com/200x280?text=Blastoise',
  },
  // Yu-Gi-Oh Cards
  {
    id: 'ygo-001',
    name: 'Blue-Eyes White Dragon',
    game: 'Yu Gi Oh',
    type: 'Dragon/Normal',
    rarity: 'Ultra Rare',
    number: 'LOB-001',
    imageUrl: 'https://via.placeholder.com/200x280?text=Blue-Eyes',
  },
  {
    id: 'ygo-002',
    name: 'Dark Magician',
    game: 'Yu Gi Oh',
    type: 'Spellcaster/Normal',
    rarity: 'Ultra Rare',
    number: 'LOB-005',
    imageUrl: 'https://via.placeholder.com/200x280?text=Dark+Magician',
  },
  // MTG Cards
  {
    id: 'mtg-001',
    name: 'Black Lotus',
    game: 'MTG',
    type: 'Artifact',
    rarity: 'Mythic Rare',
    number: '001',
    imageUrl: 'https://via.placeholder.com/200x280?text=Black+Lotus',
  },
  {
    id: 'mtg-002',
    name: 'Lightning Bolt',
    game: 'MTG',
    type: 'Instant',
    rarity: 'Common',
    number: '149',
    imageUrl: 'https://via.placeholder.com/200x280?text=Lightning+Bolt',
  },
  // One Piece Cards
  {
    id: 'op-001',
    name: 'Monkey D. Luffy',
    game: 'One Piece',
    type: 'Leader',
    rarity: 'Super Rare',
    number: 'OP01-001',
    imageUrl: 'https://via.placeholder.com/200x280?text=Luffy',
  },
  // Metazoo Cards
  {
    id: 'mz-001',
    name: 'Mothman',
    game: 'Metazoo',
    type: 'Beastie',
    rarity: 'Holo Rare',
    number: 'CN1-001',
    imageUrl: 'https://via.placeholder.com/200x280?text=Mothman',
  },
  // Player Cards
  {
    id: 'pc-001',
    name: 'Michael Jordan',
    game: 'Player Cards',
    type: 'Basketball',
    rarity: 'Rookie Card',
    number: '57',
    imageUrl: 'https://via.placeholder.com/200x280?text=MJ+Rookie',
  },
]