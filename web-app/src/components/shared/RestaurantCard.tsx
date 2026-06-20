'use client'
import RestaurantPhoto from './RestaurantPhoto'
import type { Restaurant } from '@/types/domain'

const PRICE_LABEL = ['', '便宜', '適中', '較貴', '高級']
const RANK_COLORS = [
  { bg: '#F5C842', text: '#7A5C00' },
  { bg: '#BCC4D0', text: '#3D4759' },
  { bg: '#CF8B5A', text: '#5C2C0A' },
]

function StarIcon({ filled, half }: { filled: boolean; half?: boolean }) {
  return (
    <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 16 16" fill="none">
      <defs>
        <linearGradient id="half-grad">
          <stop offset="50%" stopColor="#f97316" />
          <stop offset="50%" stopColor="#d4d8e8" />
        </linearGradient>
      </defs>
      <path
        d="M8 1l1.8 3.6L14 5.4l-3 2.9.7 4.1L8 10.4l-3.7 2 .7-4.1-3-2.9 4.2-.8z"
        fill={filled ? '#f97316' : half ? 'url(#half-grad)' : '#d4d8e8'}
      />
    </svg>
  )
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.3
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <StarIcon key={i} filled={i < full} half={i === full && half} />
      ))}
      <span className="text-xs text-[#8b95c4] ml-1 tabular-nums">{rating.toFixed(1)}</span>
    </span>
  )
}

function PriceDots({ level }: { level: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 4 }, (_, i) => (
        <span key={i} className={`text-xs font-semibold ${i < level ? 'text-[#1a1f36]' : 'text-[#d4d8e8]'}`}>$</span>
      ))}
      <span className="text-[#8b95c4] text-xs ml-1">{PRICE_LABEL[level]}</span>
    </span>
  )
}

function RankBadge({ rank }: { rank: number }) {
  const c = RANK_COLORS[rank] ?? { bg: '#e8eaf2', text: '#6b7280' }
  return (
    <div
      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {rank + 1}
    </div>
  )
}

interface Props {
  restaurant: Restaurant
  rank?: number
  score?: number
  showMapLink?: boolean
  compact?: boolean
}

export default function RestaurantCard({ restaurant, rank, score, showMapLink = false, compact = false }: Props) {
  function openMaps() {
    const url = restaurant.place_id
      ? `https://www.google.com/maps/place/?q=place_id:${restaurant.place_id}`
      : `https://www.google.com/maps/search/${encodeURIComponent(restaurant.name + (restaurant.address ? ' ' + restaurant.address : ''))}`
    window.open(url, '_blank')
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3 bg-white rounded-2xl border border-[#e4e7f0] p-3 w-full">
        <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
          <RestaurantPhoto photoRef={restaurant.photo_ref} name={restaurant.name} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            {rank !== undefined && <RankBadge rank={rank} />}
            <p className="font-bold text-[#1a1f36] text-sm truncate">{restaurant.name}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {restaurant.rating && <StarRating rating={restaurant.rating} />}
            {restaurant.price_level ? <PriceDots level={restaurant.price_level} /> : null}
          </div>
          {restaurant.address && (
            <p className="text-[10px] text-[#8b95c4] truncate mt-0.5">{restaurant.address}</p>
          )}
        </div>
        {score !== undefined && (
          <span className="text-xs font-bold text-[#8b95c4] bg-[#f0f2f8] px-2 py-1 rounded-lg flex-shrink-0 tabular-nums">{score} 分</span>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-[#e4e7f0] overflow-hidden w-full">
      <div className="w-full h-44 relative overflow-hidden">
        <RestaurantPhoto photoRef={restaurant.photo_ref} name={restaurant.name} />
        {rank !== undefined && (
          <div className="absolute top-3 left-3">
            <div
              className="px-3 py-1 rounded-xl text-sm font-bold shadow-sm"
              style={{
                backgroundColor: RANK_COLORS[rank]?.bg ?? '#e8eaf2',
                color: RANK_COLORS[rank]?.text ?? '#6b7280',
              }}
            >
              #{rank + 1}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-[#1a1f36] text-lg leading-tight">{restaurant.name}</h3>
          {score !== undefined && (
            <p className="text-sm text-[#8b95c4] mt-0.5">
              得分 <span className="font-bold text-[#f97316] tabular-nums">{score}</span> 分
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {restaurant.rating && <StarRating rating={restaurant.rating} />}
          {restaurant.price_level ? <PriceDots level={restaurant.price_level} /> : null}
        </div>

        {restaurant.open_now != null && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full w-fit ${restaurant.open_now ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#fde8e8] text-[#991b1b]'}`}>
            {restaurant.open_now ? '營業中' : '已打烊'}
          </span>
        )}

        {restaurant.address && (
          <div className="flex items-start gap-2">
            <svg className="w-3.5 h-3.5 text-[#8b95c4] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-xs text-[#8b95c4] leading-snug">{restaurant.address}</p>
          </div>
        )}

        {restaurant.phone && (
          <a href={`tel:${restaurant.phone}`} className="flex items-center gap-2 group">
            <svg className="w-3.5 h-3.5 text-[#8b95c4] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span className="text-xs text-[#8b95c4] group-hover:text-[#1a1f36] transition-colors">{restaurant.phone}</span>
          </a>
        )}

        {restaurant.website && (
          <a href={restaurant.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 group">
            <svg className="w-3.5 h-3.5 text-[#8b95c4] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span className="text-xs text-[#8b95c4] group-hover:text-[#1a1f36] transition-colors truncate">{restaurant.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
          </a>
        )}

        {restaurant.user_rating_count != null && (
          <p className="text-xs text-[#8b95c4]">{restaurant.user_rating_count.toLocaleString()} 則評論</p>
        )}

        {showMapLink && (
          <button
            onClick={openMaps}
            className="w-full flex items-center justify-center gap-2 bg-[#1a1f36] hover:bg-[#252b4a] text-white font-semibold text-sm py-3 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            在 Google Maps 查看
          </button>
        )}
      </div>
    </div>
  )
}
