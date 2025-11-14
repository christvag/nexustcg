/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    domains: [
      'images.unsplash.com', 
      'via.placeholder.com',
      'limitlesstcg.nyc3.cdn.digitaloceanspaces.com',
      'assets.pokemon.com',
      'ms.yugipedia.com',
      'gatherer.wizards.com',
      'c1.scryfall.com',
      'images.pokemontcg.io',
      'static.wikia.nocookie.net',
      'images.ygoprodeck.com',
      'tcgplayer-cdn.tcgplayer.com',
      'product-images.tcgplayer.com',
      'cdn.scryfall.com',
      'cards.scryfall.io',
      'assets.tcgdex.net',
      'api.scryfall.com'
    ],
  },
  // Enable standalone output for Docker
  output: 'standalone',
  // Optimize for production
  swcMinify: true,
  // Temporarily disable TypeScript checking during build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Enable experimental features if needed
  experimental: {
    // serverComponentsExternalPackages: [],
  },
}

module.exports = nextConfig