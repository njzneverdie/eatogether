import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { sessionId, participantId, ranks } = await req.json()
  // ranks: Array<{ restaurant_id: string; rank: 1|2|3 }>
  if (!sessionId || !participantId || !ranks) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Ensure participant row exists (handles pass-mode seat suffixes)
  const { data: existing } = await supabase
    .from('participants')
    .select('id')
    .eq('id', participantId)
    .single()

  if (!existing) {
    await supabase.from('participants').insert({
      id: participantId,
      session_id: sessionId,
      display_name: `席位`,
    })
  }

  // Delete existing votes for this participant then insert
  await supabase.from('votes').delete().eq('participant_id', participantId)

  const rows = ranks.map((r: { restaurant_id: string; rank: number }) => ({
    session_id: sessionId,
    participant_id: participantId,
    restaurant_id: r.restaurant_id,
    rank: r.rank,
  }))

  const { error } = await supabase.from('votes').insert(rows)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
