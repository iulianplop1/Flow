import { create } from 'zustand'
import { EnergyLevel } from '../lib/types'

interface FilterState {
  energyLevel: EnergyLevel | null
  selectedTag: string | null
  setEnergyLevel: (level: EnergyLevel | null) => void
  setSelectedTag: (tag: string | null) => void
  resetFilters: () => void
}

export const useFilterStore = create<FilterState>((set) => ({
  energyLevel: null,
  selectedTag: null,
  setEnergyLevel: (level) => set({ energyLevel: level }),
  setSelectedTag: (tag) => set({ selectedTag: tag }),
  resetFilters: () => set({ energyLevel: null, selectedTag: null }),
}))

