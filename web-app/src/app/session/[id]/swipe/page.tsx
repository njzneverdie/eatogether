'use client'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSessionStore } from '@/stores/useSessionStore'
import { useRealtimeChannel } from '@/hooks/useRealtimeChannel'
import { useRestaurants } from '@/hooks/useRestaurants'
import SwipeDeck from '@/components/swipe/SwipeDeck'

export default function SwipePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { sessionId, participantId, displayName, cuisineType } = useSessionStore()
  const { data: restaurants = [], isLoading } = useRestaurants(sessionId, cuisineType)
  const [matchedName, setMatchedName] = useState<string | null>(null)
  const [deckEmpty, setDeckEmpty] = useState(false)

  useEffect(() => {
    if (!sessionId) router.replace('/')
  }, [sessionId, router])

  const channelRef = useRealtimeChannel(sessionId, participantId, displayName, {
    onBroadcast: (event, payload) => {
      if (event === 'match') {
        const p = payload as { name: string }
        setMatchedName(p.name)
      }
    },
  })

  async function handleSwipe(restaurantId: string, direction: 'like' | 'nope') {
    const res = await fetch('/api/swipe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, participantId, restaurantId, direction }),
    })
    const data = await res.json()
    if (data.matched) {
      const name = restaurants.find((r) => r.id === restaurantId)?.name ?? '這間餐廳'
      setMatchedName(name)
      channelRef.current?.send({ type: 'broadcast', event: 'match', payload: { name, restaurantId } })
    }
  }

  if (!sessionId) return null

  if (isLoading) return (
    <main className="min-h-screen bg-[#f0f2f8] flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-2 border-[#1a1f36] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-[#8b95c4] text-sm">載入餐廳中…</p>
      </div>
    </main>
  )

  if (matchedName) return (
    <main className="min-h-screen bg-[#1a1f36] flex flex-col items-center justify-center p-6">
      <div className="text-center space-y-4 max-w-sm w-full">
        <div className="w-20 h-20 bg-[#22c55e]/20 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-10 h-10 text-[#22c55e]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
        <div>
          <p className="text-[#8b95c4] text-xs uppercase tracking-widest mb-2">配對成功</p>
          <h1 className="text-2xl font-bold text-white">{matchedName}</h1>
          <p className="text-[#8b95c4] text-sm mt-2">大家都喜歡這間</p>
        </div>
        <button
          onClick={() => router.push(`/session/${params.id}/result`)}
          className="w-full bg-[#f97316] hover:bg-[#ea6c0a] text-white font-bold py-4 rounded-2xl text-sm transition-colors mt-4"
        >
          查看餐廳詳情
        </button>
      </div>
    </main>
  )

  if (deckEmpty) return (
    <main className="min-h-screen bg-[#f0f2f8] flex flex-col items-center justify-center p-6 gap-5">
      <div className="w-16 h-16 bg-[#e4e7f0] rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-[#8b95c4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold text-[#1a1f36]">沒有配對成功</h2>
        <p className="text-[#8b95c4] text-sm mt-1">大家的口味不同，換個模式試試？</p>
      </div>
      <button
        onClick={() => router.push(`/session/${params.id}/mode`)}
        className="bg-white border border-[#e4e7f0] text-[#1a1f36] font-semibold py-3 px-6 rounded-2xl text-sm hover:border-[#1a1f36] transition-colors"
      >
        回模式選擇
      </button>
    </main>
  )

  return (
    <main className="min-h-screen bg-[#f0f2f8] flex flex-col">
      <div className="bg-[#1a1f36] px-6 pt-12 pb-8 rounded-b-[2rem]">
        <div className="max-w-sm mx-auto text-center">
          <p className="text-[#8b95c4] text-xs uppercase tracking-widest mb-1">交友軟體模式</p>
          <h1 className="text-xl font-bold text-white">喜歡就往右滑</h1>
          <p className="text-[#8b95c4] text-sm mt-1">全員喜歡才算配對</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center px-5 pt-6 pb-10 max-w-sm mx-auto w-full">
        <SwipeDeck restaurants={restaurants} onSwipe={handleSwipe} onDeckEmpty={() => setDeckEmpty(true)} />
      </div>
    </main>
  )
}
