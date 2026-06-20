'use client'
import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function useRealtimeChannel(
  sessionId: string | null,
  participantId: string | null,
  displayName: string | null,
  handlers: {
    onPresenceSync?: (state: Record<string, unknown[]>) => void
    onBroadcast?: (event: string, payload: unknown) => void
    onPostgresChange?: (payload: unknown) => void
  }
) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!sessionId || !participantId) return

    const channel = supabase.channel(`session:${sessionId}`, {
      config: { presence: { key: participantId } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        handlers.onPresenceSync?.(channel.presenceState())
      })
      .on('broadcast', { event: '*' }, ({ event, payload }) => {
        handlers.onBroadcast?.(event, payload)
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          handlers.onPostgresChange?.(payload)
        }
      )
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && displayName) {
          await channel.track({ display_name: displayName, is_ready: false })
        }
      })

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, participantId])

  return channelRef
}
