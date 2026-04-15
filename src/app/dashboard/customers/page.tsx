'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Customer } from '@/lib/types'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', company: '', notes: '',
  })

  const loadCustomers = async (bid: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', bid)
      .order('created_at', { ascending: false })
    setCustomers(data || [])
    setLoading(false)
  }

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .single()

      if (business) {
        setBusinessId(business.id)
        localStorage.setItem('groundwork_business_id', business.id)
        await loadCustomers(business.id)
      }
    }
    init()
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!businessId) return
    setSaving(true)

    const supabase = createClient()
    await supabase.from('customers').insert({ business_id: businessId, ...form })

    setForm({ name: '', email: '', phone: '', address: '', company: '', notes: '' })
    setShowForm(false)
    await loadCustomers(businessId)
    setSaving(false)
  }

  const filtered = customers.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  )

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500 text-sm mt-1">{customers.length} customers in your database</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors"
        >
          + Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <span className="absolute left-3 top-3 text-gray-400">🔍</span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, or phone..."
          className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-green-500"
        />
      </div>

      {/* Add form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold mb-4">Add Customer</h3>
            <form onSubmit={handleAdd} className="space-y-3">
              <input required placeholder="Full Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500" />
              <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500" />
              <input type="tel" placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500" />
              <input placeholder="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500" />
              <input placeholder="Company (optional)" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500" />
              <textarea placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 resize-none" />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-green-500 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-green-600 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer list */}
      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl"></div>)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">👥</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {search ? 'No customers match your search' : 'No customers yet'}
          </h3>
          {!search && (
            <button onClick={() => setShowForm(true)} className="mt-3 bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-semibold">
              + Add First Customer
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-widest">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-widest">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-widest">Last Job</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-widest">Reactivation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(customer => (
                <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900 text-sm">{customer.name}</p>
                    {customer.company && <p className="text-xs text-gray-400">{customer.company}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-700">{customer.email || '—'}</p>
                    <p className="text-xs text-gray-400">{customer.phone || ''}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {customer.last_job_completed_at
                      ? new Date(customer.last_job_completed_at).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {[
                        { sent: customer.reactivation_30d_sent, label: '30d' },
                        { sent: customer.reactivation_6m_sent, label: '6mo' },
                        { sent: customer.reactivation_12m_sent, label: '12mo' },
                      ].map(({ sent, label }) => (
                        <span
                          key={label}
                          className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                            sent ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {label}
                        </span>
                      ))}
                    </div>
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
