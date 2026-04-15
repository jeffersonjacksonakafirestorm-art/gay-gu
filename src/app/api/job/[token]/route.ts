import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'

export async function GET(
  _req: Request,
  { params }: { params: { token: string } }
) {
  const supabase = createServiceRoleClient()

  // token is the last segment of the crew_link URL
  const crewLink = `${process.env.NEXT_PUBLIC_APP_URL}/job/${params.token}`

  const { data: job } = await supabase
    .from('jobs')
    .select(`
      title,
      description,
      scheduled_date,
      scheduled_start,
      address,
      status,
      customers(name, phone),
      businesses(name, phone)
    `)
    .eq('crew_link', crewLink)
    .single()

  if (!job) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(job)
}
