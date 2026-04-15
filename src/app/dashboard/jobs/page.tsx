'use client'

import { useState, useEffect, useCallback } from 'react'

interface JobWithRelations {
  id: string
  title: string
  description?: string
  status: string
  scheduled_date?: string
  address?: string
  customers: { id: string; name: string; email?: string } | null
  services: { id: string; name: string; base_price: number } | null
  created_at: string
  crew_link?: string
}

const STATUS_COLORS: Record<string, string> = {
  quoted: 'bg-blue-100 text-blue-700',
  booked: 'bg-purple-100 text-purple-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  complete: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [completeModal, setCompleteModal] = useState<JobWithRelations | null>(null)
  const [completing, setCompleting] = useState(false)
  const [completeForm, setCompleteForm] = useState({
    completion_notes: '',
    total: '',
  })

  const loadJobs = useCallback(async () => {
    const url = filterStatus ? `/api/jobs?status=${filterStatus}` : '/api/jobs'
    const res = await fetch(url)
    const data = await res.json()
    setJobs(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [filterStatus])

  useEffect(() => { loadJobs() }, [loadJobs])

  const handleStatusUpdate = async (jobId: string, status: string) => {
    if (status === 'complete') {
      const job = jobs.find(j => j.id === jobId)
      if (job) setCompleteModal(job)
      return
    }

    await fetch(`/api/jobs/${jobId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    await loadJobs()
  }

  const handleComplete = async () => {
    if (!completeModal) return
    setCompleting(true)

    const total = parseFloat(completeForm.total) || 0
    const lineItems = [{ description: completeModal.title, quantity: 1, unit_price: total, total }]

    await fetch(`/api/jobs/${completeModal.id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        completion_notes: completeForm.completion_notes,
        line_items: lineItems,
        total,
        tax_rate: 0,
      }),
    })

    setCompleteModal(null)
    setCompleteForm({ completion_notes: '', total: '' })
    await loadJobs()
    setCompleting(false)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
          <p className="text-gray-500 text-sm mt-1">Track every job from booked to complete</p>
        </div>
        <a
          href="/api/jobs"
          className="bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors"
          onClick={e => {
            e.preventDefault()
            window.location.href = '/dashboard/jobs/new'
          }}
        >
          + Create Job
        </a>
      </div>

      {/* Status pipeline visual */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {['quoted', 'booked', 'in_progress', 'complete', 'cancelled'].map(status => {
          const count = jobs.filter(j => j.status === status).length
          return (
            <button
              key={status}
              onClick={() => setFilterStatus(filterStatus === status ? '' : status)}
              className={`p-3 rounded-xl border text-center transition-all ${
                filterStatus === status
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
            >
              <p className={`text-2xl font-black ${filterStatus === status ? 'text-white' : 'text-gray-900'}`}>{count}</p>
              <p className={`text-xs font-medium capitalize mt-0.5 ${filterStatus === status ? 'text-white/70' : 'text-gray-500'}`}>
                {status.replace('_', ' ')}
              </p>
            </button>
          )
        })}
      </div>

      {/* Complete job modal */}
      {completeModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold mb-1">Mark Job Complete</h3>
            <p className="text-sm text-gray-500 mb-4">{completeModal.title} — {completeModal.customers?.name}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Total *</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400">$</span>
                  <input
                    type="number"
                    required
                    value={completeForm.total}
                    onChange={e => setCompleteForm({ ...completeForm, total: e.target.value })}
                    placeholder="0.00"
                    className="w-full border border-gray-200 rounded-lg pl-6 pr-3 py-2.5 focus:outline-none focus:border-green-500"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">An invoice will be sent to the customer automatically</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Completion Notes (optional)</label>
                <textarea
                  value={completeForm.completion_notes}
                  onChange={e => setCompleteForm({ ...completeForm, completion_notes: e.target.value })}
                  placeholder="Any notes about the job..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setCompleteModal(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm font-medium">
                Cancel
              </button>
              <button
                onClick={handleComplete}
                disabled={completing || !completeForm.total}
                className="flex-1 bg-green-500 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-green-600 disabled:opacity-50"
              >
                {completing ? 'Completing...' : 'Mark Complete & Send Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Jobs list */}
      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl"></div>)}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🔨</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No jobs {filterStatus ? `with status "${filterStatus}"` : 'yet'}</h3>
          <p className="text-gray-500 text-sm">{filterStatus ? 'Clear the filter to see all jobs' : 'Jobs get created when leads are won'}</p>
          {filterStatus && (
            <button onClick={() => setFilterStatus('')} className="mt-3 text-sm text-green-600 hover:underline">
              Clear filter
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => (
            <div key={job.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">{job.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize flex-shrink-0 ${STATUS_COLORS[job.status]}`}>
                      {job.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {job.customers && <span>{job.customers.name}</span>}
                    {job.scheduled_date && <span>📅 {new Date(job.scheduled_date).toLocaleDateString()}</span>}
                    {job.address && <span>📍 {job.address}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {job.crew_link && job.status === 'booked' && (
                    <button
                      onClick={() => navigator.clipboard.writeText(job.crew_link!)}
                      className="text-xs text-purple-600 hover:text-purple-700 border border-purple-200 px-2 py-1.5 rounded-lg"
                    >
                      Copy Crew Link
                    </button>
                  )}
                  <select
                    value={job.status}
                    onChange={e => handleStatusUpdate(job.id, e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-green-500"
                  >
                    <option value="quoted">Quoted</option>
                    <option value="booked">Booked</option>
                    <option value="in_progress">In Progress</option>
                    <option value="complete">Complete</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
