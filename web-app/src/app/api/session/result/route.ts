import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId')
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })

  const supabase = createServiceClient()

  const { data: session } = await supabase
    .from('sessions')
    .select('mode, result_place_id')
    .eq('id', sessionId)
    .single()

  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  // For swipe mode: look up restaurant by id
  if (session.mode === 'swipe' && session.result_place_id) {
    const { data: restaurant } = await supabase
      .from('session_restaurants')
      .select('id, name, rating, price_level, address, photo_ref')
      .eq('id', session.result_place_id)
      .single()
    return NextResponse.json({ mode: 'swipe', winner: restaurant })
  }

  // For vote mode: run aggregation then join restaurant details
  const { data: voteResults } = await supabase.rpc('get_vote_results', { p_session_id: sessionId })
  if (voteResults && voteResults.length > 0) {
    const ids = voteResults.map((r: { restaurant_id: string }) => r.restaurant_id)
    const { data: restaurants } = await supabase
      .from('session_restaurants')
      .select('id, photo_ref, address, rating, price_level')
      .in('id', ids)
    const detailMap = Object.fromEntries((restaurants ?? []).map((r) => [r.id, r]))
    const enriched = voteResults.map((r: { restaurant_id: string }) => ({
      ...r,
      ...(detailMap[r.restaurant_id] ?? {}),
    }))
    return NextResponse.json({ mode: 'vote', results: enriched })
  }
  return NextResponse.json({ mode: 'vote', results: voteResults ?? [] })
}
