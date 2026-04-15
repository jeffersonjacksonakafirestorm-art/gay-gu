import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { draftFollowUpEmail } from '@/lib/ai'
import { headers } from 'next/headers'

// Runs every hour — checks for leads that haven't responded in 48hrs
export async function GET() {
  const headersList = headers()
  const authHeader = headersList.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceRoleClient()
  const now = new Date()
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000)

  // Find all quoted leads with no response that haven't had a follow-up
  const { data: leads } = await supabase
    .from('leads')
    .select('*, businesses(*)')
    .eq('status', 'quoted')
    .is('follow_up_sent_at', null)
    .not('email', 'is', null)
    .lt('quote_sent_at', fortyEightHoursAgo.toISOString())

  if (!leads?.length) {
    return NextResponse.json({ processed: 0 })
  }

  let processed = 0

  for (const lead of leads) {
    const business = lead.businesses
    if (!business || !lead.email) continue

    try {
      const daysSince = Math.floor(
        (now.getTime() - new Date(lead.quote_sent_at).getTime()) / (1000 * 60 * 60 * 24)
      )

      const draft = await draftFollowUpEmail({
        business,
        customer: { name: lead.name, email: lead.email },
        originalQuoteSubject: 'Your Quote',
        daysSinceSent: daysSince,
        aiPreferences: business.ai_preferences?.summary as string,
      })

      await supabase.from('email_drafts').insert({
        business_id: business.id,
        to_email: lead.email,
        to_name: lead.name,
        subject: draft.subject,
        body: draft.body,
        original_body: draft.body,
        email_type: 'follow_up',
        related_type: 'lead',
        related_id: lead.id,
        status: business.auto_send_enabled ? 'approved' : 'pending',
        ai_generated: true,
      })

      processed++
    } catch (err) {
      console.error(`Failed to draft follow-up for lead ${lead.id}:`, err)
    }
  }

  // Also check for second follow-up (leads with first follow-up but no second, after another 48hrs)
  const { data: leadsNeedingSecond } = await supabase
    .from('leads')
    .select('*, businesses(*)')
    .eq('status', 'quoted')
    .is('follow_up_2_sent_at', null)
    .not('follow_up_sent_at', 'is', null)
    .not('email', 'is', null)
    .lt('follow_up_sent_at', fortyEightHoursAgo.toISOString())

  for (const lead of leadsNeedingSecond || []) {
    const business = lead.businesses
    if (!business || !lead.email) continue

    try {
      const draft = await draftFollowUpEmail({
        business,
        customer: { name: lead.name, email: lead.email },
        originalQuoteSubject: 'Your Quote',
        daysSinceSent: 4,
        aiPreferences: business.ai_preferences?.summary as string,
      })

      await supabase.from('email_drafts').insert({
        business_id: business.id,
        to_email: lead.email,
        to_name: lead.name,
        subject: `Last check-in: ${draft.subject}`,
        body: draft.body,
        original_body: draft.body,
        email_type: 'follow_up',
        related_type: 'lead',
        related_id: lead.id,
        status: business.auto_send_enabled ? 'approved' : 'pending',
        ai_generated: true,
      })

      // Mark lead as no_response if second follow-up created
      await supabase
        .from('leads')
        .update({ status: 'no_response' })
        .eq('id', lead.id)

      processed++
    } catch (err) {
      console.error(`Failed to draft second follow-up for lead ${lead.id}:`, err)
    }
  }

  return NextResponse.json({ processed })
}
