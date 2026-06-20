'use client'
import { toast } from 'sonner'

interface Props {
  roomCode: string
  sessionId: string
}

export default function ShareRoom({ roomCode, sessionId }: Props) {
  function copyLink() {
    const url = `${window.location.origin}/?room=${roomCode}`
    navigator.clipboard.writeText(url).then(() => toast.success('連結已複製！'))
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <p className="text-xs text-[#8b95c4] mb-0.5">邀請連結</p>
        <p className="text-xs text-[#1a1f36] truncate">{typeof window !== 'undefined' ? `${window.location.origin}/?room=${roomCode}` : '…'}</p>
      </div>
      <button
        onClick={copyLink}
        className="bg-[#f0f2f8] hover:bg-[#e4e7f0] text-[#1a1f36] text-xs font-semibold px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
      >
        複製連結
      </button>
    </div>
  )
}
