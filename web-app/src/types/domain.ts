export type SessionMode = 'swipe' | 'midpoint' | 'vote'
export type VoteSubmode = 'pass' | 'online'
export type SessionStatus = 'lobby' | 'spinning' | 'picking' | 'deciding' | 'done' | 'cancelled'

export interface Restaurant {
  id: string
  place_id: string
  name: string
  rating: number | null
  user_rating_count?: number | null
  price_level: number | null
  photo_ref: string | null
  address: string | null
  phone?: string | null
  website?: string | null
  open_now?: boolean | null
  lat?: number
  lng?: number
}

export interface VoteResult {
  restaurant_id: string
  place_id?: string | null
  name: string
  score: number
  rank1_count: number
  photo_ref?: string | null
  address?: string | null
  rating?: number | null
  price_level?: number | null
}

export interface ParticipantPresence {
  participant_id: string
  display_name: string
  is_ready: boolean
  online_at: string
}
