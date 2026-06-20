import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#f0f2f8] flex flex-col items-center justify-center gap-4 p-6">
      <div className="w-16 h-16 bg-[#e8eaf2] rounded-full flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-[#8b95c4]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-[#1a1f36]">找不到頁面</h2>
      <Link
        href="/"
        className="bg-[#1a1f36] hover:bg-[#252b4a] text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
      >
        回首頁
      </Link>
    </main>
  )
}
