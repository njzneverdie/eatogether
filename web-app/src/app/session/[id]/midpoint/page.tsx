'use client'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useSessionStore } from '@/stores/useSessionStore'
import { useRealtimeChannel } from '@/hooks/useRealtimeChannel'
import { useGeolocation } from '@/hooks/useGeolocation'
import RestaurantCard from '@/components/shared/RestaurantCard'
import type { Restaurant } from '@/types/domain'
import { toast } from 'sonner'

const MidpointMap = dynamic(() => import('@/components/map/MidpointMap'), { ssr: false })

export default function MidpointPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { sessionId, participantId, displayName, cuisineType } = useSessionStore()
  const geo = useGeolocation()

  const [phase, setPhase] = useState<'collecting' | 'map'>('collecting')
  const [midpoint, setMidpoint] = useState<{ lat: number; lng: number } | null>(null)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selected, setSelected] = useState<Restaurant | null>(null)
  const [readyCount, setReadyCount] = useState(0)
  const [totalCount, setTotalCount] = useState(1)
  const [locationSent, setLocationSent] = useState(false)

  useEffect(() => {
    if (!sessionId) router.replace('/')
  }, [sessionId, router])

  const channelRef = useRealtimeChannel(sessionId, participantId, displayName, {
    onPresenceSync: (state) => {
      const all = Object.values(state).flat() as Array<{ is_ready?: boolean }>
      setTotalCount(Object.keys(state).length || 1)
      setReadyCount(all.filter((p) => p.is_ready).length)
    },
    onBroadcast: (event, payload) => {
      if (event === 'show_map') {
        const p = payload as { lat: number; lng: number; restaurants: Restaurant[] }
        setMidpoint({ lat: p.lat, lng: p.lng })
        setRestaurants(p.restaurants)
        setPhase('map')
      }
      if (event === 'go_result') router.push(`/session/${params.id}/result`)
    },
  })

  useEffect(() => {
    if (!geo.lat || !geo.lng || locationSent || !participantId) return
    setLocationSent(true)
    fetch('/api/midpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId, lat: geo.lat, lng: geo.lng }),
    }).then(() => {
      channelRef.current?.track({ display_name: displayName, is_ready: true })
      toast.success('位置已分享')
    })
  }, [geo.lat, geo.lng, locationSent, participantId])

  async function handleComputeMidpoint() {
    const res = await fetch(`/api/midpoint?sessionId=${sessionId}`)
    if (!res.ok) { toast.error('需要至少一個人分享位置'); return }
    const { lat, lng } = await res.json()

    await fetch('/api/restaurants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, cuisineType: cuisineType ?? '餐廳', lat, lng }),
    })

    const listRes = await fetch(`/api/restaurants/list?sessionId=${sessionId}`)
    const rList: Restaurant[] = await listRes.json()

    setMidpoint({ lat, lng })
    setRestaurants(rList)
    setPhase('map')

    channelRef.current?.send({
      type: 'broadcast',
      event: 'show_map',
      payload: { lat, lng, restaurants: rList },
    })
  }

  async function handleConfirm() {
    if (!selected) { toast.error('請先選擇一間餐廳'); return }
    await fetch('/api/session/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        updates: { result_place_id: selected.id, status: 'done', mode: 'midpoint' },
      }),
    })
    channelRef.current?.send({ type: 'broadcast', event: 'go_result', payload: {} })
    router.push(`/session/${params.id}/result`)
  }

  if (!sessionId) return null

  if (phase === 'collecting') return (
    <main className="min-h-screen bg-[#f5ede0] flex flex-col">
      <div className="bg-[#3d2424] px-6 pt-12 pb-8 rounded-b-[2rem]">
        <div className="max-w-sm mx-auto text-center">
          <p className="text-[#a08060] text-xs uppercase tracking-widest mb-1">中點模式</p>
          <h1 className="text-2xl font-bold text-white">分享你的位置</h1>
          <p className="text-[#a08060] text-sm mt-1">找你們的幾何中點附近的餐廳</p>
        </div>
      </div>

      <div className="flex-1 px-5 pt-6 pb-10 max-w-sm mx-auto w-full space-y-4">
        <div className="bg-white rounded-2xl p-5 border border-[#e8d8c0] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#8b6b4e]">已分享位置</span>
            <span className="text-sm font-bold text-[#3d2424] tabular-nums">{readyCount} / {totalCount} 人</span>
          </div>
          <div className="h-1.5 bg-[#e8d8c0] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#3d2424] rounded-full transition-all"
              style={{ width: `${totalCount > 0 ? (readyCount / totalCount) * 100 : 0}%` }}
            />
          </div>

          {!locationSent ? (
            <button
              onClick={() => geo.request()}
              disabled={geo.loading}
              className="w-full bg-[#3d2424] hover:bg-[#4d3030] disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {geo.loading ? '取得位置中…' : '分享我的位置'}
            </button>
          ) : (
            <div className="flex items-center gap-2 justify-center py-1">
              <svg className="w-4 h-4 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-semibold text-[#22c55e]">位置已分享</span>
            </div>
          )}

          {geo.error && <p className="text-xs text-red-500">{geo.error}</p>}
        </div>

        <button
          onClick={handleComputeMidpoint}
          disabled={readyCount === 0 && !locationSent}
          className="w-full bg-[#cda368] hover:bg-[#ea6c0a] disabled:opacity-40 text-white font-bold py-4 rounded-2xl text-sm transition-colors"
        >
          計算中點，搜尋餐廳
        </button>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-[#f5ede0] flex flex-col">
      <div className="bg-[#3d2424] px-6 pt-12 pb-8 rounded-b-[2rem]">
        <div className="max-w-sm mx-auto text-center">
          <p className="text-[#a08060] text-xs uppercase tracking-widest mb-1">你們的中點附近</p>
          <h1 className="text-xl font-bold text-white">選擇一間餐廳</h1>
        </div>
      </div>

      <div className="flex-1 px-5 pt-6 pb-10 max-w-sm mx-auto w-full space-y-4">
        {midpoint && (
          <div className="rounded-2xl overflow-hidden border border-[#e8d8c0]">
            <MidpointMap midpoint={midpoint} restaurants={restaurants} onSelect={setSelected} selected={selected} />
          </div>
        )}

        <div className="space-y-2">
          {restaurants.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelected(r)}
              className={`w-full text-left transition-all ${selected?.id === r.id ? 'ring-2 ring-[#3d2424] rounded-2xl' : ''}`}
            >
              <RestaurantCard restaurant={r} compact />
            </button>
          ))}
        </div>

        <button
          onClick={handleConfirm}
          disabled={!selected}
          className="w-full bg-[#3d2424] hover:bg-[#4d3030] disabled:opacity-40 text-white font-bold py-4 rounded-2xl text-sm transition-colors"
        >
          {selected ? `就選「${selected.name}」` : '請先選擇一間餐廳'}
        </button>
      </div>
    </main>
  )
}
