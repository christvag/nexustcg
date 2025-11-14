import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/lib/theme-provider'
import { ConditionalLayout } from '@/components/layout/ConditionalLayout'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TCG Grading Service - Professional Card Grading',
  description: 'Professional trading card game grading service for Pokemon, Yu-Gi-Oh, MTG, and more.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${inter.className} min-h-screen bg-gradient-to-br from-gray-900 to-black text-white`}>
        <ThemeProvider>
          <div className="flex min-h-screen flex-col">
            <ConditionalLayout>{children}</ConditionalLayout>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}