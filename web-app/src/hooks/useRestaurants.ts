'use client'
import { useQuery } from '@tanstack/react-query'
import type { Restaurant } from '@/types/domain'

async function getLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ lat: 22.6273, lng: 120.3014 }) // 高雄預設
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve({ lat: 22.6273, lng: 120.3014 })
    )
  })
}

export function useRestaurants(sessionId: string | null, cuisineType: string | null = null) {
  return useQuery({
    queryKey: ['restaurants', sessionId],
    enabled: !!sessionId,
    queryFn: async (): Promise<Restaurant[]> => {
      // Check if already seeded
      const listRes = await fetch(`/api/restaurants/list?sessionId=${sessionId}`)
      const existing: Restaurant[] = await listRes.json()
      if (existing.length > 0) return existing

      // Need to seed — get location first
      const { lat, lng } = await getLocation()

      const seedRes = await fetch('/api/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          cuisineType: cuisineType ?? '餐廳',
          lat,
          lng,
        }),
      })

      if (!seedRes.ok) {
        console.error('[useRestaurants] seed failed', await seedRes.text())
        return []
      }

      // Re-fetch from DB (has proper IDs)
      const refetch = await fetch(`/api/restaurants/list?sessionId=${sessionId}`)
      return refetch.json()
    },
  })
}
