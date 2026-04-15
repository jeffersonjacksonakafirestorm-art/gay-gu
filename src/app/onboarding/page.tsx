'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const STEPS = ['Business Info', 'Service Menu', 'Email Setup', 'First Customer']

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [businessId, setBusinessId] = useState<string | null>(null)

  const [businessForm, setBusinessForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    industry: 'roofing',
  })

  const [services, setServices] = useState([
    { name: '', base_price: '', price_type: 'flat', description: '' },
  ])

  const [emailSettings, setEmailSettings] = useState({
    reply_to_email: '',
    email_signature: '',
  })

  const [customer, setCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  })

  useEffect(() => {
    // Get business from auth
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: business } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      if (business) {
        setBusinessId(business.id)
        setBusinessForm({
          name: business.name || '',
          email: business.email || '',
          phone: business.phone || '',
          address: business.address || '',
          industry: business.industry || 'roofing',
        })
        if (business.name && business.name !== 'My Business') {
          // Already onboarded, go to dashboard
          router.push('/dashboard')
        }
      }
    }
    init()
  }, [router])

  const saveBusinessInfo = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('businesses')
      .update(businessForm)
      .eq('owner_id', user.id)
      .select('id')
      .single()

    if (!error && data) {
      setBusinessId(data.id)
      setStep(1)
    }
    setLoading(false)
  }

  const saveServices = async () => {
    if (!businessId) return
    setLoading(true)
    const supabase = createClient()

    const validServices = services
      .filter(s => s.name && s.base_price)
      .map(s => ({
        business_id: businessId,
        name: s.name,
        base_price: parseFloat(s.base_price),
        price_type: s.price_type,
        description: s.description,
        active: true,
      }))

    if (validServices.length > 0) {
      await supabase.from('services').insert(validServices)
    }

    setStep(2)
    setLoading(false)
  }

  const saveEmailSettings = async () => {
    if (!businessId) return
    setLoading(true)
    const supabase = createClient()
    await supabase
      .from('businesses')
      .update(emailSettings)
      .eq('id', businessId)
    setStep(3)
    setLoading(false)
  }

  const saveFirstCustomer = async () => {
    if (!businessId) return
    setLoading(true)

    if (customer.name) {
      const supabase = createClient()
      await supabase.from('customers').insert({
        business_id: businessId,
        ...customer,
      })
    }

    router.push('/dashboard')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-2 flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    i < step
                      ? 'bg-green-500 text-white'
                      : i === step
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {i < step ? '✓' : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 ${i < step ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500">Step {step + 1} of {STEPS.length}: <strong>{STEPS[step]}</strong></p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {step === 0 && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Tell us about your business</h2>
                <p className="text-gray-500">This is what goes on all your quotes and invoices.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
                  <input
                    type="text"
                    value={businessForm.name}
                    onChange={e => setBusinessForm({ ...businessForm, name: e.target.value })}
                    placeholder="Mike's Roofing LLC"
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Email *</label>
                  <input
                    type="email"
                    value={businessForm.email}
                    onChange={e => setBusinessForm({ ...businessForm, email: e.target.value })}
                    placeholder="mike@mikesroofing.com"
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={businessForm.phone}
                    onChange={e => setBusinessForm({ ...businessForm, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                  <select
                    value={businessForm.industry}
                    onChange={e => setBusinessForm({ ...businessForm, industry: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500"
                  >
                    <option value="roofing">Roofing</option>
                    <option value="landscaping">Landscaping</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="hvac">HVAC</option>
                    <option value="plumbing">Plumbing</option>
                    <option value="electrical">Electrical</option>
                    <option value="painting">Painting</option>
                    <option value="flooring">Flooring</option>
                    <option value="pest_control">Pest Control</option>
                    <option value="general">General Contractor</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <button
                onClick={saveBusinessInfo}
                disabled={loading || !businessForm.name || !businessForm.email}
                className="mt-6 w-full bg-gray-900 hover:bg-gray-800 disabled:opacity-40 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                {loading ? 'Saving...' : 'Continue →'}
              </button>
            </div>
          )}

          {step === 1 && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Your service menu</h2>
                <p className="text-gray-500">The AI will use these prices to draft every quote.</p>
              </div>
              <div className="space-y-4">
                {services.map((service, i) => (
                  <div key={i} className="p-4 border border-gray-200 rounded-xl space-y-3">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={service.name}
                          onChange={e => {
                            const updated = [...services]
                            updated[i].name = e.target.value
                            setServices(updated)
                          }}
                          placeholder="Service name (e.g. Full Roof Replacement)"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500"
                        />
                      </div>
                      <div className="w-32">
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-gray-400 text-sm">$</span>
                          <input
                            type="number"
                            value={service.base_price}
                            onChange={e => {
                              const updated = [...services]
                              updated[i].base_price = e.target.value
                              setServices(updated)
                            }}
                            placeholder="0.00"
                            className="w-full border border-gray-200 rounded-lg pl-6 pr-3 py-2.5 text-sm focus:outline-none focus:border-green-500"
                          />
                        </div>
                      </div>
                    </div>
                    <select
                      value={service.price_type}
                      onChange={e => {
                        const updated = [...services]
                        updated[i].price_type = e.target.value
                        setServices(updated)
                      }}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500"
                    >
                      <option value="flat">Flat rate</option>
                      <option value="per_sqft">Per square foot</option>
                      <option value="per_hour">Per hour</option>
                      <option value="custom">Custom / Quote-based</option>
                    </select>
                    {services.length > 1 && (
                      <button
                        onClick={() => setServices(services.filter((_, j) => j !== i))}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setServices([...services, { name: '', base_price: '', price_type: 'flat', description: '' }])}
                  className="w-full border-2 border-dashed border-gray-200 hover:border-green-400 rounded-xl py-3 text-sm text-gray-500 hover:text-green-600 transition-colors"
                >
                  + Add another service
                </button>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(0)} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3 rounded-lg hover:bg-gray-50">
                  Back
                </button>
                <button
                  onClick={saveServices}
                  disabled={loading}
                  className="flex-1 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  {loading ? 'Saving...' : 'Continue →'}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Email setup</h2>
                <p className="text-gray-500">Customers reply to this address. Add your sign-off below.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reply-To Email</label>
                  <input
                    type="email"
                    value={emailSettings.reply_to_email}
                    onChange={e => setEmailSettings({ ...emailSettings, reply_to_email: e.target.value })}
                    placeholder="mike@mikesroofing.com"
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">Customers hit Reply and it comes straight to you</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Signature</label>
                  <textarea
                    value={emailSettings.email_signature}
                    onChange={e => setEmailSettings({ ...emailSettings, email_signature: e.target.value })}
                    placeholder="Mike Davis&#10;Mike's Roofing LLC&#10;(555) 123-4567"
                    rows={4}
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 resize-none text-sm"
                  />
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-sm font-medium text-amber-800">Email deliverability tip</p>
                  <p className="text-xs text-amber-700 mt-1">For best inbox rates, add a custom domain in Resend and set up SPF/DKIM records. Without this, some emails may go to spam.</p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3 rounded-lg hover:bg-gray-50">
                  Back
                </button>
                <button
                  onClick={saveEmailSettings}
                  disabled={loading}
                  className="flex-1 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  {loading ? 'Saving...' : 'Continue →'}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Add your first customer</h2>
                <p className="text-gray-500">Optional — you can skip this and add customers from the dashboard.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={customer.name}
                    onChange={e => setCustomer({ ...customer, name: e.target.value })}
                    placeholder="John Smith"
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={customer.email}
                    onChange={e => setCustomer({ ...customer, email: e.target.value })}
                    placeholder="john@example.com"
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={customer.phone}
                    onChange={e => setCustomer({ ...customer, phone: e.target.value })}
                    placeholder="(555) 234-5678"
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(2)} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3 rounded-lg hover:bg-gray-50">
                  Back
                </button>
                <button
                  onClick={saveFirstCustomer}
                  disabled={loading}
                  className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white font-bold py-3 rounded-lg transition-colors"
                >
                  {loading ? 'Setting up...' : 'Go to Dashboard →'}
                </button>
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                className="mt-3 w-full text-sm text-gray-400 hover:text-gray-600 py-2"
              >
                Skip — I&apos;ll add customers later
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
