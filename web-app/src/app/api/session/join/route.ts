import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { roomCode, displayName, userId } = await req.json()
  if (!roomCode || !displayName || !userId) {
    return NextResponse.json({ error: 'roomCode, displayName and userId required' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Ensure profile exists
  await supabase.from('profiles').upsert(
    { id: userId, display_name: displayName },
    { onConflict: 'id' }
  )

  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select()
    .eq('room_code', roomCode.toUpperCase())
    .not('status', 'in', '("done","cancelled")')
    .single()

  if (sessionError || !session) {
    return NextResponse.json({ error: '找不到房間，請確認房號' }, { status: 404 })
  }

  const { data: participant, error: pError } = await supabase
    .from('participants')
    .upsert(
      { session_id: session.id, user_id: userId, display_name: displayName },
      { onConflict: 'session_id,user_id' }
    )
    .select()
    .single()

  if (pError || !participant) {
    return NextResponse.json({ error: pError?.message }, { status: 500 })
  }

  return NextResponse.json({ session, participant })
}
