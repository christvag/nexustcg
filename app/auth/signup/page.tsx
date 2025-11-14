'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      console.log('Sending registration request with data:', {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone
      })

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password
        })
      })

      const data = await response.json()
      console.log('Registration response:', data)

      if (response.ok && data.success) {
        // Store user data and token
        localStorage.setItem('authToken', data.token)
        localStorage.setItem('currentUser', JSON.stringify(data.user))

        // Show success message
        setSuccess(true)

        // Redirect after a brief delay to show success message
        setTimeout(() => {
          if (data.user.role.toLowerCase() === 'admin') {
            router.push('/admin/dashboard')
          } else {
            router.push('/user/dashboard/my-orders')
          }
        }, 1500)
      } else {
        setError(data.error || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration error:', error)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 id="signup-logo" className="text-3xl font-bold">
              <span className="text-gradient">NEXUS TCGrading</span>
            </h1>
          </Link>
          <h2 id="signup-title" className="mt-6 text-3xl font-extrabold text-white">
            Create a new account
          </h2>
          <p id="signup-login-link" className="mt-2 text-sm text-gray-400">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="font-medium text-gaming-primary hover:text-gaming-secondary"
            >
              Sign in
            </Link>
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-gray-900 py-8 px-4 shadow-xl rounded-xl sm:px-10"
        >
          {error && (
            <div id="signup-error-message" className="mb-4 p-4 bg-red-900/20 border border-red-700 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div id="signup-success-message" className="mb-4 p-4 bg-green-900/20 border border-green-700 rounded-lg">
              <p className="text-green-400 text-sm flex items-center">
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Account created successfully! Redirecting to your dashboard...
              </p>
            </div>
          )}

          <form id="signup-form" className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-300">
                  First Name <span className="text-[#d83f0a]">*</span>
                </label>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gaming-primary focus:border-gaming-primary bg-gray-800 text-white"
                />
              </div>
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-300">
                  Last Name <span className="text-[#d83f0a]">*</span>
                </label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gaming-primary focus:border-gaming-primary bg-gray-800 text-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email address <span className="text-[#d83f0a]">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gaming-primary focus:border-gaming-primary bg-gray-800 text-white"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-300">
                Phone (Optional)
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gaming-primary focus:border-gaming-primary bg-gray-800 text-white"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password <span className="text-[#d83f0a]">*</span>
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gaming-primary focus:border-gaming-primary bg-gray-800 text-white"
                  placeholder="Minimum 6 characters"
                />
                <button
                  id="toggle-password"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                Confirm Password <span className="text-[#d83f0a]">*</span>
              </label>
              <div className="relative mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gaming-primary focus:border-gaming-primary bg-gray-800 text-white"
                  placeholder="Re-enter your password"
                />
                <button
                  id="toggle-confirm-password"
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <button
                id="signup-submit-btn"
                type="submit"
                disabled={loading || success}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#d83f0a] to-[#d66a0a] hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#d83f0a] disabled:opacity-50 disabled:cursor-not-allowed transition-transform"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating account...
                  </div>
                ) : success ? (
                  <div className="flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Success!
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </div>
  )
}
