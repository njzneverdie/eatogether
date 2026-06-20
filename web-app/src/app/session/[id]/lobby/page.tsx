'use client'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSessionStore } from '@/stores/useSessionStore'
import { useRealtimeChannel } from '@/hooks/useRealtimeChannel'
import ShareRoom from '@/components/shared/ShareRoom'
import PresenceBar from '@/components/shared/PresenceBar'
import type { ParticipantPresence } from '@/types/domain'

export default function LobbyPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { sessionId, roomCode, participantId, displayName } = useSessionStore()
  const [presence, setPresence] = useState<ParticipantPresence[]>([])

  const channelRef = useRealtimeChannel(sessionId, participantId, displayName, {
    onPresenceSync: (state) => {
      const list = Object.values(state).flat() as ParticipantPresence[]
      setPresence(list)
    },
    onBroadcast: (event) => {
      if (event === 'phase_change') router.push(`/session/${params.id}/spin`)
    },
  })

  function handleStart() {
    channelRef.current?.send({ type: 'broadcast', event: 'phase_change', payload: { phase: 'spin' } })
    router.push(`/session/${params.id}/spin`)
  }

  useEffect(() => {
    if (!sessionId) router.replace('/')
  }, [sessionId, router])

  if (!sessionId) return null

  return (
    <main className="min-h-screen bg-[#f0f2f8] flex flex-col">
      <div className="bg-[#1a1f36] px-6 pt-12 pb-8 rounded-b-[2rem]">
        <div className="max-w-sm mx-auto text-center">
          <p className="text-[#8b95c4] text-xs uppercase tracking-widest mb-2">房間代碼</p>
          <h1 className="text-4xl font-bold text-white font-mono tracking-[0.3em]">{roomCode}</h1>
          <p className="text-[#8b95c4] text-sm mt-2">分享給朋友加入</p>
        </div>
      </div>

      <div className="flex-1 px-5 pt-6 pb-10 max-w-sm mx-auto w-full space-y-4">
        {roomCode && (
          <div className="bg-white rounded-2xl p-4 border border-[#e4e7f0]">
            <ShareRoom roomCode={roomCode} sessionId={params.id} />
          </div>
        )}

        <div className="bg-white rounded-2xl p-5 border border-[#e4e7f0]">
          <p className="text-xs font-semibold text-[#1a1f36] uppercase tracking-wider mb-3">
            已加入 · {presence.length} 人
          </p>
          {presence.length > 0 ? (
            <PresenceBar presence={presence} />
          ) : (
            <div className="flex items-center gap-3 py-3">
              <div className="w-8 h-8 rounded-full bg-[#e8eaf2] animate-pulse" />
              <p className="text-sm text-[#a0a8c0]">等待朋友加入…</p>
            </div>
          )}
        </div>

        <div className="bg-[#fffcf0] border border-[#f0e4b0] rounded-2xl p-4 flex gap-3 items-start">
          <svg className="w-4 h-4 text-[#92400e] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-[#92400e] leading-snug">人到齊了再按開始，所有人會同步進入轉盤</p>
        </div>

        <button
          onClick={handleStart}
          className="w-full bg-[#1a1f36] hover:bg-[#252b4a] text-white font-bold py-4 rounded-2xl text-base transition-colors"
        >
          開始
        </button>
      </div>
    </main>
  )
}
