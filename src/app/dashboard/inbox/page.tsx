'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { EmailDraft } from '@/lib/types'

const EMAIL_TYPE_LABELS: Record<string, string> = {
  quote: 'Quote',
  follow_up: 'Follow-up',
  booking_confirmation: 'Booking Confirmation',
  crew_notification: 'Crew Notification',
  invoice: 'Invoice',
  invoice_reminder: 'Invoice Reminder',
  reactivation: 'Reactivation',
  pulse_report: 'Pulse Report',
}

export default function InboxPage() {
  const [drafts, setDrafts] = useState<EmailDraft[]>([])
  const [selected, setSelected] = useState<EmailDraft | null>(null)
  const [editBody, setEditBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [tab, setTab] = useState<'pending' | 'sent'>('pending')

  const loadDrafts = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/emails/drafts?status=${tab}`)
    const data = await res.json()
    setDrafts(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [tab])

  useEffect(() => {
    loadDrafts()
  }, [loadDrafts])

  const selectDraft = (draft: EmailDraft) => {
    setSelected(draft)
    setEditBody(draft.body)
  }

  const handleApprove = async () => {
    if (!selected) return
    setActionLoading(true)

    const wasEdited = editBody !== selected.original_body

    const res = await fetch(`/api/emails/drafts/${selected.id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ edited_body: wasEdited ? editBody : undefined }),
    })

    if (res.ok) {
      setSelected(null)
      await loadDrafts()
    }
    setActionLoading(false)
  }

  const handleReject = async () => {
    if (!selected) return
    setActionLoading(true)

    const supabase = createClient()
    await supabase
      .from('email_drafts')
      .update({ status: 'rejected' })
      .eq('id', selected.id)

    setSelected(null)
    await loadDrafts()
    setActionLoading(false)
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="p-6 border-b border-gray-100 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Email Inbox</h1>
            <p className="text-gray-500 text-sm mt-0.5">Review and approve outgoing emails before they send</p>
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => { setTab('pending'); setSelected(null) }}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'pending' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Pending ({drafts.length && tab === 'pending' ? drafts.length : '…'})
            </button>
            <button
              onClick={() => { setTab('sent'); setSelected(null) }}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'sent' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Sent
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Draft list */}
        <div className="w-80 border-r border-gray-100 bg-white overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : drafts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="text-4xl mb-3">{tab === 'pending' ? '✅' : '📭'}</div>
              <p className="text-gray-500 text-sm">
                {tab === 'pending' ? 'No emails pending approval' : 'No sent emails yet'}
              </p>
            </div>
          ) : (
            drafts.map(draft => (
              <button
                key={draft.id}
                onClick={() => selectDraft(draft)}
                className={`w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${selected?.id === draft.id ? 'bg-green-50 border-l-2 border-l-green-500' : ''}`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded">
                    {EMAIL_TYPE_LABELS[draft.email_type] || draft.email_type}
                  </span>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(draft.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-900 mb-0.5 truncate">{draft.to_name || draft.to_email}</p>
                <p className="text-xs text-gray-500 truncate">{draft.subject}</p>
              </button>
            ))
          )}
        </div>

        {/* Draft detail */}
        <div className="flex-1 bg-gray-50 overflow-y-auto">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <div className="text-5xl mb-4">✉️</div>
              <p className="text-lg font-medium text-gray-500">Select an email to review</p>
              <p className="text-sm mt-1">You can edit the body before approving</p>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto p-8">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Email header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded">
                      {EMAIL_TYPE_LABELS[selected.email_type] || selected.email_type}
                    </span>
                    {selected.ai_generated && (
                      <span className="text-xs text-purple-700 bg-purple-100 px-2 py-0.5 rounded">AI Draft</span>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex gap-3">
                      <span className="text-gray-400 w-10 flex-shrink-0">To:</span>
                      <span className="text-gray-900 font-medium">{selected.to_name ? `${selected.to_name} <${selected.to_email}>` : selected.to_email}</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-gray-400 w-10 flex-shrink-0">Re:</span>
                      <span className="text-gray-900 font-semibold">{selected.subject}</span>
                    </div>
                  </div>
                </div>

                {/* Editable body */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Email Body</p>
                    {tab === 'pending' && (
                      <p className="text-xs text-gray-400">Edit freely — changes are saved when you approve</p>
                    )}
                  </div>
                  {tab === 'pending' ? (
                    <textarea
                      value={editBody}
                      onChange={e => setEditBody(e.target.value)}
                      className="w-full text-sm text-gray-800 leading-relaxed resize-none focus:outline-none min-h-[300px] font-sans"
                      rows={12}
                    />
                  ) : (
                    <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{selected.body}</div>
                  )}
                </div>

                {/* Actions */}
                {tab === 'pending' && (
                  <div className="p-6 border-t border-gray-100 flex gap-3">
                    <button
                      onClick={handleApprove}
                      disabled={actionLoading}
                      className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors"
                    >
                      {actionLoading ? 'Sending...' : '✓ Approve & Send'}
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={actionLoading}
                      className="px-6 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-3 rounded-lg transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>

              {editBody !== selected.original_body && tab === 'pending' && (
                <div className="mt-3 text-center text-xs text-purple-600">
                  You&apos;ve edited this draft — Groundwork will learn from your changes
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
