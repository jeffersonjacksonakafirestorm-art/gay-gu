import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { headers } from 'next/headers'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get('stripe-signature')!

  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature error:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as {
      metadata?: { userId?: string; email?: string }
      customer_email?: string
      customer?: string
    }
    const { userId, email } = session.metadata || {}
    const customerEmail = email || session.customer_email

    if (!userId || !customerEmail) {
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    // Check if business already exists
    const { data: existingBusiness } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', userId)
      .single()

    if (!existingBusiness) {
      // Create the business record and mark as activated
      await supabase.from('businesses').insert({
        owner_id: userId,
        name: 'My Business',
        email: customerEmail,
        stripe_customer_id: typeof session.customer === 'string' ? session.customer : null,
        activated_at: new Date().toISOString(),
      })
    }

    // Send magic link for login
    await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: customerEmail,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding`,
      },
    })
  }

  return NextResponse.json({ received: true })
}
