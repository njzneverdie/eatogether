import { create } from 'zustand'

// --- 型別定義 ---

export interface Member {
  id: string
  name: string
  lat: number
  lng: number
}

export interface Candidate {
  place_id: string
  name: string
  address: string
  rating: number
  price_level: number
  photo_url: string
  lat: number
  lng: number
}

export interface FinalPlace {
  place_id: string
  name: string
  address: string
  rating: number
  price_level: number
  photo_url: string
  lat: number
  lng: number
}

// --- State 介面 ---

interface RoomState {
  roomId: string
  roomCode: string
  foodType: string
  foodEmoji: string
  mode: 'tinder' | 'midpoint' | 'vote' | ''
  myName: string
  members: Member[]
  candidates: Candidate[]
  finalPlace: FinalPlace | null

  actions: {
    setRoom: (params: {
      roomId: string
      roomCode: string
      foodType: string
      foodEmoji: string
      mode: 'tinder' | 'midpoint' | 'vote'
    }) => void
    setMyName: (name: string) => void
    setMembers: (members: Member[]) => void
    setCandidates: (candidates: Candidate[]) => void
    setFinalPlace: (place: FinalPlace) => void
    reset: () => void
  }
}

// --- 初始狀態 ---

const initialState = {
  roomId: '',
  roomCode: '',
  foodType: '',
  foodEmoji: '',
  mode: '' as const,
  myName: '',
  members: [],
  candidates: [],
  finalPlace: null,
}

// --- Zustand Store ---

export const useRoomStore = create<RoomState>((set) => ({
  ...initialState,

  actions: {
    setRoom: ({ roomId, roomCode, foodType, foodEmoji, mode }) =>
      set({ roomId, roomCode, foodType, foodEmoji, mode }),

    setMyName: (name: string) =>
      set({ myName: name }),

    setMembers: (members: Member[]) =>
      set({ members }),

    setCandidates: (candidates: Candidate[]) =>
      set({ candidates }),

    setFinalPlace: (place: FinalPlace) =>
      set({ finalPlace: place }),

    reset: () =>
      set({ ...initialState }),
  },
}))
