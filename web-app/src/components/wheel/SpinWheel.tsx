'use client'
import { useState, useRef } from 'react'

const CUISINES = [
  { label: '日式', color: '#fca5a5' },
  { label: '韓式', color: '#fdba74' },
  { label: '火鍋', color: '#fde68a' },
  { label: '義式', color: '#bbf7d0' },
  { label: '美式', color: '#93c5fd' },
  { label: '中式', color: '#c4b5fd' },
  { label: '泰式', color: '#f9a8d4' },
  { label: '台式', color: '#6ee7b7' },
]

const SIZE = 280
const CX = SIZE / 2
const CY = SIZE / 2
const R = CX - 8
const SLICE = (2 * Math.PI) / CUISINES.length

function polarToCartesian(angle: number, radius: number) {
  return { x: CX + radius * Math.cos(angle), y: CY + radius * Math.sin(angle) }
}

function slicePath(i: number) {
  const start = i * SLICE - Math.PI / 2
  const end = start + SLICE
  const s = polarToCartesian(start, R)
  const e = polarToCartesian(end, R)
  const large = SLICE > Math.PI ? 1 : 0
  return `M ${CX} ${CY} L ${s.x} ${s.y} A ${R} ${R} 0 ${large} 1 ${e.x} ${e.y} Z`
}

interface Props {
  onResult: (cuisine: string) => void
}

export default function SpinWheel({ onResult }: Props) {
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const animRef = useRef<number | null>(null)

  function spin() {
    if (spinning) return
    setSpinning(true)

    const extraSpins = 5 + Math.floor(Math.random() * 5)
    const targetDeg = extraSpins * 360 + Math.floor(Math.random() * 360)
    const duration = 3500
    const start = performance.now()
    const fromRot = rotation

    function animate(now: number) {
      const elapsed = now - start
      const t = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - t, 4)
      const current = fromRot + targetDeg * eased
      setRotation(current)

      if (t < 1) {
        animRef.current = requestAnimationFrame(animate)
      } else {
        setSpinning(false)
        const finalDeg = current % 360
        const idx = Math.floor(((360 - finalDeg) % 360) / (360 / CUISINES.length)) % CUISINES.length
        onResult(CUISINES[idx].label)
      }
    }

    animRef.current = requestAnimationFrame(animate)
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative">
        {/* Pointer arrow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
          <svg width="18" height="20" viewBox="0 0 18 20">
            <polygon points="9,20 0,0 18,0" fill="#1a1f36" />
          </svg>
        </div>

        <svg
          width={SIZE}
          height={SIZE}
          className="cursor-pointer"
          onClick={!spinning ? spin : undefined}
          style={{ filter: 'drop-shadow(0 4px 16px rgba(26,31,54,0.15))' }}
        >
          <g transform={`rotate(${rotation}, ${CX}, ${CY})`}>
            {CUISINES.map((c, i) => {
              const mid = i * SLICE - Math.PI / 2 + SLICE / 2
              const tp = polarToCartesian(mid, R * 0.66)
              return (
                <g key={c.label}>
                  <path d={slicePath(i)} fill={c.color} stroke="white" strokeWidth={2} />
                  <text
                    x={tp.x}
                    y={tp.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={13}
                    fontWeight="700"
                    fill="#1a1f36"
                    letterSpacing="0.5"
                  >
                    {c.label}
                  </text>
                </g>
              )
            })}
          </g>
          {/* Center hub */}
          <circle cx={CX} cy={CY} r={18} fill="#1a1f36" />
          <circle cx={CX} cy={CY} r={12} fill="white" opacity="0.15" />
        </svg>
      </div>

      <button
        onClick={spin}
        disabled={spinning}
        className="bg-[#1a1f36] hover:bg-[#252b4a] disabled:opacity-50 text-white font-bold px-10 py-3 rounded-2xl text-sm transition-colors tracking-wide"
      >
        {spinning ? '旋轉中…' : '轉動'}
      </button>
    </div>
  )
}
