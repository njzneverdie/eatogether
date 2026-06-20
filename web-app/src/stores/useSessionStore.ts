'use client'
import { create } from 'zustand'
import type { SessionMode, VoteSubmode, SessionStatus } from '@/types/domain'

interface SessionStore {
  sessionId: string | null
  roomCode: string | null
  participantId: string | null
  displayName: string | null
  mode: SessionMode | null
  voteSubmode: VoteSubmode | null
  cuisineType: string | null
  status: SessionStatus | null

  setSession: (data: {
    sessionId: string
    roomCode: string | null
    participantId: string
    displayName: string
    mode: SessionMode | null
    voteSubmode: VoteSubmode | null
    cuisineType: string | null
    status: SessionStatus
  }) => void
  setCuisineType: (cuisine: string) => void
  setMode: (mode: SessionMode, submode?: VoteSubmode) => void
  setStatus: (status: SessionStatus) => void
  reset: () => void
}

export const useSessionStore = create<SessionStore>((set) => ({
  sessionId: null,
  roomCode: null,
  participantId: null,
  displayName: null,
  mode: null,
  voteSubmode: null,
  cuisineType: null,
  status: null,

  setSession: (data) =>
    set({
      sessionId: data.sessionId,
      roomCode: data.roomCode,
      participantId: data.participantId,
      displayName: data.displayName,
      mode: data.mode,
      voteSubmode: data.voteSubmode,
      cuisineType: data.cuisineType,
      status: data.status,
    }),
  setCuisineType: (cuisine) => set({ cuisineType: cuisine }),
  setMode: (mode, submode) => set({ mode, voteSubmode: submode ?? null }),
  setStatus: (status) => set({ status }),
  reset: () =>
    set({
      sessionId: null,
      roomCode: null,
      participantId: null,
      displayName: null,
      mode: null,
      voteSubmode: null,
      cuisineType: null,
      status: null,
    }),
}))
