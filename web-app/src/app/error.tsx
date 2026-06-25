'use client'
import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <main className="min-h-screen bg-[#f5ede0] flex flex-col items-center justify-center gap-4 p-6">
      <div className="w-16 h-16 bg-[#fde8e8] rounded-full flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-[#ef4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-[#3d2424]">出錯了</h2>
      <p className="text-sm text-[#a08060] text-center">{error.message}</p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="bg-[#3d2424] hover:bg-[#4d3030] text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
        >
          重試
        </button>
        <button
          onClick={() => window.location.href = '/'}
          className="bg-white border border-[#e8d8c0] text-[#3d2424] font-semibold px-5 py-2.5 rounded-xl text-sm hover:border-[#3d2424] transition-colors"
        >
          回首頁
        </button>
      </div>
    </main>
  )
}
