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

  if (cuisineType) query = query.eq('cuisine_type', cuisineType)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
