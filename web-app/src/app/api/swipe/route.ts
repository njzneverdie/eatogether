import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { sessionId, participantId, restaurantId, direction } = await req.json()

  if (!sessionId || !participantId || !restaurantId || !direction) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Record the swipe
  await supabase.from('swipes').upsert(
    { session_id: sessionId, participant_id: participantId, restaurant_id: restaurantId, direction },
    { onConflict: 'participant_id,restaurant_id' }
  )

  if (direction === 'nope') {
    return NextResponse.json({ matched: false })
  }

  // Check if all participants liked this restaurant
  const { count: totalCount } = await supabase
    .from('participants')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId)

  const { count: likeCount } = await supabase
    .from('swipes')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId)
    .eq('restaurant_id', restaurantId)
    .eq('direction', 'like')

  if (likeCount != null && totalCount != null && likeCount >= totalCount) {
    // Match! Record it
    await supabase
      .from('matches')
      .upsert({ session_id: sessionId, restaurant_id: restaurantId }, { onConflict: 'session_id' })

    await supabase
      .from('sessions')
      .update({ result_place_id: restaurantId, status: 'done' })
      .eq('id', sessionId)

    return NextResponse.json({ matched: true, restaurantId })
  }

  return NextResponse.json({ matched: false })
}
