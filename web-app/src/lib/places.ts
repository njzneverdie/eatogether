import type { Restaurant } from '@/types/domain'

export async function fetchRestaurants(params: {
  sessionId: string
  cuisineType: string
  lat: number
  lng: number
}): Promise<Restaurant[]> {
  const res = await fetch('/api/restaurants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) throw new Error('Failed to fetch restaurants')
  return res.json()
}
