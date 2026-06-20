'use client'
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps'
import type { Restaurant } from '@/types/domain'

interface Props {
  midpoint: { lat: number; lng: number }
  restaurants: Restaurant[]
  onSelect: (r: Restaurant) => void
  selected: Restaurant | null
}

export default function MidpointMap({ midpoint, restaurants, onSelect, selected }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY ?? ''

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={midpoint}
        defaultZoom={15}
        mapId="eatogether-map"
        className="w-full h-64 rounded-2xl overflow-hidden"
        gestureHandling="greedy"
        disableDefaultUI
      >
        {/* Midpoint marker */}
        <AdvancedMarker position={midpoint} title="大家的中點">
          <div className="bg-[#1a1f36] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            中點
          </div>
        </AdvancedMarker>

        {/* Restaurant markers */}
        {restaurants.map((r) => (
          <AdvancedMarker
            key={r.id}
            position={{ lat: r.lat ?? midpoint.lat, lng: r.lng ?? midpoint.lng }}
            title={r.name}
            onClick={() => onSelect(r)}
          >
            <Pin
              background={selected?.id === r.id ? '#f97316' : '#fff'}
              borderColor={selected?.id === r.id ? '#ea580c' : '#d1d5db'}
              glyphColor={selected?.id === r.id ? '#fff' : '#6b7280'}
            />
          </AdvancedMarker>
        ))}
      </Map>
    </APIProvider>
  )
}
