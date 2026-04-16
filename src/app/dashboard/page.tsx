'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

interface PulseData {
  weekRevenue: number
  lastWeekRevenue: number
  jobsCompleted: number
  jobsQuoted: number
  closeRate: number
  outstandingTotal: number
  outstandingCount: number
  activeLeads: number
  recentJobs: Array<{ id: string; title: string; status: string; customers: { name: string } | null }>
}

export default function DashboardPage() {
  const [pulse, setPulse] = useState<PulseData | null>(null)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .single()

      if (!business) return
      setBusinessId(business.id)

      const now = new Date()
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const twoWeeksStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const [
        { data: thisWeekInv },
        { data: lastWeekInv },
        { count: jobsDone },
        { count: leadsQuoted },
        { count: leadsWon },
        { count: totalQuoted },
        { data: outstanding },
        { count: activeLeads },
        { data: recentJobs },
      ] = await Promise.all([
        supabase.from('invoices').select('total').eq('business_id', business.id).eq('status', 'paid').gte('paid_at', weekStart.toISOString()),
        supabase.from('invoices').select('total').eq('business_id', business.id).eq('status', 'paid').gte('paid_at', twoWeeksStart.toISOString()).lt('paid_at', weekStart.toISOString()),
        supabase.from('jobs').select('id', { count: 'exact' }).eq('business_id', business.id).eq('status', 'complete').gte('completed_at', weekStart.toISOString()),
        supabase.from('leads').select('id', { count: 'exact' }).eq('business_id', business.id).gte('quote_sent_at', weekStart.toISOString()),
        supabase.from('leads').select('id', { count: 'exact' }).eq('business_id', business.id).eq('status', 'won').gte('responded_at', thirtyDaysAgo.toISOString()),
        supabase.from('leads').select('id', { count: 'exact' }).eq('business_id', business.id).gte('quote_sent_at', thirtyDaysAgo.toISOString()),
        supabase.from('invoices').select('total').eq('business_id', business.id).in('status', ['sent', 'overdue']),
        supabase.from('leads').select('id', { count: 'exact' }).eq('business_id', business.id).in('status', ['new', 'quoted']),
        supabase.from('jobs').select('id, title, status, customers(name)').eq('business_id', business.id).order('created_at', { ascending: false }).limit(5),
      ])

      const weekRevenue = thisWeekInv?.reduce((s: number, i: { total: number }) => s + Number(i.total), 0) || 0
      const lastWeekRevenue = lastWeekInv?.reduce((s: number, i: { total: number }) => s + Number(i.total), 0) || 0
      const outstandingTotal = outstanding?.reduce((s: number, i: { total: number }) => s + Number(i.total), 0) || 0
      const closeRate = (totalQuoted || 0) > 0 ? ((leadsWon || 0) / (totalQuoted || 1)) * 100 : 0

      setPulse({
        weekRevenue,
        lastWeekRevenue,
        jobsCompleted: jobsDone || 0,
        jobsQuoted: leadsQuoted || 0,
        closeRate,
        outstandingTotal,
        outstandingCount: outstanding?.length || 0,
        activeLeads: activeLeads || 0,
        recentJobs: (recentJobs || []) as unknown as PulseData['recentJobs'],
      })
      setLoading(false)
    }
    load()
  }, [])

  const revenueChange = pulse && pulse.lastWeekRevenue > 0
    ? ((pulse.weekRevenue - pulse.lastWeekRevenue) / pulse.lastWeekRevenue) * 100
    : 0

  const statusColors: Record<string, string> = {
    quoted: 'bg-blue-100 text-blue-700',
    booked: 'bg-purple-100 text-purple-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    complete: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Business Pulse</h1>
        <p className="text-gray-500 text-sm mt-1">This week vs last week</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Revenue This Week</p>
          <p className="text-3xl font-black text-gray-900">${pulse?.weekRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
          {pulse && (
            <p className={`text-sm mt-1 font-medium ${revenueChange >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {revenueChange >= 0 ? '↑' : '↓'} {Math.abs(revenueChange).toFixed(1)}% vs last week
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Jobs Completed</p>
          <p className="text-3xl font-black text-gray-900">{pulse?.jobsCompleted}</p>
          <p className="text-sm text-gray-400 mt-1">{pulse?.jobsQuoted} quoted this week</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Close Rate (30d)</p>
          <p className={`text-3xl font-black ${(pulse?.closeRate || 0) >= 50 ? 'text-green-600' : (pulse?.closeRate || 0) >= 30 ? 'text-yellow-600' : 'text-red-500'}`}>
            {pulse?.closeRate.toFixed(0)}%
          </p>
          <p className="text-sm text-gray-400 mt-1">{pulse?.activeLeads} active leads</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Outstanding</p>
          <p className="text-3xl font-black text-red-500">${pulse?.outstandingTotal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
          <p className="text-sm text-gray-400 mt-1">{pulse?.outstandingCount} unpaid invoices</p>
        </div>
      </div>

      {/* Quick Actions + Recent Jobs */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { href: '/dashboard/leads', label: 'Add a new lead', icon: '+ Lead', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
              { href: '/dashboard/jobs', label: 'Create a job', icon: '+ Job', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
              { href: '/dashboard/inbox', label: 'Review email drafts', icon: '✉️', color: 'bg-green-50 text-green-700 hover:bg-green-100' },
              { href: '/dashboard/customers', label: 'View customers', icon: '👥', color: 'bg-gray-50 text-gray-700 hover:bg-gray-100' },
            ].map(action => (
              <a
                key={action.href}
                href={action.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-colors ${action.color}`}
              >
                <span className="font-mono text-xs">{action.icon}</span>
                {action.label}
              </a>
            ))}
          </div>
          {businessId && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-2">Your lead intake form URL</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-gray-50 rounded px-2 py-1.5 text-gray-600 truncate">
                  {typeof window !== 'undefined' ? window.location.origin : ''}/get-quote/{businessId}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/get-quote/${businessId}`)}
                  className="text-xs text-green-600 hover:text-green-700 font-medium px-2 py-1"
                >
                  Copy
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">Recent Jobs</h2>
          {pulse?.recentJobs?.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-4xl mb-2">🔨</p>
              <p className="text-sm">No jobs yet. <a href="/dashboard/jobs" className="text-green-600 hover:underline">Create your first job</a></p>
            </div>
          ) : (
            <div className="space-y-2">
              {pulse?.recentJobs?.map(job => (
                <div key={job.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{job.title}</p>
                    <p className="text-xs text-gray-400">{job.customers?.name}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${statusColors[job.status] || 'bg-gray-100 text-gray-600'}`}>
                    {job.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
