import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { draftReactivationEmail } from '@/lib/ai'
import { wrapEmailBody } from '@/lib/email-templates'
import { sendEmail } from '@/lib/resend'
import { headers } from 'next/headers'

// Runs daily at 10am — checks for customer reactivation windows
export async function GET() {
  const headersList = headers()
  const authHeader = headersList.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceRoleClient()
  const now = new Date()

  const getSeason = () => {
    const month = now.getMonth()
    if (month >= 2 && month <= 4) return 'spring'
    if (month >= 5 && month <= 7) return 'summer'
    if (month >= 8 && month <= 10) return 'fall'
    return 'winter'
  }

  const season = getSeason()
  let processed = 0

  // 30-day check-ins
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const thirtyFiveDaysAgo = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000)

  const { data: customers30d } = await supabase
    .from('customers')
    .select('*, businesses(*)')
    .eq('reactivation_30d_sent', false)
    .eq('unsubscribed', false)
    .not('last_job_completed_at', 'is', null)
    .not('email', 'is', null)
    .gte('last_job_completed_at', thirtyFiveDaysAgo.toISOString())
    .lte('last_job_completed_at', thirtyDaysAgo.toISOString())

  for (const customer of customers30d || []) {
    if (!customer.email || !customer.businesses) continue
    const business = customer.businesses

    try {
      const draft = await draftReactivationEmail({
        business,
        customer,
        monthsSinceLastJob: 1,
        aiPreferences: business.ai_preferences?.summary as string,
      })

      if (business.auto_send_enabled) {
        const html = wrapEmailBody(draft.body, business.email_signature, business.id, customer.id)
        await sendEmail({ to: customer.email, subject: draft.subject, html, replyTo: business.email })
        await supabase.from('email_log').insert({
          business_id: business.id,
          to_email: customer.email,
          subject: draft.subject,
          email_type: 'reactivation',
          status: 'sent',
        })
      } else {
        await supabase.from('email_drafts').insert({
          business_id: business.id,
          to_email: customer.email,
          to_name: customer.name,
          subject: draft.subject,
          body: draft.body,
          original_body: draft.body,
          email_type: 'reactivation',
          related_type: 'customer',
          related_id: customer.id,
          status: 'pending',
          ai_generated: true,
        })
      }

      await supabase
        .from('customers')
        .update({ reactivation_30d_sent: true })
        .eq('id', customer.id)

      processed++
    } catch (err) {
      console.error(`Reactivation 30d failed for customer ${customer.id}:`, err)
    }
  }

  // 6-month seasonal follow-ups
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
  const sixMonthsPlus = new Date(now.getTime() - 195 * 24 * 60 * 60 * 1000)

  const { data: customers6m } = await supabase
    .from('customers')
    .select('*, businesses(*)')
    .eq('reactivation_6m_sent', false)
    .eq('unsubscribed', false)
    .not('last_job_completed_at', 'is', null)
    .not('email', 'is', null)
    .gte('last_job_completed_at', sixMonthsPlus.toISOString())
    .lte('last_job_completed_at', sixMonthsAgo.toISOString())

  for (const customer of customers6m || []) {
    if (!customer.email || !customer.businesses) continue
    const business = customer.businesses

    try {
      const draft = await draftReactivationEmail({
        business,
        customer,
        monthsSinceLastJob: 6,
        season,
        aiPreferences: business.ai_preferences?.summary as string,
      })

      if (business.auto_send_enabled) {
        const html = wrapEmailBody(draft.body, business.email_signature, business.id, customer.id)
        await sendEmail({ to: customer.email, subject: draft.subject, html, replyTo: business.email })
        await supabase.from('email_log').insert({
          business_id: business.id,
          to_email: customer.email,
          subject: draft.subject,
          email_type: 'reactivation',
          status: 'sent',
        })
      } else {
        await supabase.from('email_drafts').insert({
          business_id: business.id,
          to_email: customer.email,
          to_name: customer.name,
          subject: draft.subject,
          body: draft.body,
          original_body: draft.body,
          email_type: 'reactivation',
          related_type: 'customer',
          related_id: customer.id,
          status: 'pending',
          ai_generated: true,
        })
      }

      await supabase
        .from('customers')
        .update({ reactivation_6m_sent: true })
        .eq('id', customer.id)

      processed++
    } catch (err) {
      console.error(`Reactivation 6m failed for customer ${customer.id}:`, err)
    }
  }

  // 12-month annual reminders
  const twelveMonthsAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
  const twelveMonthsPlus = new Date(now.getTime() - 380 * 24 * 60 * 60 * 1000)

  const { data: customers12m } = await supabase
    .from('customers')
    .select('*, businesses(*)')
    .eq('reactivation_12m_sent', false)
    .eq('unsubscribed', false)
    .not('last_job_completed_at', 'is', null)
    .not('email', 'is', null)
    .gte('last_job_completed_at', twelveMonthsPlus.toISOString())
    .lte('last_job_completed_at', twelveMonthsAgo.toISOString())

  for (const customer of customers12m || []) {
    if (!customer.email || !customer.businesses) continue
    const business = customer.businesses

    try {
      const draft = await draftReactivationEmail({
        business,
        customer,
        monthsSinceLastJob: 12,
        aiPreferences: business.ai_preferences?.summary as string,
      })

      if (business.auto_send_enabled) {
        const html = wrapEmailBody(draft.body, business.email_signature, business.id, customer.id)
        await sendEmail({ to: customer.email, subject: draft.subject, html, replyTo: business.email })
        await supabase.from('email_log').insert({
          business_id: business.id,
          to_email: customer.email,
          subject: draft.subject,
          email_type: 'reactivation',
          status: 'sent',
        })
      } else {
        await supabase.from('email_drafts').insert({
          business_id: business.id,
          to_email: customer.email,
          to_name: customer.name,
          subject: draft.subject,
          body: draft.body,
          original_body: draft.body,
          email_type: 'reactivation',
          related_type: 'customer',
          related_id: customer.id,
          status: 'pending',
          ai_generated: true,
        })
      }

      await supabase
        .from('customers')
        .update({ reactivation_12m_sent: true })
        .eq('id', customer.id)

      processed++
    } catch (err) {
      console.error(`Reactivation 12m failed for customer ${customer.id}:`, err)
    }
  }

  return NextResponse.json({ processed })
}
