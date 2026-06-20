import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// Save participant location
export async function POST(req: NextRequest) {
  const { participantId, lat, lng } = await req.json()
  if (!participantId || lat == null || lng == null) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // PostGIS point format
  const { error } = await supabase
    .from('participants')
    .update({ location: `POINT(${lng} ${lat})`, is_ready: true })
    .eq('id', participantId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// Compute midpoint and fetch nearby restaurants
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId')
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })

  const supabase = createServiceClient()

  // Get all participant locations
  const { data: participants } = await supabase
    .from('participants')
    .select('location')
    .eq('session_id', sessionId)
    .not('location', 'is', null)

  if (!participants || participants.length === 0) {
    return NextResponse.json({ error: 'No locations yet' }, { status: 400 })
  }

  // Use RPC to compute PostGIS midpoint
  const { data: midpoint } = await supabase
    .rpc('compute_midpoint', { p_session: sessionId })

  // Parse geography string "POINT(lng lat)"
  let lat = 22.6273, lng = 120.3014
  if (midpoint) {
    const match = String(midpoint).match(/POINT\(([^ ]+) ([^ )]+)\)/)
    if (match) { lng = parseFloat(match[1]); lat = parseFloat(match[2]) }
  }

  return NextResponse.json({ lat, lng, participantCount: participants.length })
}
