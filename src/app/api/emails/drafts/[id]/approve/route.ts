import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { sendEmail } from '@/lib/resend'
import { wrapEmailBody } from '@/lib/email-templates'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { edited_body } = body

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  const { data: draft } = await supabase
    .from('email_drafts')
    .select('*')
    .eq('id', params.id)
    .eq('business_id', business.id)
    .single()

  if (!draft) return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
  if (draft.status !== 'pending') {
    return NextResponse.json({ error: 'Draft already processed' }, { status: 400 })
  }

  const finalBody = edited_body || draft.body

  // Log edit for AI learning if the body was changed
  if (edited_body && edited_body !== draft.original_body) {
    await supabase.from('ai_edit_log').insert({
      business_id: business.id,
      email_type: draft.email_type,
      original_text: draft.original_body || draft.body,
      edited_text: edited_body,
    })

    // Rebuild AI preferences if we have enough edits
    const { count } = await supabase
      .from('ai_edit_log')
      .select('id', { count: 'exact' })
      .eq('business_id', business.id)

    if (count && count % 3 === 0) {
      // Trigger async preference rebuild (fire and forget)
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/settings/rebuild-preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: business.id }),
      }).catch(console.error)
    }
  }

  // Send the email
  const html = wrapEmailBody(
    finalBody,
    business.email_signature,
    business.id,
    draft.related_type === 'customer' ? draft.related_id || undefined : undefined,
    true
  )

  const result = await sendEmail({
    to: draft.to_email,
    subject: draft.subject,
    html,
    replyTo: business.reply_to_email || business.email,
  })

  const now = new Date().toISOString()

  // Update draft status
  await supabase
    .from('email_drafts')
    .update({
      status: 'sent',
      approved_at: now,
      sent_at: now,
      body: finalBody,
    })
    .eq('id', params.id)

  // Log it
  await supabase.from('email_log').insert({
    business_id: business.id,
    draft_id: draft.id,
    to_email: draft.to_email,
    subject: draft.subject,
    email_type: draft.email_type,
    resend_id: result.data?.id,
    status: 'sent',
  })

  // Update related record timestamps based on email type
  if (draft.email_type === 'quote' && draft.related_id) {
    await supabase
      .from('leads')
      .update({ status: 'quoted', quote_sent_at: now })
      .eq('id', draft.related_id)
  }

  if (draft.email_type === 'follow_up' && draft.related_id) {
    const { data: lead } = await supabase
      .from('leads')
      .select('follow_up_sent_at')
      .eq('id', draft.related_id)
      .single()

    if (!lead?.follow_up_sent_at) {
      await supabase
        .from('leads')
        .update({ follow_up_sent_at: now })
        .eq('id', draft.related_id)
    } else {
      await supabase
        .from('leads')
        .update({ follow_up_2_sent_at: now })
        .eq('id', draft.related_id)
    }
  }

  return NextResponse.json({ success: true, emailId: result.data?.id })
}
