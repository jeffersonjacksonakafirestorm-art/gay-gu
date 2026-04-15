import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { buildAiPreferencesSummary } from '@/lib/ai'

export async function POST(req: Request) {
  const { businessId } = await req.json()
  if (!businessId) return NextResponse.json({ error: 'Missing businessId' }, { status: 400 })

  const supabase = createServiceRoleClient()

  const { data: editLogs } = await supabase
    .from('ai_edit_log')
    .select('original_text, edited_text, email_type')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (!editLogs || editLogs.length < 3) {
    return NextResponse.json({ updated: false })
  }

  const summary = await buildAiPreferencesSummary(editLogs)

  await supabase
    .from('businesses')
    .update({ ai_preferences: { summary, updated_at: new Date().toISOString() } })
    .eq('id', businessId)

  return NextResponse.json({ updated: true })
}
