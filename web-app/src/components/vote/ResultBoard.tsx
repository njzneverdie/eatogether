'use client'
import RestaurantPhoto from '@/components/shared/RestaurantPhoto'
import type { VoteResult } from '@/types/domain'

const RANK_COLORS = [
  { bg: '#F5C842', text: '#7A5C00' },
  { bg: '#BCC4D0', text: '#3D4759' },
  { bg: '#CF8B5A', text: '#5C2C0A' },
]

interface Props {
  results: VoteResult[]
}

export default function ResultBoard({ results }: Props) {
  return (
    <div className="space-y-2 w-full">
      {results.map((r, i) => {
        const rankColor = RANK_COLORS[i]
        return (
          <div
            key={r.restaurant_id}
            className={`flex items-center gap-3 rounded-2xl border p-3 bg-white ${
              i === 0 ? 'border-[#e4d4a0]' : 'border-[#e8d8c0]'
            }`}
          >
            {/* Rank badge */}
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={rankColor ? { backgroundColor: rankColor.bg, color: rankColor.text } : { backgroundColor: '#f5ede0', color: '#a08060' }}
            >
              {i + 1}
            </div>

            {/* Photo */}
            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
              <RestaurantPhoto photoRef={r.photo_ref ?? null} name={r.name} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[#3d2424] text-sm truncate">{r.name}</p>
              <p className="text-xs text-[#a08060] mt-0.5">
                {r.rank1_count > 0 && (
                  <span className="mr-1.5 font-semibold text-[#F5C842]">{r.rank1_count}票第一</span>
                )}
                {r.score} 分
              </p>
            </div>

            {/* Score */}
            <div
              className="flex-shrink-0 w-10 h-10 rounded-xl flex flex-col items-center justify-center"
              style={i === 0 ? { backgroundColor: '#FFF8E1' } : { backgroundColor: '#f5ede0' }}
            >
              <p className="text-sm font-bold tabular-nums" style={{ color: i === 0 ? '#F5A623' : '#8b6b4e' }}>{r.score}</p>
              <p className="text-[9px] text-[#a08060]">分</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
