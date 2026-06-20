'use client'
import { useQuery } from '@tanstack/react-query'
import type { Restaurant } from '@/types/domain'

async function getLocation(): Promise<{ lat: number; lng: number }> {
  const FALLBACK = { lat: 25.0478, lng: 121.5319 } // 台北預設
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(FALLBACK); return }
    const timer = setTimeout(() => resolve(FALLBACK), 5000)
    navigator.geolocation.getCurrentPosition(
      (pos) => { clearTimeout(timer); resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }) },
      () => { clearTimeout(timer); resolve(FALLBACK) },
      { timeout: 5000 }
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
        const errText = await seedRes.text()
        console.error('[useRestaurants] seed failed', errText)
        throw new Error(`餐廳搜尋失敗：${errText.slice(0, 100)}`)
      }

      // Re-fetch from DB (has proper IDs)
      const refetch = await fetch(`/api/restaurants/list?sessionId=${sessionId}`)
      const result: Restaurant[] = await refetch.json()
      if (!Array.isArray(result) || result.length === 0) {
        throw new Error('附近找不到符合的餐廳，請確認位置權限或稍後再試')
      }
      return result
    },
  })
}
