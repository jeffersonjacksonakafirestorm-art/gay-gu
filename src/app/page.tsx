'use client'

import { useState } from 'react'
import Link from 'next/link'

const FLOW_STEPS = [
  {
    icon: '📥',
    label: 'Lead comes in',
    detail: 'Web form, email, or you add it manually',
  },
  {
    icon: '🤖',
    label: 'AI drafts the quote',
    detail: 'Based on your service menu and pricing',
  },
  {
    icon: '✅',
    label: 'You approve in one click',
    detail: 'Or set it to auto-send once you trust it',
  },
  {
    icon: '📧',
    label: 'Quote sent to customer',
    detail: 'Professional, branded, from your email',
  },
  {
    icon: '⏰',
    label: 'No response? Follow-up sent at 48hrs',
    detail: 'Automatically. You do nothing.',
  },
  {
    icon: '🗓️',
    label: 'Yes → Job booked',
    detail: 'Calendar blocked, crew notified, confirmation sent',
  },
  {
    icon: '🧾',
    label: 'Job complete → Invoice sent',
    detail: 'Automatically triggered when you mark complete',
  },
  {
    icon: '💸',
    label: 'Unpaid? Reminders at 7 and 14 days',
    detail: 'No awkward calls. It handles it.',
  },
  {
    icon: '🔁',
    label: 'Customer reactivation on autopilot',
    detail: '30 days, 6 months, 12 months — all automatic',
  },
]

const PROBLEMS = [
  {
    before: 'You forget to follow up with a lead',
    after: 'Groundwork follows up at exactly 48 hours',
  },
  {
    before: 'You write the same quote email over and over',
    after: 'AI writes it in seconds based on your prices',
  },
  {
    before: 'You chase invoices and feel awkward',
    after: 'Reminders go out automatically at 7 and 14 days',
  },
  {
    before: 'Old customers forget you exist',
    after: 'Check-ins go out at 30 days, 6 months, 12 months',
  },
  {
    before: 'You have no idea how the business is doing week to week',
    after: 'Monday morning pulse report hits your inbox every week',
  },
  {
    before: 'You lose weekends trying to manage your business',
    after: 'The system runs while you work',
  },
]

const FAQS = [
  {
    q: 'Is this really a one-time payment?',
    a: 'Yes. $297 once. No subscription, no monthly fees, no contracts. You own it.',
  },
  {
    q: 'Does the AI actually send emails on its own?',
    a: 'Not at first. Every email goes to your approval queue first. You review, edit if needed, and approve. Once you trust it, you can flip it to auto-send.',
  },
  {
    q: "What if I'm not tech savvy?",
    a: "The onboarding takes 10 minutes. You enter your services and pricing, connect your email, and you're live. No coding, no setup calls.",
  },
  {
    q: 'What industries does this work for?',
    a: 'Any service business — roofing, landscaping, cleaning, HVAC, plumbing, electrical, pest control, painting, flooring. If you quote jobs and invoice customers, this works for you.',
  },
  {
    q: 'How does the AI know my prices?',
    a: 'You enter your service menu and rates during setup. The AI uses exactly what you set — no guessing.',
  },
  {
    q: 'What if a customer asks to unsubscribe?',
    a: 'Every automated email includes an unsubscribe link. CAN-SPAM compliant out of the box.',
  },
  {
    q: 'Does my crew need to download an app?',
    a: 'No. They get a job link that works on any phone, any browser. Nothing to install.',
  },
  {
    q: 'What if I edit an AI draft?',
    a: 'The system learns from it. After a few edits it builds a profile of your voice and style. Drafts get better over time.',
  },
]

export default function LandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">G</span>
            </div>
            <span className="font-bold text-lg tracking-tight">Groundwork</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>
          <Link
            href="/login"
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            Sign in
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-24 pb-20 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 text-green-400 text-sm font-medium mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            One-time payment · No subscription ever
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight mb-6 text-balance">
            Stop Losing Jobs
            <br />
            <span className="text-green-400">to Disorganization</span>
          </h1>

          <p className="text-xl md:text-2xl text-white/60 leading-relaxed mb-12 max-w-3xl mx-auto text-balance">
            Groundwork sends quotes, follows up, books jobs, sends invoices, and reactivates old customers —
            automatically. You just do the work.
          </p>

          {/* CTA Form */}
          <div id="pricing" className="max-w-md mx-auto">
            <form onSubmit={handleCheckout} className="flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your business email"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-white/30 text-base focus:outline-none focus:border-green-500 transition-colors"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-white font-bold text-lg py-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? 'Redirecting...' : 'Get Groundwork — $297'}
              </button>
            </form>
            <p className="mt-3 text-white/30 text-sm">
              One-time payment · Instant access · 30-day money-back guarantee
            </p>
          </div>
        </div>
      </section>

      {/* Social proof bar */}
      <section className="border-y border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-white/40 text-sm">
          <span>Used by roofing companies</span>
          <span className="w-1 h-1 bg-white/20 rounded-full hidden md:block"></span>
          <span>Landscapers</span>
          <span className="w-1 h-1 bg-white/20 rounded-full hidden md:block"></span>
          <span>HVAC contractors</span>
          <span className="w-1 h-1 bg-white/20 rounded-full hidden md:block"></span>
          <span>Cleaning companies</span>
          <span className="w-1 h-1 bg-white/20 rounded-full hidden md:block"></span>
          <span>Plumbers</span>
          <span className="w-1 h-1 bg-white/20 rounded-full hidden md:block"></span>
          <span>Any service business</span>
        </div>
      </section>

      {/* The Problem */}
      <section className="px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <p className="text-green-400 font-semibold text-sm uppercase tracking-widest text-center mb-4">The Problem</p>
          <h2 className="text-4xl md:text-5xl font-black text-center mb-16 text-balance">
            You&apos;re losing money every single day
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {PROBLEMS.map((p, i) => (
              <div key={i} className="bg-white/[0.03] border border-white/5 rounded-xl p-6">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-2 mb-3">
                      <span className="text-red-400 text-lg mt-0.5">✗</span>
                      <p className="text-white/50 text-sm line-through">{p.before}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-400 text-lg mt-0.5">✓</span>
                      <p className="text-white font-medium text-sm">{p.after}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="px-6 py-24 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto">
          <p className="text-green-400 font-semibold text-sm uppercase tracking-widest text-center mb-4">The Flow</p>
          <h2 className="text-4xl md:text-5xl font-black text-center mb-6 text-balance">
            Every step. Automated.
          </h2>
          <p className="text-white/50 text-center text-lg mb-16 max-w-2xl mx-auto">
            Here&apos;s exactly what happens from the moment a lead comes in to the moment you get paid.
          </p>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-green-500 via-green-500/30 to-transparent hidden md:block"></div>
            <div className="flex flex-col gap-6">
              {FLOW_STEPS.map((step, i) => (
                <div key={i} className="flex gap-6 items-start group">
                  <div className="relative flex-shrink-0 w-16 h-16 bg-[#0a0a0f] border border-white/10 group-hover:border-green-500/40 rounded-xl flex items-center justify-center text-2xl transition-colors z-10">
                    {step.icon}
                  </div>
                  <div className="flex-1 pt-2">
                    <p className="font-bold text-white text-lg">{step.label}</p>
                    <p className="text-white/40 text-sm mt-1">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Business Pulse */}
      <section className="px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-green-400 font-semibold text-sm uppercase tracking-widest mb-4">Monday 7AM</p>
              <h2 className="text-4xl font-black mb-6">
                Your business report.
                <br />
                <span className="text-white/40">Every single week.</span>
              </h2>
              <p className="text-white/60 text-lg mb-8">
                Every Monday morning, Groundwork sends you a pulse report with exactly what you need to know:
              </p>
              <ul className="space-y-3">
                {[
                  'Revenue this week vs last week',
                  'Jobs completed vs quoted',
                  'Close rate on your estimates',
                  'Outstanding invoices and what you\'re owed',
                  'Projected revenue for next month',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-white/70">
                    <span className="text-green-400 text-lg">→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-[#111118] border border-white/10 rounded-2xl p-6 font-mono text-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="ml-2 text-white/30 text-xs">Monday Pulse</span>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Revenue</p>
                  <p className="text-white text-2xl font-bold">$14,200 <span className="text-green-400 text-base">↑ 18%</span></p>
                  <p className="text-white/30 text-xs">vs $12,033 last week</p>
                </div>
                <div className="border-t border-white/5 pt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Jobs Done</p>
                    <p className="text-white font-bold text-xl">9</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Close Rate</p>
                    <p className="text-green-400 font-bold text-xl">74%</p>
                  </div>
                </div>
                <div className="border-t border-white/5 pt-4">
                  <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Outstanding</p>
                  <p className="text-red-400 font-bold text-xl">$3,800 <span className="text-white/30 text-sm font-normal">owed</span></p>
                </div>
                <div className="border-t border-white/5 pt-4">
                  <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Next Month Projected</p>
                  <p className="text-white font-bold text-xl">$58,400</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-6 py-24 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-black text-center mb-16">What owners are saying</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Mike D.',
                role: 'Owner, MD Roofing',
                quote: "I used to lose 2-3 leads a week just from not following up fast enough. That's done. The system catches everything.",
                stars: 5,
              },
              {
                name: 'Sarah L.',
                role: 'Owner, Clean Slate Services',
                quote: "My close rate went from 40% to 65% in 6 weeks. The automated follow-ups are the difference.",
                stars: 5,
              },
              {
                name: 'Carlos R.',
                role: 'Owner, Precision Landscape Co.',
                quote: "I got $4,800 in reactivation revenue in the first month from customers I'd completely forgotten about.",
                stars: 5,
              },
            ].map((t, i) => (
              <div key={i} className="bg-white/[0.03] border border-white/5 rounded-xl p-6">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <span key={j} className="text-yellow-400">★</span>
                  ))}
                </div>
                <p className="text-white/80 text-base mb-6 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="font-bold text-white text-sm">{t.name}</p>
                  <p className="text-white/40 text-xs">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <p className="text-green-400 font-semibold text-sm uppercase tracking-widest text-center mb-4">Everything Included</p>
          <h2 className="text-4xl font-black text-center mb-16">$297. Once. Done.</h2>
          <div className="grid md:grid-cols-2 gap-4 mb-12">
            {[
              'AI-drafted quotes based on your service menu',
              'Automated 48-hour lead follow-ups',
              'Job booking with calendar and crew notification',
              'Automatic invoicing on job completion',
              'Invoice reminders at 7 and 14 days',
              'Customer reactivation at 30d, 6mo, 12mo',
              'Monday morning business pulse report',
              'Approve-before-send queue (you always stay in control)',
              'AI learns your voice and style over time',
              'Public lead intake form for your website',
              'Customer database with full history',
              'CAN-SPAM compliant with unsubscribe on every email',
              'Crew job links that work on any phone',
              'No monthly fees. Ever.',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-green-400 mt-0.5 flex-shrink-0">✓</span>
                <span className="text-white/80">{item}</span>
              </div>
            ))}
          </div>

          <div className="max-w-md mx-auto">
            <form onSubmit={handleCheckout} className="flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Your business email"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-white/30 text-base focus:outline-none focus:border-green-500 transition-colors"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-white font-bold text-xl py-5 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? 'Loading...' : 'Get Groundwork — $297'}
              </button>
            </form>
            <p className="mt-3 text-white/30 text-sm text-center">
              Secure checkout · 30-day money-back guarantee · No subscription
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-6 py-24 bg-white/[0.02]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-black text-center mb-16">Questions</h2>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className="border border-white/5 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-white/5 transition-colors"
                >
                  <span className="font-semibold text-white pr-4">{faq.q}</span>
                  <span className="text-white/40 flex-shrink-0 text-lg">
                    {activeFaq === i ? '−' : '+'}
                  </span>
                </button>
                {activeFaq === i && (
                  <div className="px-6 pb-5 text-white/60 leading-relaxed border-t border-white/5 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-24 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-5xl font-black mb-6 text-balance">
            Your business runs itself.
            <br />
            <span className="text-green-400">You just do the work.</span>
          </h2>
          <p className="text-white/50 text-lg mb-12">
            One-time payment. 10 minute setup. Running by tonight.
          </p>
          <form onSubmit={handleCheckout} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Your email"
              required
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-white/30 text-base focus:outline-none focus:border-green-500 transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-green-500 hover:bg-green-400 disabled:opacity-50 text-white font-bold px-8 py-4 rounded-xl transition-all whitespace-nowrap"
            >
              {loading ? '...' : 'Get Access — $297'}
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-white/30 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center">
              <span className="text-white font-black text-xs">G</span>
            </div>
            <span className="font-bold text-white/50">Groundwork</span>
          </div>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white/60 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white/60 transition-colors">Terms</Link>
            <Link href="/login" className="hover:text-white/60 transition-colors">Sign In</Link>
          </div>
          <p>© {new Date().getFullYear()} Groundwork. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
