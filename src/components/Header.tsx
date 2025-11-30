import { useFilterStore } from '../stores/filterStore'
import { LogOut } from 'lucide-react'
import TimeDisplay from './TimeDisplay'

interface HeaderProps {
  selectedDate: string
  onDateChange: (date: string) => void
  onSignOut: () => void
}

export default function Header({ selectedDate, onDateChange, onSignOut }: HeaderProps) {
  const { energyLevel, setEnergyLevel } = useFilterStore()

  return (
    <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4 max-w-4xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold">FlowState v2</h1>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-2 sm:px-3 py-1 sm:py-2 text-white text-sm"
            />
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-xs sm:text-sm">
            <TimeDisplay />
            <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setEnergyLevel(energyLevel === 'High' ? null : 'High')}
                className={`px-3 py-1 rounded transition-colors ${
                  energyLevel === 'High'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="High Energy"
              >
                🔥 High
              </button>
              <button
                onClick={() => setEnergyLevel(null)}
                className={`px-3 py-1 rounded transition-colors ${
                  energyLevel === null
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Neutral"
              >
                😐 Neutral
              </button>
              <button
                onClick={() => setEnergyLevel(energyLevel === 'Low' ? null : 'Low')}
                className={`px-3 py-1 rounded transition-colors ${
                  energyLevel === 'Low'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Low Energy"
              >
                🧟 Low
              </button>
            </div>

            <button
              onClick={onSignOut}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

