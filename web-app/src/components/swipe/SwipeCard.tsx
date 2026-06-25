'use client'
import { useRef } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useDrag } from '@use-gesture/react'
import RestaurantPhoto from '@/components/shared/RestaurantPhoto'
import type { Restaurant } from '@/types/domain'

const SWIPE_THRESHOLD = 100

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 16 16" fill="none">
      <path
        d="M8 1l1.8 3.6L14 5.4l-3 2.9.7 4.1L8 10.4l-3.7 2 .7-4.1-3-2.9 4.2-.8z"
        fill={filled ? '#cda368' : 'rgba(255,255,255,0.25)'}
      />
    </svg>
  )
}

const PRICE = ['', '$', '$$', '$$$', '$$$$']

interface Props {
  restaurant: Restaurant
  onSwipe: (direction: 'like' | 'nope') => void
  isTop: boolean
}

export default function SwipeCard({ restaurant, onSwipe, isTop }: Props) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-18, 18])
  const likeOpacity = useTransform(x, [20, 100], [0, 1])
  const nopeOpacity = useTransform(x, [-100, -20], [1, 0])
  const cardOpacity = useTransform(x, [-300, -150, 0, 150, 300], [0, 1, 1, 1, 0])
  const flying = useRef(false)

  function flyOut(direction: 'like' | 'nope') {
    if (flying.current) return
    flying.current = true
    animate(x, direction === 'like' ? 600 : -600, {
      duration: 0.3,
      onComplete: () => onSwipe(direction),
    })
  }

  const bind = useDrag(
    ({ active, movement: [mx], velocity: [vx] }) => {
      if (!isTop) return
      if (active) {
        x.set(mx)
      } else {
        if (Math.abs(mx) > SWIPE_THRESHOLD || Math.abs(vx) > 0.5) {
          flyOut(mx > 0 ? 'like' : 'nope')
        } else {
          animate(x, 0, { type: 'spring', stiffness: 300, damping: 20 })
        }
      }
    },
    { filterTaps: true }
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gestureProps = isTop ? (bind() as any) : {}

  return (
    <motion.div
      style={{ x, rotate, opacity: cardOpacity }}
      className="absolute inset-0 touch-none"
      {...gestureProps}
    >
      <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-xl bg-white select-none">
        {/* LIKE stamp */}
        <motion.div
          style={{ opacity: likeOpacity }}
          className="absolute top-6 left-5 z-20 border-[3px] border-[#22c55e] text-[#22c55e] text-lg font-black px-3 py-1 rounded-xl -rotate-12 tracking-wider"
        >
          LIKE
        </motion.div>
        {/* PASS stamp */}
        <motion.div
          style={{ opacity: nopeOpacity }}
          className="absolute top-6 right-5 z-20 border-[3px] border-[#ef4444] text-[#ef4444] text-lg font-black px-3 py-1 rounded-xl rotate-12 tracking-wider"
        >
          PASS
        </motion.div>

        {/* Photo */}
        <div className="w-full h-[58%] relative overflow-hidden">
          <RestaurantPhoto photoRef={restaurant.photo_ref} name={restaurant.name} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

          {/* Rating overlay on photo */}
          {restaurant.rating && (
            <div className="absolute bottom-3 left-4 flex items-center gap-1">
              {Array.from({ length: 5 }, (_, i) => (
                <StarIcon key={i} filled={i < Math.round(restaurant.rating!)} />
              ))}
              <span className="text-white text-xs ml-1 font-semibold tabular-nums">{restaurant.rating.toFixed(1)}</span>
            </div>
          )}
          {restaurant.price_level && (
            <div className="absolute bottom-3 right-4">
              <span className="text-white/80 text-sm font-mono">{PRICE[restaurant.price_level]}</span>
            </div>
          )}
        </div>

        {/* Info panel */}
        <div className="p-4 space-y-2">
          <h2 className="text-xl font-bold text-[#3d2424] leading-tight">{restaurant.name}</h2>

          {restaurant.address && (
            <div className="flex items-start gap-1.5">
              <svg className="w-3.5 h-3.5 text-[#a08060] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-xs text-[#a08060] line-clamp-2 leading-snug">{restaurant.address}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
