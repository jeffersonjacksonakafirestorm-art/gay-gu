'use client'

import { useState, useEffect, useCallback } from 'react'
import { Lead } from '@/lib/types'

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  quoted: 'bg-yellow-100 text-yellow-700',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
  no_response: 'bg-gray-100 text-gray-600',
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [form, setForm] = useState({
    name: '', email: '', phone: '', service_requested: '', message: '', source: 'manual',
  })
  const [saving, setSaving] = useState(false)
  const [businessId, setBusinessId] = useState<string | null>(null)

  const loadLeads = useCallback(async () => {
    const url = filterStatus ? `/api/leads?status=${filterStatus}` : '/api/leads'
    const res = await fetch(url)
    const data = await res.json()
    setLeads(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [filterStatus])

  useEffect(() => {
    // Get business ID for the lead form URL
    fetch('/api/leads')
      .then(r => r.headers.get('x-business-id'))
      .catch(() => null)

    // Get from localStorage or settings
    const stored = localStorage.getItem('groundwork_business_id')
    if (stored) setBusinessId(stored)

    loadLeads()
  }, [loadLeads])

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!businessId) return
    setSaving(true)

    await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, businessId }),
    })

    setForm({ name: '', email: '', phone: '', service_requested: '', message: '', source: 'manual' })
    setShowForm(false)
    await loadLeads()
    setSaving(false)
  }

  const handleStatusChange = async (leadId: string, status: string) => {
    await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    await loadLeads()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-500 text-sm mt-1">Every inquiry, tracked from first contact to close</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors"
        >
          + Add Lead
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['', 'new', 'quoted', 'won', 'lost', 'no_response'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === status
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {status === '' ? 'All' : status.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Add lead form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold mb-4">Add New Lead</h3>
            <form onSubmit={handleAddLead} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Name *"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500"
              />
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500"
              />
              <input
                type="text"
                placeholder="Service requested"
                value={form.service_requested}
                onChange={e => setForm({ ...form, service_requested: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500"
              />
              <textarea
                placeholder="Notes / message from customer"
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 resize-none"
              />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 bg-green-500 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-green-600 disabled:opacity-50">
                  {saving ? 'Adding...' : 'Add Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leads table */}
      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl"></div>)}
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📥</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No leads yet</h3>
          <p className="text-gray-500 text-sm mb-4">Add your first lead manually or share your intake form</p>
          <button onClick={() => setShowForm(true)} className="bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-semibold">
            + Add First Lead
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-widest">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-widest">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-widest">Service</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-widest">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-widest">Received</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {leads.map(lead => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900 text-sm">{lead.name}</p>
                    <p className="text-xs text-gray-400">{lead.source}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-700">{lead.email || '—'}</p>
                    <p className="text-xs text-gray-400">{lead.phone || ''}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">
                    {lead.service_requested || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={lead.status}
                      onChange={e => handleStatusChange(lead.id, e.target.value)}
                      className={`text-xs font-medium px-2 py-1 rounded border-0 cursor-pointer focus:outline-none ${STATUS_COLORS[lead.status]}`}
                    >
                      <option value="new">New</option>
                      <option value="quoted">Quoted</option>
                      <option value="won">Won</option>
                      <option value="lost">Lost</option>
                      <option value="no_response">No Response</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {lead.quote_sent_at ? (
                      <span className="text-xs text-green-600">Quote sent</span>
                    ) : lead.status === 'new' ? (
                      <span className="text-xs text-yellow-600 animate-pulse">Drafting quote...</span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
