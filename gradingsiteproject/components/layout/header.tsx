'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { motion } from 'framer-motion'

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Packages', href: '/packages' },
  { name: 'Report', href: '/report' },
  { name: 'About', href: '/about' },
]

export function Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full glass-effect border-b border-gray-200 dark:border-gray-800">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="h-8 w-8 rounded-lg bg-gradient-to-r from-gaming-primary to-gaming-secondary"
              />
              <span className="text-xl font-bold text-gradient">TCG Grading</span>
            </Link>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-gaming-primary to-gaming-secondary text-white'
                        : 'text-gray-700 hover:text-gaming-primary dark:text-gray-300 dark:hover:text-gaming-light'
                    }`}
                  >
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <ThemeToggle />
          </div>
        </div>
      </nav>
    </header>
  )
}