'use client'
import type { ParticipantPresence } from '@/types/domain'

interface Props {
  presence: ParticipantPresence[]
}

const AVATAR_COLORS = [
  '#e8f0fd', '#fde8f0', '#e8fdf0', '#fdf6e8', '#ede8fd',
]

export default function PresenceBar({ presence }: Props) {
  if (presence.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {presence.map((p, i) => (
        <div
          key={p.participant_id ?? i}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#e8d8c0]"
          style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
        >
          <div className="w-6 h-6 rounded-full bg-[#3d2424] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {(p.display_name ?? '?')[0].toUpperCase()}
          </div>
          <span className="text-sm font-medium text-[#3d2424]">{p.display_name}</span>
        </div>
      ))}
    </div>
  )
}
