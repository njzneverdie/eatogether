'use client'
import { useState } from 'react'

interface Props {
  photoRef: string | null
  name: string
  className?: string
}

export default function RestaurantPhoto({ photoRef, name, className = '' }: Props) {
  const [error, setError] = useState(false)
  const src = photoRef ? `/api/photo?ref=${encodeURIComponent(photoRef)}` : null

  if (src && !error) {
    return (
      <img
        src={src}
        alt={name}
        className={`object-cover w-full h-full ${className}`}
        onError={() => setError(true)}
      />
    )
  }

  return (
    <div className={`w-full h-full bg-[#e8eaf2] flex flex-col items-center justify-center gap-2 ${className}`}>
      <svg className="w-8 h-8 text-[#c0c6da]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
      <span className="text-[#c0c6da] text-xs font-medium">{name?.[0] ?? '餐'}</span>
    </div>
  )
}
