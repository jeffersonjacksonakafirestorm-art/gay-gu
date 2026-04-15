import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'
import { draftQuoteEmail } from '@/lib/ai'
import { wrapEmailBody } from '@/lib/email-templates'

// GET — list leads for authenticated business
export async function GET(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  let query = supabase
    .from('leads')
    .select('*')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

// POST — create a lead and auto-draft a quote
export async function POST(req: Request) {
  const body = await req.json()
  const { businessId, name, email, phone, service_requested, message, source } = body

  // Use service role for public lead intake (no auth required)
  const supabase = createServiceRoleClient()

  const { data: business } = await supabase
    .from('businesses')
    .select('*, services(*)')
    .eq('id', businessId)
    .single()

  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  // Create or find customer
  let customerId: string | null = null
  if (email) {
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('business_id', businessId)
      .eq('email', email)
      .single()

    if (existingCustomer) {
      customerId = existingCustomer.id
    } else {
      const { data: newCustomer } = await supabase
        .from('customers')
        .insert({ business_id: businessId, name, email, phone })
        .select('id')
        .single()
      customerId = newCustomer?.id || null
    }
  }

  // Create lead
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .insert({
      business_id: businessId,
      customer_id: customerId,
      name,
      email,
      phone,
      service_requested,
      message,
      source: source || 'form',
      status: 'new',
    })
    .select()
    .single()

  if (leadError) return NextResponse.json({ error: leadError.message }, { status: 500 })

  // Draft quote via AI (fire and don't block response)
  if (email && business.services?.length > 0) {
    draftQuoteEmail({
      business,
      customer: { name, email, phone },
      lead,
      services: business.services,
      aiPreferences: business.ai_preferences?.summary as string,
    }).then(async (quoteData) => {
      const emailBody = wrapEmailBody(
        quoteData.body,
        business.email_signature,
        businessId,
        customerId || undefined
      )

      // Create email draft in approval queue
      await supabase.from('email_drafts').insert({
        business_id: businessId,
        to_email: email,
        to_name: name,
        subject: quoteData.subject,
        body: quoteData.body,
        original_body: quoteData.body,
        email_type: 'quote',
        related_type: 'lead',
        related_id: lead.id,
        status: business.auto_send_enabled ? 'approved' : 'pending',
        ai_generated: true,
      })

      // If auto-send is enabled, mark lead as quoted
      if (business.auto_send_enabled) {
        await supabase
          .from('leads')
          .update({ status: 'quoted', quote_sent_at: new Date().toISOString() })
          .eq('id', lead.id)
      }

      // Store full HTML for actual sending (done via approval endpoint)
      void emailBody
    }).catch(console.error)
  }

  return NextResponse.json({ success: true, leadId: lead.id }, { status: 201 })
}
