import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const sessionId = searchParams.get('sessionId')
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })

  const cuisineType = searchParams.get('cuisineType')

  const supabase = createServiceClient()
  let query = supabase
    .from('session_restaurants')
    .select('id, place_id, name, rating, price_level, photo_ref, address, cuisine_type')
    .eq('session_id', sessionId)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (cuisineType) query = (query as any).eq('cuisine_type', cuisineType)

  const { data, error } = await query.order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
