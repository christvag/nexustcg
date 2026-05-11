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
  // Externalize native modules so the standalone build doesn't try to bundle their .node bindings.
  // Without this, better-sqlite3 / bcrypt fail at runtime in production builds with NODE_MODULE_VERSION mismatches
  // or "module not found" errors. They must remain CommonJS requires resolved at runtime.
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3', 'sqlite3', 'bcrypt', 'bcryptjs'],
  },
  // Security headers for subdomain deployment (CORS handled by middleware.ts)
  async headers() {
    return [
      {
        // Security headers for all routes
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        ],
      },
    ];
  },
}

module.exports = nextConfig