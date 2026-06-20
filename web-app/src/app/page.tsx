'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSessionStore } from '@/stores/useSessionStore'
import { toast } from 'sonner'

function HomeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [displayName, setDisplayName] = useState('')
  const [roomCode, setRoomCode] = useState(searchParams.get('room') ?? '')
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'create' | 'join'>('create')
  const setSession = useSessionStore((s) => s.setSession)

  function getUserId(): string {
    let id = localStorage.getItem('eatogether_uid')
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('eatogether_uid', id)
    }
    return id
  }

  async function handleCreate() {
    if (!displayName.trim()) { toast.error('請輸入你的暱稱'); return }
    setLoading(true)
    try {
      const userId = getUserId()
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: displayName.trim(), userId }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const { session, participant } = await res.json()
      setSession({
        sessionId: session.id, roomCode: session.room_code,
        participantId: participant.id, displayName: participant.display_name,
        mode: session.mode, voteSubmode: session.vote_submode,
        cuisineType: session.cuisine_type, status: session.status,
      })
      router.push(`/session/${session.id}/lobby`)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin() {
    if (!displayName.trim()) { toast.error('請輸入你的暱稱'); return }
    if (!roomCode.trim()) { toast.error('請輸入房號'); return }
    setLoading(true)
    try {
      const userId = getUserId()
      const res = await fetch('/api/session/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: displayName.trim(), roomCode: roomCode.trim(), userId }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const { session, participant } = await res.json()
      setSession({
        sessionId: session.id, roomCode: session.room_code,
        participantId: participant.id, displayName: participant.display_name,
        mode: session.mode, voteSubmode: session.vote_submode,
        cuisineType: session.cuisine_type, status: session.status,
      })
      router.push(`/session/${session.id}/lobby`)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f0f2f8] flex flex-col">
      {/* Hero header */}
      <div className="bg-[#1a1f36] px-6 pt-14 pb-12 rounded-b-[2rem]">
        <div className="max-w-sm mx-auto text-center">
          {/* Logo mark */}
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">一起吃</h1>
          <p className="text-[#8b95c4] mt-1 text-sm">解決選擇障礙，一起決定今天吃什麼</p>
        </div>
      </div>

      <div className="flex-1 px-5 pt-6 pb-10 max-w-sm mx-auto w-full">
        {/* Nickname */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-[#1a1f36] uppercase tracking-wider mb-2">暱稱</label>
          <input
            type="text"
            placeholder="輸入你的暱稱…"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (tab === 'create' ? handleCreate() : handleJoin())}
            className="w-full bg-white border border-[#e4e7f0] rounded-xl px-4 py-3 text-[#1a1f36] placeholder-[#a0a8c0] text-sm focus:outline-none focus:border-[#1a1f36] transition-colors"
          />
        </div>

        {/* Tab switcher */}
        <div className="flex bg-white rounded-xl p-1 mb-5 border border-[#e4e7f0]">
          {(['create', 'join'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                tab === t ? 'bg-[#1a1f36] text-white shadow-sm' : 'text-[#8b95c4]'
              }`}
            >
              {t === 'create' ? '建立房間' : '加入房間'}
            </button>
          ))}
        </div>

        {/* Create */}
        {tab === 'create' && (
          <div className="bg-white rounded-2xl p-5 border border-[#e4e7f0] space-y-4">
            <p className="text-sm text-[#6b7280]">建立一個新房間，邀請朋友一起加入</p>
            {/* Feature icons */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', label: '轉盤' },
                { icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', label: '滑卡' },
                { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', label: '投票' },
              ].map((f) => (
                <div key={f.label} className="bg-[#f0f2f8] rounded-xl p-3 text-center">
                  <svg className="w-5 h-5 text-[#1a1f36] mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                  </svg>
                  <p className="text-[10px] font-semibold text-[#6b7280]">{f.label}</p>
                </div>
              ))}
            </div>
            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full bg-[#1a1f36] hover:bg-[#252b4a] disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm"
            >
              {loading ? '建立中…' : '建立新房間'}
            </button>
          </div>
        )}

        {/* Join */}
        {tab === 'join' && (
          <div className="bg-white rounded-2xl p-5 border border-[#e4e7f0] space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#1a1f36] uppercase tracking-wider mb-2">房間代碼</label>
              <input
                type="text"
                placeholder="A B C 1 2 3"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="w-full bg-[#f0f2f8] border border-[#e4e7f0] rounded-xl px-4 py-3.5 text-[#1a1f36] placeholder-[#c0c6da] text-center text-2xl font-mono tracking-[0.5em] font-bold focus:outline-none focus:border-[#1a1f36] transition-colors"
              />
            </div>
            <button
              onClick={handleJoin}
              disabled={loading}
              className="w-full bg-[#f97316] hover:bg-[#ea6c0a] disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm"
            >
              {loading ? '加入中…' : '加入房間'}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}

export default function Home() {
  return <Suspense><HomeContent /></Suspense>
}
