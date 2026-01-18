'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to packages page as the default landing page for the subdomain
    router.replace('/packages')
  }, [router])

  return (
    <div id="home-redirect-page" className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
      <div id="home-redirect-loader" className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d83f0a] mx-auto mb-4"></div>
        <p className="text-gray-400">Redirecting...</p>
      </div>
    </div>
  )
}
