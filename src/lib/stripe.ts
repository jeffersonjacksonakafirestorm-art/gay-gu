import Stripe from 'stripe'

export const PRICE_ID = process.env.STRIPE_PRICE_ID!

export function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-02-24.acacia',
  })
}
