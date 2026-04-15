import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

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
    .from('jobs')
    .select(`
      *,
      customers(id, name, email, phone),
      services(id, name, base_price)
    `)
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  // Generate crew link
  const crewLinkId = crypto.randomUUID()
  const crewLink = `${process.env.NEXT_PUBLIC_APP_URL}/job/${crewLinkId}`

  const { data: job, error } = await supabase
    .from('jobs')
    .insert({
      ...body,
      business_id: business.id,
      crew_link: crewLink,
      status: body.status || 'booked',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(job, { status: 201 })
}
