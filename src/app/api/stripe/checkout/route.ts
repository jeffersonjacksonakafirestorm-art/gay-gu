import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createServiceRoleClient } from '@/lib/supabase-server'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    // Create or get user in Supabase auth
    const supabase = createServiceRoleClient()
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
    })

    // If user already exists, get their ID
    let userId: string
    if (userError && userError.message.includes('already registered')) {
      const { data: existingUser } = await supabase
        .from('auth.users')
        .select('id')
        .eq('email', email)
        .single()
      userId = existingUser?.id || email
    } else if (userData?.user) {
      userId = userData.user.id
    } else {
      userId = email
    }

    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Groundwork — Lifetime Access',
              description: 'One-time payment. Full access to all features. No subscription ever.',
              images: [],
            },
            unit_amount: 29700, // $297.00
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: email,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/?cancelled=true`,
      metadata: { userId, email },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
