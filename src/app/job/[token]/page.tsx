'use client'

import { useState, useEffect } from 'react'

// This is the crew view — accessible via the crew link with no login required
export default function CrewJobPage({ params }: { params: { token: string } }) {
  const [job, setJob] = useState<{
    title: string
    description?: string
    scheduled_date?: string
    scheduled_start?: string
    address?: string
    status: string
    customers: { name: string; phone?: string } | null
    businesses: { name: string; phone?: string } | null
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/job/${params.token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setNotFound(true)
        else setJob(data)
        setLoading(false)
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [params.token])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <div className="text-white/40">Loading job details...</div>
      </div>
    )
  }

  if (notFound || !job) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="text-xl font-bold text-white mb-2">Job not found</h1>
          <p className="text-white/50">This link may be expired or incorrect.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f1117] px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-7 h-7 bg-green-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-xs">G</span>
          </div>
          <span className="text-white/60 text-sm">{job.businesses?.name || 'Groundwork'}</span>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-4">
          <div className="bg-green-500 px-6 py-4">
            <span className="text-xs text-green-100 font-semibold uppercase tracking-widest">Job Assignment</span>
            <h1 className="text-white text-xl font-bold mt-1">{job.title}</h1>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Customer</p>
              <p className="text-white text-lg font-semibold">{job.customers?.name || 'Unknown'}</p>
              {job.customers?.phone && (
                <a href={`tel:${job.customers.phone}`} className="text-green-400 text-sm mt-0.5 block">
                  {job.customers.phone}
                </a>
              )}
            </div>

            {job.address && (
              <div>
                <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Job Site Address</p>
                <p className="text-white font-medium">{job.address}</p>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(job.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-400 text-sm mt-1 inline-block"
                >
                  Open in Maps →
                </a>
              </div>
            )}

            {job.scheduled_date && (
              <div>
                <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Scheduled</p>
                <p className="text-white font-semibold text-lg">
                  {new Date(job.scheduled_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  {job.scheduled_start && ` at ${job.scheduled_start}`}
                </p>
              </div>
            )}

            {job.description && (
              <div>
                <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Job Notes</p>
                <p className="text-white/80 text-sm leading-relaxed">{job.description}</p>
              </div>
            )}

            {job.businesses?.phone && (
              <div className="pt-4 border-t border-white/10">
                <p className="text-white/40 text-xs mb-2">Questions? Call the office</p>
                <a
                  href={`tel:${job.businesses.phone}`}
                  className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  📞 {job.businesses.phone}
                </a>
              </div>
            )}
          </div>
        </div>

        <p className="text-white/20 text-xs text-center">Powered by Groundwork</p>
      </div>
    </div>
  )
}
