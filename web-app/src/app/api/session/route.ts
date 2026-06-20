import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function POST(req: NextRequest) {
  const { displayName, userId } = await req.json()
  if (!displayName || !userId) {
    return NextResponse.json({ error: 'displayName and userId required' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const roomCode = generateRoomCode()

  // Update display name in profile (trigger already created the row on anonymous sign-in)
  await supabase.from('profiles').upsert(
    { id: userId, display_name: displayName },
    { onConflict: 'id' }
  )

  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .insert({ host_id: userId, room_code: roomCode, status: 'lobby' })
    .select()
    .single()

  if (sessionError || !session) {
    return NextResponse.json({ error: sessionError?.message }, { status: 500 })
  }

  const { data: participant, error: pError } = await supabase
    .from('participants')
    .insert({ session_id: session.id, user_id: userId, display_name: displayName })
    .select()
    .single()

  if (pError || !participant) {
    return NextResponse.json({ error: pError?.message }, { status: 500 })
  }

  return NextResponse.json({ session, participant })
}
