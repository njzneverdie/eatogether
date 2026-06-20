'use client'
import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useSessionStore } from '@/stores/useSessionStore'
import { useRealtimeChannel } from '@/hooks/useRealtimeChannel'
import { useRestaurants } from '@/hooks/useRestaurants'
import RankBallot from '@/components/vote/RankBallot'
import type { Restaurant } from '@/types/domain'
import { toast } from 'sonner'

export default function VotePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { sessionId, participantId, displayName, voteSubmode, cuisineType } = useSessionStore()
  const { data: restaurants = [], isLoading } = useRestaurants(sessionId, cuisineType)
  const [ordered, setOrdered] = useState<Restaurant[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [votedCount, setVotedCount] = useState(0)
  const [totalCount, setTotalCount] = useState(1)
  const [seatIndex, setSeatIndex] = useState(0)
  const [seatOrders, setSeatOrders] = useState<Restaurant[][]>([])

  useEffect(() => {
    if (restaurants.length > 0) setOrdered([...restaurants])
  }, [restaurants])

  useEffect(() => {
    if (!sessionId) router.replace('/')
  }, [sessionId, router])

  const channelRef = useRealtimeChannel(sessionId, participantId, displayName, {
    onPresenceSync: (state) => setTotalCount(Object.keys(state).length || 1),
    onBroadcast: (event) => {
      if (event === 'voted') setVotedCount((c) => c + 1)
      if (event === 'go_results') router.push(`/session/${params.id}/result`)
    },
  })

  async function submitVote(restaurantOrder: Restaurant[]) {
    const top3 = restaurantOrder.slice(0, 3)
    const ranks = top3.map((r, i) => ({ restaurant_id: r.id, rank: (i + 1) as 1 | 2 | 3 }))
    const res = await fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, participantId, ranks }),
    })
    if (!res.ok) { toast.error('投票失敗'); return false }
    return true
  }

  async function handleOnlineSubmit() {
    const ok = await submitVote(ordered)
    if (!ok) return
    setSubmitted(true)
    channelRef.current?.send({ type: 'broadcast', event: 'voted', payload: {} })
    toast.success('投票完成，等待其他人…')
  }

  useEffect(() => {
    if (voteSubmode === 'online' && votedCount > 0 && votedCount >= totalCount) {
      channelRef.current?.send({ type: 'broadcast', event: 'go_results', payload: {} })
      router.push(`/session/${params.id}/result`)
    }
  }, [votedCount, totalCount, voteSubmode])

  async function handlePassSubmit() {
    const newOrders = [...seatOrders, ordered]
    setSeatOrders(newOrders)
    if (seatIndex + 1 < totalCount) {
      setSeatIndex(seatIndex + 1)
      setOrdered([...restaurants])
    } else {
      for (let i = 0; i < newOrders.length; i++) {
        const seatParticipantId = `${participantId}_seat${i}`
        const top3 = newOrders[i].slice(0, 3)
        const ranks = top3.map((r, j) => ({ restaurant_id: r.id, rank: (j + 1) as 1 | 2 | 3 }))
        await fetch('/api/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, participantId: seatParticipantId, ranks }),
        })
      }
      router.push(`/session/${params.id}/result`)
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

  if (voteSubmode === 'online' && submitted) return (
    <main className="min-h-screen bg-[#f0f2f8] flex flex-col items-center justify-center p-6 gap-5">
      <div className="bg-white rounded-3xl p-8 border border-[#e4e7f0] text-center max-w-sm w-full space-y-4">
        <div className="w-16 h-16 bg-[#e8f5e9] rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#1a1f36]">投票完成</h2>
          <p className="text-[#8b95c4] text-sm mt-1">等待其他人投票中</p>
        </div>
        <div className="bg-[#f0f2f8] rounded-xl py-3 px-4 flex items-center justify-center gap-2">
          <span className="text-2xl font-bold text-[#1a1f36] tabular-nums">{votedCount}</span>
          <span className="text-[#8b95c4]">/</span>
          <span className="text-2xl font-bold text-[#1a1f36] tabular-nums">{totalCount}</span>
          <span className="text-[#8b95c4] text-sm">人</span>
        </div>
      </div>
    </main>
  )

  const isPassMode = voteSubmode === 'pass'

  return (
    <main className="min-h-screen bg-[#f0f2f8] flex flex-col">
      <div className="bg-[#1a1f36] px-6 pt-12 pb-8 rounded-b-[2rem]">
        <div className="max-w-sm mx-auto text-center">
          {isPassMode && (
            <div className="flex items-center justify-center gap-1.5 mb-2">
              {Array.from({ length: totalCount }, (_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${i <= seatIndex ? 'bg-[#f97316]' : 'bg-white/20'}`}
                  style={{ width: `${Math.min(48 / totalCount, 20)}px` }}
                />
              ))}
            </div>
          )}
          <p className="text-[#8b95c4] text-xs uppercase tracking-widest mb-1">
            {isPassMode ? `第 ${seatIndex + 1} / ${totalCount} 位` : '線上投票'}
          </p>
          <h1 className="text-xl font-bold text-white">排出你的前三名</h1>
          <p className="text-[#8b95c4] text-xs mt-1">第 1 名 +5 分 · 第 2 名 +3 分 · 第 3 名 +1 分</p>
        </div>
      </div>

      <div className="flex-1 px-5 pt-6 pb-10 max-w-sm mx-auto w-full space-y-4">
        <div className="bg-white rounded-2xl border border-[#e4e7f0] overflow-hidden">
          <RankBallot restaurants={ordered} onChange={setOrdered} />
        </div>

        <button
          onClick={isPassMode ? handlePassSubmit : handleOnlineSubmit}
          className="w-full bg-[#1a1f36] hover:bg-[#252b4a] text-white font-bold py-4 rounded-2xl text-sm transition-colors"
        >
          {isPassMode
            ? seatIndex + 1 < totalCount ? '確認，傳給下一位' : '確認，看結果'
            : '確認投票'}
        </button>
      </div>
    </main>
  )
}
