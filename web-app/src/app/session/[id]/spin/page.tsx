'use client'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import SpinWheel from '@/components/wheel/SpinWheel'
import { useSessionStore } from '@/stores/useSessionStore'
import { useUIStore } from '@/stores/useUIStore'
import { useRealtimeChannel } from '@/hooks/useRealtimeChannel'

export default function SpinPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { sessionId, participantId, displayName, setCuisineType } = useSessionStore()
  const { spinResult, setSpinResult } = useUIStore()
  const saving = useRef(false)

  const channelRef = useRealtimeChannel(sessionId, participantId, displayName, {
    onBroadcast: (event, payload) => {
      if (event === 'cuisine_decided') {
        const p = payload as { cuisine: string }
        setCuisineType(p.cuisine)
        setSpinResult(p.cuisine)
      }
      if (event === 'phase_change') {
        const p = payload as { phase: string }
        if (p.phase === 'mode') router.push(`/session/${params.id}/mode`)
      }
    },
  })

  useEffect(() => {
    if (!sessionId) router.replace('/')
  }, [sessionId, router])

  async function handleResult(cuisine: string) {
    if (saving.current) return
    saving.current = true
    setSpinResult(cuisine)
    setCuisineType(cuisine)
    await fetch('/api/session/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, updates: { cuisine_type: cuisine, status: 'picking' } }),
    })
    channelRef.current?.send({ type: 'broadcast', event: 'cuisine_decided', payload: { cuisine } })
  }

  function handleContinue() {
    channelRef.current?.send({ type: 'broadcast', event: 'phase_change', payload: { phase: 'mode' } })
    router.push(`/session/${params.id}/mode`)
  }

  if (!sessionId) return null

  return (
    <main className="min-h-screen bg-[#f5ede0] flex flex-col">
      <div className="bg-[#3d2424] px-6 pt-12 pb-8 rounded-b-[2rem]">
        <div className="max-w-sm mx-auto text-center">
          <p className="text-[#a08060] text-xs uppercase tracking-widest mb-1">轉盤決定</p>
          <h1 className="text-2xl font-bold text-white">今天吃什麼？</h1>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center px-5 pt-6 pb-10 max-w-sm mx-auto w-full">
        <div className="bg-white rounded-3xl p-6 border border-[#e8d8c0] w-full flex items-center justify-center mb-5">
          <SpinWheel onResult={handleResult} />
        </div>

        {spinResult ? (
          <div className="w-full space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-[#e8d8c0] text-center">
              <p className="text-xs text-[#a08060] uppercase tracking-widest mb-2">決定了</p>
              <p className="text-3xl font-bold text-[#3d2424]">{spinResult}</p>
            </div>
            <button
              onClick={handleContinue}
              className="w-full bg-[#cda368] hover:bg-[#ea6c0a] text-white font-bold py-4 rounded-2xl text-sm transition-colors"
            >
              繼續選餐廳
              <svg className="w-4 h-4 inline ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        ) : (
          <p className="text-sm text-[#a0a8c0]">點擊轉盤或按鈕開始旋轉</p>
        )}
      </div>
    </main>
  )
}
