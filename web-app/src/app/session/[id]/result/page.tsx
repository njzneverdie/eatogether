'use client'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSessionStore } from '@/stores/useSessionStore'
import RestaurantCard from '@/components/shared/RestaurantCard'
import ResultBoard from '@/components/vote/ResultBoard'
import type { VoteResult, Restaurant } from '@/types/domain'

export default function ResultPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { sessionId } = useSessionStore()
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<string | null>(null)
  const [winner, setWinner] = useState<Restaurant | null>(null)
  const [results, setResults] = useState<VoteResult[]>([])

  useEffect(() => {
    if (!sessionId) { router.replace('/'); return }
    fetch(`/api/session/result?sessionId=${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        setMode(data.mode)
        if (data.mode === 'swipe') setWinner(data.winner)
        else setResults(data.results ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [sessionId, router])

  const displayName = mode === 'swipe' ? winner?.name : results[0]?.name

  if (loading) return (
    <main className="min-h-screen bg-[#f0f2f8] flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-2 border-[#1a1f36] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-[#8b95c4] text-sm">計算結果中…</p>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-[#f0f2f8] flex flex-col">
      <div className="bg-[#1a1f36] px-6 pt-12 pb-10 rounded-b-[2rem]">
        <div className="max-w-sm mx-auto text-center">
          <div className="w-16 h-16 bg-[#f97316]/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-[#f97316]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <p className="text-[#8b95c4] text-xs uppercase tracking-widest mb-1">今天就吃這個</p>
          {displayName && (
            <h1 className="text-2xl font-bold text-white">{displayName}</h1>
          )}
        </div>
      </div>

      <div className="flex-1 px-5 pt-6 pb-10 max-w-sm mx-auto w-full space-y-4">
        {mode === 'swipe' && winner && (
          <RestaurantCard restaurant={winner} showMapLink />
        )}

        {mode === 'vote' && results.length > 0 && (
          <>
            {results[0] && (
              <RestaurantCard
                restaurant={{
                  id: results[0].restaurant_id,
                  place_id: results[0].restaurant_id,
                  name: results[0].name,
                  rating: results[0].rating ?? null,
                  price_level: results[0].price_level ?? null,
                  photo_ref: results[0].photo_ref ?? null,
                  address: results[0].address ?? null,
                }}
                rank={0}
                score={results[0].score}
                showMapLink
              />
            )}
            {results.length > 1 && (
              <div className="bg-white rounded-2xl border border-[#e4e7f0] overflow-hidden">
                <div className="px-4 pt-4 pb-1">
                  <p className="text-xs font-semibold text-[#8b95c4] uppercase tracking-wider">完整排名</p>
                </div>
                <div className="p-3 space-y-2">
                  <ResultBoard results={results} />
                </div>
              </div>
            )}
          </>
        )}

        {displayName && (
          <div className="space-y-3 pt-1">
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: '一起吃', text: `今天決定吃 ${displayName}！` })
                } else {
                  navigator.clipboard.writeText(`今天決定吃 ${displayName}！`)
                }
              }}
              className="w-full bg-white hover:bg-[#f0f2f8] text-[#1a1f36] font-semibold py-3.5 rounded-2xl text-sm border border-[#e4e7f0] transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              分享結果
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full text-[#8b95c4] hover:text-[#1a1f36] font-medium py-3 text-sm transition-colors"
            >
              回首頁，再玩一次
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
