import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { draftPulseReport } from '@/lib/ai'
import { wrapEmailBody } from '@/lib/email-templates'
import { sendEmail } from '@/lib/resend'
import { headers } from 'next/headers'

// Runs every Monday at 7am — sends Business Pulse report to owner
export async function GET() {
  const headersList = headers()
  const authHeader = headersList.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceRoleClient()
  const now = new Date()
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const twoWeeksStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  // Get all active businesses
  const { data: businesses } = await supabase
    .from('businesses')
    .select('*')
    .not('activated_at', 'is', null)

  let processed = 0

  for (const business of businesses || []) {
    try {
      // Revenue this week (paid invoices)
      const { data: thisWeekInvoices } = await supabase
        .from('invoices')
        .select('total')
        .eq('business_id', business.id)
        .eq('status', 'paid')
        .gte('paid_at', weekStart.toISOString())

      const weekRevenue = thisWeekInvoices?.reduce((sum, inv) => sum + Number(inv.total), 0) || 0

      // Revenue last week
      const { data: lastWeekInvoices } = await supabase
        .from('invoices')
        .select('total')
        .eq('business_id', business.id)
        .eq('status', 'paid')
        .gte('paid_at', twoWeeksStart.toISOString())
        .lt('paid_at', weekStart.toISOString())

      const lastWeekRevenue = lastWeekInvoices?.reduce((sum, inv) => sum + Number(inv.total), 0) || 0

      // Jobs completed this week
      const { count: jobsCompleted } = await supabase
        .from('jobs')
        .select('id', { count: 'exact' })
        .eq('business_id', business.id)
        .eq('status', 'complete')
        .gte('completed_at', weekStart.toISOString())

      // Quotes sent this week
      const { count: jobsQuoted } = await supabase
        .from('leads')
        .select('id', { count: 'exact' })
        .eq('business_id', business.id)
        .gte('quote_sent_at', weekStart.toISOString())

      // Close rate (last 30 days)
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const { count: totalQuoted } = await supabase
        .from('leads')
        .select('id', { count: 'exact' })
        .eq('business_id', business.id)
        .gte('quote_sent_at', thirtyDaysAgo.toISOString())

      const { count: totalWon } = await supabase
        .from('leads')
        .select('id', { count: 'exact' })
        .eq('business_id', business.id)
        .eq('status', 'won')
        .gte('responded_at', thirtyDaysAgo.toISOString())

      const closeRate = totalQuoted && totalQuoted > 0
        ? ((totalWon || 0) / totalQuoted) * 100
        : 0

      // Outstanding invoices
      const { data: outstandingInvoices } = await supabase
        .from('invoices')
        .select('total')
        .eq('business_id', business.id)
        .in('status', ['sent', 'overdue'])

      const outstandingTotal = outstandingInvoices?.reduce((sum, inv) => sum + Number(inv.total), 0) || 0
      const outstandingCount = outstandingInvoices?.length || 0

      // Projected next month (based on booked jobs)
      const { data: bookedJobs } = await supabase
        .from('invoices')
        .select('total')
        .eq('business_id', business.id)
        .in('status', ['sent', 'paid'])
        .gte('created_at', new Date(now.getFullYear(), now.getMonth(), 1).toISOString())

      const projectedNextMonth = bookedJobs
        ? bookedJobs.reduce((sum, inv) => sum + Number(inv.total), 0) * 1.1
        : weekRevenue * 4

      // Generate AI pulse report
      const report = await draftPulseReport({
        business,
        weekRevenue,
        lastWeekRevenue,
        jobsCompleted: jobsCompleted || 0,
        jobsQuoted: jobsQuoted || 0,
        closeRate,
        outstandingInvoices: outstandingCount,
        outstandingTotal,
        projectedNextMonth,
      })

      const html = wrapEmailBody(report.body, undefined, undefined, undefined, false)

      await sendEmail({
        to: business.email,
        subject: report.subject,
        html,
        replyTo: business.email,
      })

      await supabase.from('email_log').insert({
        business_id: business.id,
        to_email: business.email,
        subject: report.subject,
        email_type: 'pulse_report',
        status: 'sent',
      })

      processed++
    } catch (err) {
      console.error(`Pulse report failed for business ${business.id}:`, err)
    }
  }

  return NextResponse.json({ processed })
}
