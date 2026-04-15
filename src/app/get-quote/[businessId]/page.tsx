'use client'

import { useState, useEffect } from 'react'

interface BusinessInfo {
  name: string
  industry: string
  services: Array<{ id: string; name: string; base_price: number; price_type: string }>
}

export default function GetQuotePage({ params }: { params: { businessId: string } }) {
  const [business, setBusiness] = useState<BusinessInfo | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    service_requested: '',
    message: '',
  })

  useEffect(() => {
    fetch(`/api/business/${params.businessId}/public`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setNotFound(true)
        else setBusiness(data)
      })
      .catch(() => setNotFound(true))
  }, [params.businessId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, businessId: params.businessId }),
    })

    if (res.ok) {
      setSubmitted(true)
    }
    setLoading(false)
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl mb-4">🔍</p>
          <h1 className="text-xl font-bold text-gray-900">Business not found</h1>
          <p className="text-gray-500 mt-2">This link may have expired or is incorrect.</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Request received!</h1>
          <p className="text-gray-600">
            Thanks, <strong>{form.name}</strong>. {business?.name || 'We'} will send you a quote within the next few hours.
          </p>
          <p className="text-sm text-gray-400 mt-4">Check your inbox at <strong>{form.email}</strong></p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {business && (
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
            <p className="text-gray-500 mt-1">Request a free quote</p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {!business ? (
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto"></div>
              <div className="space-y-3">
                {[1,2,3,4].map(i => <div key={i} className="h-11 bg-gray-100 rounded-lg"></div>)}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="John Smith"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="john@example.com"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500"
                />
              </div>
              {business.services?.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Needed</label>
                  <select
                    value={form.service_requested}
                    onChange={e => setForm({ ...form, service_requested: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500"
                  >
                    <option value="">Select a service...</option>
                    {business.services.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                    <option value="other">Other / Not sure</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tell us about your project</label>
                <textarea
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  placeholder="What do you need done? Include any details that will help us give you an accurate quote."
                  rows={4}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 resize-none text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-colors text-base"
              >
                {loading ? 'Submitting...' : 'Request Free Quote →'}
              </button>
              <p className="text-xs text-gray-400 text-center">
                You&apos;ll receive a quote by email. No obligation.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
