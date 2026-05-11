'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ShoppingCart } from 'lucide-react'
import { CartSidebar } from './CartSidebar'

const navigation = [
  { name: 'Home', href: 'https://nexusgrading.com/', external: true },
  { name: 'Packages', href: '/packages' },
  { name: 'Population Report', href: '/population-report' },
  { name: 'About', href: 'https://nexusgrading.com/about/', external: true },
  { name: 'Contact Us', href: 'https://nexusgrading.com/contact-us/', external: true },
]

interface CartItem {
  packageId: string
  packageName: string
  price: number
  quantity: number
}

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = () => {
      const userData = localStorage.getItem('currentUser')
      const token = localStorage.getItem('authToken')

      if (userData && token) {
        setUser(JSON.parse(userData))
      } else {
        setUser(null)
      }
    }

    checkAuth()
    // Listen for storage changes (login/logout from other tabs)
    window.addEventListener('storage', checkAuth)

    return () => {
      window.removeEventListener('storage', checkAuth)
    }
  }, [pathname]) // Re-check on route change

  // Load cart count
  useEffect(() => {
    const loadCartCount = () => {
      const savedCart = localStorage.getItem('cart')
      if (savedCart) {
        const cart: CartItem[] = JSON.parse(savedCart)
        const count = cart.reduce((sum, item) => sum + item.quantity, 0)
        setCartCount(count)
      } else {
        setCartCount(0)
      }
    }

    loadCartCount()

    // Listen for cart updates
    const handleCartUpdate = () => loadCartCount()
    window.addEventListener('cartUpdated', handleCartUpdate)
    window.addEventListener('storage', handleCartUpdate)

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate)
      window.removeEventListener('storage', handleCartUpdate)
    }
  }, [pathname])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      localStorage.removeItem('currentUser')
      localStorage.removeItem('authToken')
      setUser(null)
      setDropdownOpen(false)
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const getDashboardLink = () => {
    if (!user) return '/auth/login'
    return user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard/my-orders'
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full glass-effect border-b border-gray-800">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <a href="https://nexusgrading.com/" id="header-logo-link" className="flex items-center space-x-3">
                <img
                  src="/api/storage/nexustcg_logo.png"
                  alt="Nexus TCG Logo"
                  className="h-11 w-11 object-contain"
                  id="header-logo-img"
                />
                <img
                  src="/api/storage/nexustcg_text_logo_white.png"
                  alt="Nexus TCGrading"
                  className="h-9 object-contain"
                  id="header-text-logo-img"
                />
              </a>
            </div>

            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  const linkClasses = `px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-gaming-primary to-gaming-secondary text-white'
                      : 'text-gray-300 hover:text-gaming-light'
                  }`

                  if ('external' in item && item.external) {
                    return (
                      <a
                        key={item.name}
                        href={item.href}
                        id={`header-nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                        className={linkClasses}
                      >
                        {item.name}
                      </a>
                    )
                  }

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      id={`header-nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                      className={linkClasses}
                    >
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Cart Icon */}
              <button
                id="header-cart-btn"
                onClick={() => setCartOpen(true)}
                className="relative p-2 text-gray-300 hover:text-white transition-colors"
              >
                <ShoppingCart className="h-6 w-6" />
                {cartCount > 0 && (
                  <span
                    id="header-cart-badge"
                    className="absolute -top-1 -right-1 bg-[#d83f0a] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
                  >
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </button>

              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gradient-to-r from-gaming-primary to-gaming-secondary text-white hover:scale-105 transition-transform"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-sm font-medium">{user.first_name}</span>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-lg shadow-lg py-1 border border-gray-700 z-50"
                    >
                      <div className="px-4 py-2 border-b border-gray-700">
                        <p className="text-sm font-medium text-white">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                        {user.role === 'admin' && (
                          <span className="text-xs bg-purple-900/20 text-purple-200 px-2 py-1 rounded-full">
                            Admin
                          </span>
                        )}
                      </div>

                      <Link
                        href={getDashboardLink()}
                        onClick={() => setDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
                      >
                        <div className="flex items-center">
                          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          Dashboard
                        </div>
                      </Link>

                      {user.role === 'admin' && (
                        <Link
                          href="/admin/dashboard/orders"
                          onClick={() => setDropdownOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
                        >
                          <div className="flex items-center">
                            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Manage Orders
                          </div>
                        </Link>
                      )}

                      <Link
                        href="/user/dashboard/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
                      >
                        <div className="flex items-center">
                          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Profile Settings
                        </div>
                      </Link>

                      <div className="border-t border-gray-700">
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-800"
                        >
                          <div className="flex items-center">
                            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sign Out
                          </div>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-gaming-primary to-gaming-secondary text-white hover:scale-105 transition-transform"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="text-sm font-medium">Sign In</span>
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button className="p-2 rounded-md text-gray-400 hover:text-gray-300 hover:bg-gray-800">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Cart Sidebar */}
      <CartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
