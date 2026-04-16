import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

export const PRICE_ID = process.env.STRIPE_PRICE_ID!

export async function createCheckoutSession(email: string, userId: string) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: PRICE_ID,
        quantity: 1,
      },
    ],
    mode: 'payment',
    customer_email: email,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/?cancelled=true`,
    metadata: {
      userId,
    },
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    payment_intent_data: {
      metadata: {
        userId,
      },
    },
  })
  return session
}
