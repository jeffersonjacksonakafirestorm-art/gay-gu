import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'

export async function GET(
  _req: Request,
  { params }: { params: { businessId: string } }
) {
  const supabase = createServiceRoleClient()

  const { data: business } = await supabase
    .from('businesses')
    .select('name, industry')
    .eq('id', params.businessId)
    .not('activated_at', 'is', null)
    .single()

  if (!business) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data: services } = await supabase
    .from('services')
    .select('id, name, base_price, price_type')
    .eq('business_id', params.businessId)
    .eq('active', true)
    .order('name')

  return NextResponse.json({
    name: business.name,
    industry: business.industry,
    services: services || [],
  })
}
