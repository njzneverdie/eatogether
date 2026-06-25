// Manually maintained — replace with `npx supabase gen types typescript` once project is linked.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; display_name: string; avatar_url: string | null; created_at: string }
        Insert: { id: string; display_name: string; avatar_url?: string | null; created_at?: string }
        Update: { id?: string; display_name?: string; avatar_url?: string | null; created_at?: string }
        Relationships: []
      }
      sessions: {
        Row: {
          id: string
          room_code: string | null
          host_id: string | null
          mode: 'swipe' | 'midpoint' | 'vote' | null
          vote_submode: 'pass' | 'online' | null
          cuisine_type: string | null
          status: 'lobby' | 'spinning' | 'picking' | 'deciding' | 'done' | 'cancelled'
          result_place_id: string | null
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          room_code?: string | null
          host_id?: string | null
          mode?: 'swipe' | 'midpoint' | 'vote' | null
          vote_submode?: 'pass' | 'online' | null
          cuisine_type?: string | null
          status?: 'lobby' | 'spinning' | 'picking' | 'deciding' | 'done' | 'cancelled'
          result_place_id?: string | null
          created_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          room_code?: string | null
          host_id?: string | null
          mode?: 'swipe' | 'midpoint' | 'vote' | null
          vote_submode?: 'pass' | 'online' | null
          cuisine_type?: string | null
          status?: 'lobby' | 'spinning' | 'picking' | 'deciding' | 'done' | 'cancelled'
          result_place_id?: string | null
          created_at?: string
          expires_at?: string
        }
        Relationships: []
      }
      participants: {
        Row: {
          id: string
          session_id: string
          user_id: string | null
          seat_label: string | null
          display_name: string
          location: unknown | null
          is_ready: boolean
          joined_at: string
        }
        Insert: {
          id?: string
          session_id: string
          user_id?: string | null
          seat_label?: string | null
          display_name: string
          location?: unknown | null
          is_ready?: boolean
          joined_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string | null
          seat_label?: string | null
          display_name?: string
          location?: unknown | null
          is_ready?: boolean
          joined_at?: string
        }
        Relationships: []
      }
      session_restaurants: {
        Row: {
          id: string
          session_id: string
          place_id: string
          name: string
          location: unknown | null
          rating: number | null
          user_rating_count: number | null
          price_level: number | null
          photo_ref: string | null
          address: string | null
          phone: string | null
          website: string | null
          open_now: boolean | null
          cuisine_type: string | null
          data: Json | null
        }
        Insert: {
          id?: string
          session_id: string
          place_id: string
          name: string
          location?: unknown | null
          rating?: number | null
          user_rating_count?: number | null
          price_level?: number | null
          photo_ref?: string | null
          address?: string | null
          phone?: string | null
          website?: string | null
          open_now?: boolean | null
          cuisine_type?: string | null
          data?: Json | null
        }
        Update: {
          id?: string
          session_id?: string
          place_id?: string
          name?: string
          location?: unknown | null
          rating?: number | null
          user_rating_count?: number | null
          price_level?: number | null
          photo_ref?: string | null
          address?: string | null
          phone?: string | null
          website?: string | null
          open_now?: boolean | null
          cuisine_type?: string | null
          data?: Json | null
        }
        Relationships: []
      }
      swipes: {
        Row: {
          id: string
          session_id: string
          participant_id: string
          restaurant_id: string
          direction: 'like' | 'nope'
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          participant_id: string
          restaurant_id: string
          direction: 'like' | 'nope'
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          participant_id?: string
          restaurant_id?: string
          direction?: 'like' | 'nope'
          created_at?: string
        }
        Relationships: []
      }
      matches: {
        Row: { id: string; session_id: string; restaurant_id: string; matched_at: string }
        Insert: { id?: string; session_id: string; restaurant_id: string; matched_at?: string }
        Update: { id?: string; session_id?: string; restaurant_id?: string; matched_at?: string }
        Relationships: []
      }
      votes: {
        Row: {
          id: string
          session_id: string
          participant_id: string
          restaurant_id: string
          rank: 1 | 2 | 3
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          participant_id: string
          restaurant_id: string
          rank: 1 | 2 | 3
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          participant_id?: string
          restaurant_id?: string
          rank?: 1 | 2 | 3
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      compute_midpoint: { Args: { p_session: string }; Returns: unknown }
      cast_swipe: {
        Args: { p_session_id: string; p_participant_id: string; p_restaurant_id: string; p_direction: string }
        Returns: Json
      }
      submit_vote: {
        Args: { p_session_id: string; p_participant_id: string; p_ranks: Json }
        Returns: undefined
      }
      get_vote_results: {
        Args: { p_session_id: string }
        Returns: Array<{ restaurant_id: string; name: string; score: number; rank1_count: number }>
      }
      finalize_session: {
        Args: { p_session_id: string; p_place_id: string }
        Returns: undefined
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
