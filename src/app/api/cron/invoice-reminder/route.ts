import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { sendEmail } from '@/lib/resend'
import { wrapEmailBody } from '@/lib/email-templates'
import { headers } from 'next/headers'

// Runs daily at 9am — sends invoice reminders at 7 and 14 days
export async function GET() {
  const headersList = headers()
  const authHeader = headersList.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceRoleClient()
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  // 7-day reminders
  const { data: sevenDayInvoices } = await supabase
    .from('invoices')
    .select('*, businesses(*), customers(*)')
    .eq('status', 'sent')
    .eq('reminder_7d_sent', false)
    .lt('sent_at', sevenDaysAgo.toISOString())

  let processed = 0

  for (const invoice of sevenDayInvoices || []) {
    if (!invoice.customers?.email || !invoice.businesses) continue

    const business = invoice.businesses
    const customer = invoice.customers

    const subject = `Friendly reminder: Invoice #${invoice.invoice_number} is due`
    const body = `Hi ${customer.name},

Just a quick reminder that invoice #${invoice.invoice_number} for $${invoice.total.toFixed(2)} is still outstanding.

If you've already sent payment, please disregard this message.

If you have any questions about the invoice, please reply to this email or give us a call.

Thank you for your business.

${business.name}`

    const html = wrapEmailBody(body, business.email_signature, business.id, customer.id)

    await sendEmail({
      to: customer.email,
      subject,
      html,
      replyTo: business.reply_to_email || business.email,
    })

    await supabase
      .from('invoices')
      .update({ reminder_7d_sent: true, reminder_7d_sent_at: now.toISOString() })
      .eq('id', invoice.id)

    await supabase.from('email_log').insert({
      business_id: business.id,
      to_email: customer.email,
      subject,
      email_type: 'invoice_reminder',
      status: 'sent',
    })

    processed++
  }

  // 14-day reminders
  const { data: fourteenDayInvoices } = await supabase
    .from('invoices')
    .select('*, businesses(*), customers(*)')
    .eq('status', 'sent')
    .eq('reminder_7d_sent', true)
    .eq('reminder_14d_sent', false)
    .lt('sent_at', fourteenDaysAgo.toISOString())

  for (const invoice of fourteenDayInvoices || []) {
    if (!invoice.customers?.email || !invoice.businesses) continue

    const business = invoice.businesses
    const customer = invoice.customers

    // Mark as overdue
    await supabase
      .from('invoices')
      .update({ status: 'overdue' })
      .eq('id', invoice.id)

    const subject = `Second notice: Invoice #${invoice.invoice_number} — payment needed`
    const body = `Hi ${customer.name},

This is our second notice regarding invoice #${invoice.invoice_number} for $${invoice.total.toFixed(2)}, which remains unpaid.

We understand things get busy. Please reply to this email to let us know when we can expect payment, or if there's an issue we can help resolve.

We appreciate your business and look forward to hearing from you.

${business.name}
${business.phone ? `\nPhone: ${business.phone}` : ''}
${business.email}`

    const html = wrapEmailBody(body, business.email_signature, business.id, customer.id)

    await sendEmail({
      to: customer.email,
      subject,
      html,
      replyTo: business.reply_to_email || business.email,
    })

    await supabase
      .from('invoices')
      .update({ reminder_14d_sent: true, reminder_14d_sent_at: now.toISOString() })
      .eq('id', invoice.id)

    await supabase.from('email_log').insert({
      business_id: business.id,
      to_email: customer.email,
      subject,
      email_type: 'invoice_reminder',
      status: 'sent',
    })

    processed++
  }

  return NextResponse.json({ processed })
}
