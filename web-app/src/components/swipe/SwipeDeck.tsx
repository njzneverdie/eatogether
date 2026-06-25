'use client'
import { useState } from 'react'
import SwipeCard from './SwipeCard'
import type { Restaurant } from '@/types/domain'

interface Props {
  restaurants: Restaurant[]
  onSwipe: (restaurantId: string, direction: 'like' | 'nope') => void
  onDeckEmpty: () => void
}

export default function SwipeDeck({ restaurants, onSwipe, onDeckEmpty }: Props) {
  const [index, setIndex] = useState(0)

  function handleSwipe(direction: 'like' | 'nope') {
    const r = restaurants[index]
    onSwipe(r.id, direction)
    const next = index + 1
    if (next >= restaurants.length) {
      onDeckEmpty()
    } else {
      setIndex(next)
    }
  }

  if (index >= restaurants.length) return null

  const visible = restaurants.slice(index, index + 3).reverse()
  const remaining = restaurants.length - index

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* Progress bar */}
      <div className="flex items-center gap-3 w-full max-w-sm">
        <div className="flex-1 h-1 bg-[#e8d8c0] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#3d2424] rounded-full transition-all duration-500"
            style={{ width: `${((restaurants.length - remaining) / restaurants.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-[#a08060] tabular-nums whitespace-nowrap">{remaining} 間</span>
      </div>

      {/* Card stack */}
      <div className="relative w-full max-w-sm h-[430px]">
        {visible.map((r, i) => {
          const isTop = i === visible.length - 1
          const offset = (visible.length - 1 - i) * 8
          return (
            <div
              key={r.id}
              className="absolute inset-0"
              style={{
                transform: `scale(${1 - offset * 0.018}) translateY(${offset}px)`,
                zIndex: i,
              }}
            >
              <SwipeCard restaurant={r} onSwipe={handleSwipe} isTop={isTop} />
            </div>
          )
        })}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-8">
        <button
          onClick={() => handleSwipe('nope')}
          aria-label="不喜歡"
          className="w-14 h-14 rounded-full bg-white border border-[#e8d8c0] text-[#ef4444] shadow-sm hover:border-[#ef4444] hover:bg-red-50 transition-all flex items-center justify-center"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center">
          <p className="text-[10px] text-[#a08060] leading-tight">左右滑動</p>
          <p className="text-[10px] text-[#a08060] leading-tight">或按鈕選擇</p>
        </div>

        <button
          onClick={() => handleSwipe('like')}
          aria-label="喜歡"
          className="w-14 h-14 rounded-full bg-[#22c55e] text-white shadow-sm hover:bg-[#16a34a] transition-all flex items-center justify-center"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
