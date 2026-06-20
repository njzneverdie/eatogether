'use client'
import { useParams, useRouter } from 'next/navigation'
import { useSessionStore } from '@/stores/useSessionStore'
import type { SessionMode, VoteSubmode } from '@/types/domain'

const MODES: {
  id: SessionMode
  submode?: VoteSubmode
  icon: string
  title: string
  desc: string
  accentBg: string
  accentText: string
}[] = [
  {
    id: 'swipe',
    icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    title: '交友軟體模式',
    desc: '像交友 App 一樣滑卡，全員喜歡才算配對',
    accentBg: '#fde8f0',
    accentText: '#be185d',
  },
  {
    id: 'midpoint',
    icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
    title: '中點模式',
    desc: '計算大家位置的幾何中點，找最近的餐廳',
    accentBg: '#e8f0fd',
    accentText: '#1d4ed8',
  },
  {
    id: 'vote',
    submode: 'pass',
    icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z',
    title: '同機投票',
    desc: '傳手機輪流投，排出前三名，加權計分',
    accentBg: '#fdf6e8',
    accentText: '#92400e',
  },
  {
    id: 'vote',
    submode: 'online',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    title: '線上投票',
    desc: '各用自己手機，匿名投出前三名',
    accentBg: '#edfde8',
    accentText: '#166534',
  },
]

export default function ModePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const setMode = useSessionStore((s) => s.setMode)

  function choose(mode: SessionMode, submode?: VoteSubmode) {
    setMode(mode, submode)
    if (mode === 'swipe') router.push(`/session/${params.id}/swipe`)
    else if (mode === 'midpoint') router.push(`/session/${params.id}/midpoint`)
    else router.push(`/session/${params.id}/vote`)
  }

  return (
    <main className="min-h-screen bg-[#f0f2f8] flex flex-col">
      <div className="bg-[#1a1f36] px-6 pt-12 pb-8 rounded-b-[2rem]">
        <div className="max-w-sm mx-auto text-center">
          <p className="text-[#8b95c4] text-xs uppercase tracking-widest mb-1">第二步</p>
          <h1 className="text-2xl font-bold text-white">選擇決策模式</h1>
        </div>
      </div>

      <div className="flex-1 px-5 pt-6 pb-10 max-w-sm mx-auto w-full space-y-3">
        <p className="text-xs text-[#8b95c4] uppercase tracking-wider font-semibold mb-1">選一個適合的方式</p>
        {MODES.map((m) => (
          <button
            key={`${m.id}-${m.submode}`}
            onClick={() => choose(m.id, m.submode)}
            className="w-full bg-white rounded-2xl border border-[#e4e7f0] p-4 flex items-center gap-4 text-left hover:border-[#1a1f36] hover:shadow-sm transition-all active:scale-[0.98]"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: m.accentBg }}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} style={{ color: m.accentText }}>
                <path strokeLinecap="round" strokeLinejoin="round" d={m.icon} />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[#1a1f36] text-sm">{m.title}</p>
              <p className="text-xs text-[#8b95c4] mt-0.5 leading-snug">{m.desc}</p>
            </div>
            <svg className="w-4 h-4 text-[#c8cfe8] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>
    </main>
  )
}
