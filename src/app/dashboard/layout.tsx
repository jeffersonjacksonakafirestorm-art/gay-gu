'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'

const NAV = [
  { href: '/dashboard', label: 'Pulse', icon: '📊' },
  { href: '/dashboard/leads', label: 'Leads', icon: '📥' },
  { href: '/dashboard/jobs', label: 'Jobs', icon: '🔨' },
  { href: '/dashboard/customers', label: 'Customers', icon: '👥' },
  { href: '/dashboard/inbox', label: 'Inbox', icon: '✉️' },
  { href: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [pendingCount, setPendingCount] = useState(0)
  const [businessName, setBusinessName] = useState('')

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: business } = await supabase
        .from('businesses')
        .select('id, name')
        .eq('owner_id', user.id)
        .single()

      if (!business) { router.push('/onboarding'); return }
      setBusinessName(business.name)

      // Get pending email count
      const { count } = await supabase
        .from('email_drafts')
        .select('id', { count: 'exact' })
        .eq('business_id', business.id)
        .eq('status', 'pending')

      setPendingCount(count || 0)
    }
    init()
  }, [router])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col fixed h-screen">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-xs">G</span>
            </div>
            <span className="font-bold text-sm text-gray-900 truncate">{businessName || 'Groundwork'}</span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(item => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            const showBadge = item.href === '/dashboard/inbox' && pendingCount > 0

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span>{item.icon}</span>
                  {item.label}
                </span>
                {showBadge && (
                  <span className="bg-green-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {pendingCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleSignOut}
            className="w-full text-left px-3 py-2.5 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-56 min-h-screen">
        {children}
      </main>
    </div>
  )
}
