import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'

export async function POST(req: Request) {
  const { businessId, customerId } = await req.json()

  if (!businessId || !customerId) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  }

  const supabase = createServiceRoleClient()

  await supabase
    .from('customers')
    .update({ unsubscribed: true, unsubscribed_at: new Date().toISOString() })
    .eq('id', customerId)
    .eq('business_id', businessId)

  return NextResponse.json({ success: true })
}
