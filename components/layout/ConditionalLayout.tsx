'use client'

import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { usePathname } from 'next/navigation'

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Check if current path is a dashboard route
  const isDashboard = pathname?.includes('/admin/dashboard') || pathname?.includes('/user/dashboard')
  
  return (
    <>
      {!isDashboard && <Header />}
      <main className="flex-1">{children}</main>
      {!isDashboard && <Footer />}
    </>
  )
}