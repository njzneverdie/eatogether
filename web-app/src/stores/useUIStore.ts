'use client'
import { create } from 'zustand'

interface UIStore {
  isSpinning: boolean
  spinResult: string | null
  currentCardIndex: number
  isMatchModalOpen: boolean
  matchedRestaurantId: string | null

  setSpinning: (v: boolean) => void
  setSpinResult: (cuisine: string) => void
  setCardIndex: (idx: number) => void
  openMatchModal: (restaurantId: string) => void
  closeMatchModal: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  isSpinning: false,
  spinResult: null,
  currentCardIndex: 0,
  isMatchModalOpen: false,
  matchedRestaurantId: null,

  setSpinning: (v) => set({ isSpinning: v }),
  setSpinResult: (cuisine) => set({ spinResult: cuisine, isSpinning: false }),
  setCardIndex: (idx) => set({ currentCardIndex: idx }),
  openMatchModal: (restaurantId) =>
    set({ isMatchModalOpen: true, matchedRestaurantId: restaurantId }),
  closeMatchModal: () =>
    set({ isMatchModalOpen: false, matchedRestaurantId: null }),
}))
