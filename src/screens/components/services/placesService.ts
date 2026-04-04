const GOOGLE_PLACES_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY!

if (!GOOGLE_PLACES_KEY) {
  throw new Error('Missing environment variable: EXPO_PUBLIC_GOOGLE_PLACES_KEY')
}

// --- 型別定義 ---

export interface Restaurant {
  place_id: string
  name: string
  vicinity: string
  rating: number
  price_level: number
  photo_reference: string
  lat: number
  lng: number
}

interface PlacesApiResult {
  place_id: string
  name: string
  vicinity: string
  rating?: number
  price_level?: number
  photos?: { photo_reference: string }[]
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
}

interface PlacesApiResponse {
  status: string
  results: PlacesApiResult[]
  error_message?: string
}

// --- 主要函數 ---

export async function searchRestaurants(
  lat: number,
  lng: number,
  radius: number,
  keyword: string
): Promise<Restaurant[]> {
  const url =
    `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
    `?location=${lat},${lng}` +
    `&radius=${radius}` +
    `&type=restaurant` +
    `&keyword=${encodeURIComponent(keyword)}` +
    `&key=${GOOGLE_PLACES_KEY}`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Google Places API 請求失敗：HTTP ${response.status}`)
  }

  const data: PlacesApiResponse = await response.json()

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(
      `Google Places API 錯誤：${data.status}${
        data.error_message ? ` — ${data.error_message}` : ''
      }`
    )
  }

  return data.results.map((item): Restaurant => ({
    place_id: item.place_id,
    name: item.name,
    vicinity: item.vicinity,
    rating: item.rating ?? 0,
    price_level: item.price_level ?? 0,
    photo_reference: item.photos?.[0]?.photo_reference ?? '',
    lat: item.geometry.location.lat,
    lng: item.geometry.location.lng,
  }))
}
