'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function UnsubscribeContent() {
  const searchParams = useSearchParams()
  const businessId = searchParams.get('b')
  const customerId = searchParams.get('c')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleUnsubscribe = async () => {
    if (!businessId || !customerId) return
    setLoading(true)

    await fetch('/api/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId, customerId }),
    })

    setDone(true)
    setLoading(false)
  }

  if (!businessId || !customerId) {
    return (
      <div className="text-center">
        <p className="text-gray-500">Invalid unsubscribe link.</p>
      </div>
    )
  }

  return (
    <div className="text-center">
      {done ? (
        <>
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">You&apos;ve been unsubscribed</h1>
          <p className="text-gray-500 text-sm">You won&apos;t receive any more automated emails from this business.</p>
        </>
      ) : (
        <>
          <div className="text-5xl mb-4">✉️</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Unsubscribe</h1>
          <p className="text-gray-500 text-sm mb-6">You won&apos;t receive any more automated emails from this business.</p>
          <button
            onClick={handleUnsubscribe}
            disabled={loading}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Confirm Unsubscribe'}
          </button>
        </>
      )}
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-sm w-full">
        <Suspense fallback={<div className="text-center text-gray-400">Loading...</div>}>
          <UnsubscribeContent />
        </Suspense>
      </div>
    </div>
  )
}
