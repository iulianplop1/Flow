import { create } from 'zustand'
import { TimeBank } from '../lib/types'

interface TimeBankState {
  timeBank: TimeBank | null
  totalMinutesSaved: number
  setTimeBank: (timeBank: TimeBank | null) => void
  addMinutesSaved: (minutes: number) => void
  spendMinutes: (minutes: number) => void
  refreshTimeBank: (date?: string) => Promise<void>
}

export const useTimeBankStore = create<TimeBankState>((set) => ({
  timeBank: null,
  totalMinutesSaved: 0,
  setTimeBank: (timeBank) =>
    set({ timeBank, totalMinutesSaved: timeBank?.minutes_saved ?? 0 }),
  addMinutesSaved: (minutes) =>
    set((state) => ({
      totalMinutesSaved: (state.totalMinutesSaved || 0) + minutes,
    })),
  spendMinutes: (minutes) =>
    set((state) => ({
      totalMinutesSaved: Math.max(0, (state.totalMinutesSaved || 0) - minutes),
    })),
  refreshTimeBank: async (_date?: string) => {
    // This will be implemented in the component
  },
}))

