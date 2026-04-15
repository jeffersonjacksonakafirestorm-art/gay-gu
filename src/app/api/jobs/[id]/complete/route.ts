import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { draftInvoiceEmail } from '@/lib/ai'
import { invoiceHtml } from '@/lib/email-templates'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { completion_notes, line_items, total, tax_rate } = body

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  // Get the job with customer
  const { data: job } = await supabase
    .from('jobs')
    .select('*, customers(*)')
    .eq('id', params.id)
    .eq('business_id', business.id)
    .single()

  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  const now = new Date().toISOString()

  // Mark job complete
  await supabase
    .from('jobs')
    .update({ status: 'complete', completed_at: now, completion_notes })
    .eq('id', params.id)

  // Update customer's last job completed date
  if (job.customer_id) {
    await supabase
      .from('customers')
      .update({
        last_job_completed_at: now,
        reactivation_30d_sent: false,
        reactivation_6m_sent: false,
        reactivation_12m_sent: false,
      })
      .eq('id', job.customer_id)
  }

  // Generate invoice number
  const invoiceCount = await supabase
    .from('invoices')
    .select('id', { count: 'exact' })
    .eq('business_id', business.id)
  const invoiceNumber = `INV-${String((invoiceCount.count || 0) + 1).padStart(4, '0')}`

  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 14)
  const dueDateStr = dueDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const subtotal = line_items?.reduce((sum: number, item: { total: number }) => sum + item.total, 0) || total
  const taxAmount = subtotal * (tax_rate || 0)
  const invoiceTotal = subtotal + taxAmount

  // Create invoice record
  const { data: invoice } = await supabase
    .from('invoices')
    .insert({
      business_id: business.id,
      job_id: params.id,
      customer_id: job.customer_id,
      invoice_number: invoiceNumber,
      line_items: line_items || [{ description: job.title, quantity: 1, unit_price: total, total }],
      subtotal,
      tax_rate: tax_rate || 0,
      total: invoiceTotal,
      due_date: dueDate.toISOString().split('T')[0],
      status: 'sent',
      sent_at: now,
    })
    .select()
    .single()

  // Draft invoice email via AI
  if (job.customers?.email) {
    const customer = job.customers

    const aiDraft = await draftInvoiceEmail({
      business,
      customer,
      job,
      lineItems: line_items || [{ description: job.title, quantity: 1, unit_price: total, total }],
      total: invoiceTotal,
      invoiceNumber,
      dueDate: dueDateStr,
      aiPreferences: business.ai_preferences?.summary as string,
    })

    // Create the invoice HTML
    const _invoiceEmailHtml = invoiceHtml({
      invoiceNumber,
      businessName: business.name,
      customerName: customer.name,
      lineItems: line_items || [{ description: job.title, quantity: 1, unit_price: total, total }],
      subtotal,
      taxRate: tax_rate || 0,
      total: invoiceTotal,
      dueDate: dueDateStr,
      businessEmail: business.email,
      businessPhone: business.phone,
    })

    // Add to approval queue
    await supabase.from('email_drafts').insert({
      business_id: business.id,
      to_email: customer.email,
      to_name: customer.name,
      subject: aiDraft.subject,
      body: aiDraft.body,
      original_body: aiDraft.body,
      email_type: 'invoice',
      related_type: 'invoice',
      related_id: invoice?.id,
      status: business.auto_send_enabled ? 'approved' : 'pending',
      ai_generated: true,
    })
  }

  return NextResponse.json({ success: true, invoiceId: invoice?.id })
}
