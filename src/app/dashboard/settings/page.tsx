'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export default function SettingsPage() {
  const [business, setBusiness] = useState<{
    id: string
    name: string
    email: string
    phone: string
    reply_to_email: string
    email_signature: string
    auto_send_enabled: boolean
    ai_tone: string
  } | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('businesses')
        .select('id, name, email, phone, reply_to_email, email_signature, auto_send_enabled, ai_tone')
        .eq('owner_id', user.id)
        .single()

      if (data) setBusiness(data)
    }
    load()
  }, [])

  const handleSave = async () => {
    if (!business) return
    setSaving(true)

    const supabase = createClient()
    await supabase
      .from('businesses')
      .update({
        name: business.name,
        email: business.email,
        phone: business.phone,
        reply_to_email: business.reply_to_email,
        email_signature: business.email_signature,
        auto_send_enabled: business.auto_send_enabled,
        ai_tone: business.ai_tone,
      })
      .eq('id', business.id)

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (!business) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-40"></div>
          <div className="h-48 bg-gray-100 rounded-xl"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your business info, email settings, and automation preferences</p>
      </div>

      <div className="space-y-6">
        {/* Business Info */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">Business Info</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
              <input
                type="text"
                value={business.name}
                onChange={e => setBusiness({ ...business, name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Email</label>
              <input
                type="email"
                value={business.email}
                onChange={e => setBusiness({ ...business, email: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={business.phone || ''}
                onChange={e => setBusiness({ ...business, phone: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500"
              />
            </div>
          </div>
        </div>

        {/* Email Settings */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-1">Email Settings</h2>
          <p className="text-sm text-gray-500 mb-4">Customers reply to your reply-to address. Your signature appears at the bottom of every email.</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reply-To Address</label>
              <input
                type="email"
                value={business.reply_to_email || ''}
                onChange={e => setBusiness({ ...business, reply_to_email: e.target.value })}
                placeholder="mike@mikesroofing.com"
                className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Signature</label>
              <textarea
                value={business.email_signature || ''}
                onChange={e => setBusiness({ ...business, email_signature: e.target.value })}
                rows={4}
                placeholder="Your Name&#10;Your Business&#10;(555) 123-4567"
                className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 resize-none text-sm"
              />
            </div>
          </div>
        </div>

        {/* Automation */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-1">Automation</h2>
          <p className="text-sm text-gray-500 mb-4">Control how Groundwork handles email sending.</p>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 border border-gray-100 rounded-xl">
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">Auto-Send Mode</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  When <strong>off</strong>, every email goes to your inbox for approval first (recommended to start).
                  When <strong>on</strong>, emails send immediately after being drafted.
                </p>
              </div>
              <button
                onClick={() => setBusiness({ ...business, auto_send_enabled: !business.auto_send_enabled })}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none mt-0.5 ${
                  business.auto_send_enabled ? 'bg-green-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    business.auto_send_enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            {!business.auto_send_enabled && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm font-medium text-amber-800">Approve-before-send is active</p>
                <p className="text-xs text-amber-700 mt-1">Every automated email will appear in your Inbox tab first. Review, edit if needed, and approve to send. <a href="/dashboard/inbox" className="underline">Go to Inbox</a></p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">AI Writing Tone</label>
              <select
                value={business.ai_tone || 'professional'}
                onChange={e => setBusiness({ ...business, ai_tone: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500"
              >
                <option value="professional">Professional</option>
                <option value="friendly">Friendly and conversational</option>
                <option value="direct">Direct and brief</option>
                <option value="warm">Warm and personal</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">Groundwork also learns your style from every edit you make</p>
            </div>
          </div>
        </div>

        {/* Lead Intake */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-1">Lead Intake Form</h2>
          <p className="text-sm text-gray-500 mb-4">Share this URL on your website, social media, or anywhere you want leads to come from.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm bg-gray-50 rounded-lg px-3 py-2.5 text-gray-600 truncate">
              {typeof window !== 'undefined' ? window.location.origin : 'https://yoursite.com'}/get-quote/{business.id}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(`${window.location.origin}/get-quote/${business.id}`)}
              className="text-sm text-green-600 hover:text-green-700 font-medium border border-green-200 px-3 py-2.5 rounded-lg transition-colors"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full py-3.5 rounded-xl font-bold text-white transition-colors ${
            saved ? 'bg-green-500' : 'bg-gray-900 hover:bg-gray-800'
          } disabled:opacity-50`}
        >
          {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
