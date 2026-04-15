'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-sm">G</span>
          </div>
          <span className="font-bold text-lg text-white tracking-tight">Groundwork</span>
        </Link>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          {sent ? (
            <div className="text-center">
              <div className="text-4xl mb-4">📧</div>
              <h2 className="text-xl font-bold text-white mb-2">Check your inbox</h2>
              <p className="text-white/50 text-sm">
                We sent a login link to <strong className="text-white">{email}</strong>.
                Click it to sign in — no password needed.
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-6 text-sm text-white/40 hover:text-white/60"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-white mb-1">Sign in to Groundwork</h2>
              <p className="text-white/40 text-sm mb-6">We&apos;ll email you a link. No password.</p>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  {loading ? 'Sending...' : 'Send Login Link'}
                </button>
              </form>

              <p className="mt-6 text-center text-white/30 text-xs">
                Don&apos;t have an account?{' '}
                <Link href="/" className="text-green-400 hover:text-green-300">
                  Get Groundwork
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
