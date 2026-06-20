import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { Json } from '@/types/database'

const CUISINE_TYPE_MAP: Record<string, string> = {
  火鍋: 'hot_pot_restaurant',
  燒肉: 'barbecue_restaurant',
  拉麵: 'ramen_restaurant',
  壽司: 'sushi_restaurant',
  炸雞: 'chicken_wings_restaurant',
  牛排: 'steak_house',
  炒飯: 'chinese_restaurant',
  餃子: 'chinese_restaurant',
  披薩: 'pizza_restaurant',
  麻辣燙: 'chinese_restaurant',
  滷肉飯: 'taiwanese_restaurant',
  串燒: 'japanese_restaurant',
  // legacy fallbacks
  日式: 'japanese_restaurant',
  韓式: 'korean_restaurant',
  義式: 'italian_restaurant',
  美式: 'american_restaurant',
  中式: 'chinese_restaurant',
  泰式: 'thai_restaurant',
  台式: 'taiwanese_restaurant',
}

interface PlacesResult {
  id: string
  displayName: { text: string }
  formattedAddress: string
  rating?: number
  priceLevel?: string
  photos?: Array<{ name: string }>
  location: { latitude: number; longitude: number }
}

const PRICE_LEVEL_MAP: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
}

export async function POST(req: NextRequest) {
  const { sessionId, cuisineType, lat, lng } = await req.json()

  if (!sessionId || lat == null || lng == null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Google Places API key not configured' }, { status: 500 })
  }

  const includedType = CUISINE_TYPE_MAP[cuisineType] ?? 'restaurant'

  // Places API (New) — Nearby Search
  const placesRes = await fetch(
    'https://places.googleapis.com/v1/places:searchNearby',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask':
          'places.id,places.displayName,places.formattedAddress,places.rating,places.priceLevel,places.photos,places.location',
        'Accept-Language': 'zh-TW',
      },
      body: JSON.stringify({
        includedTypes: [includedType],
        maxResultCount: 10,
        rankPreference: 'POPULARITY',
        locationRestriction: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: 1500,
          },
        },
      }),
    }
  )

  if (!placesRes.ok) {
    const err = await placesRes.text()
    console.error('[Places API]', err)
    return NextResponse.json({ error: 'Places API error', detail: err }, { status: 502 })
  }

  const { places = [] }: { places: PlacesResult[] } = await placesRes.json()

  const supabase = createServiceClient()

  const rows = places.map((p) => ({
    session_id: sessionId,
    place_id: p.id,
    name: p.displayName.text,
    address: p.formattedAddress,
    rating: p.rating ?? null,
    price_level: p.priceLevel ? (PRICE_LEVEL_MAP[p.priceLevel] ?? null) : null,
    photo_ref: p.photos?.[0]?.name ?? null,
    cuisine_type: cuisineType,
    data: p as unknown as Json,
  }))

  if (rows.length > 0) {
    await supabase
      .from('session_restaurants')
      .upsert(rows, { onConflict: 'session_id,place_id' })
  }

  return NextResponse.json(rows.map((r) => ({ ...r, id: r.place_id })))
}
