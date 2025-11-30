import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

export default function TimeDisplay() {
  const [aarhusTime, setAarhusTime] = useState<string>('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      // Aarhus, Denmark is in Europe/Copenhagen timezone (CET/CEST)
      const aarhusTime = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Europe/Copenhagen',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(now)

      setAarhusTime(aarhusTime)
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-2 text-sm">
      <Clock className="w-4 h-4 text-blue-400" />
      <span className="text-gray-300">
        <span className="font-semibold">Aarhus:</span>{' '}
        <span className="font-mono text-blue-400">{aarhusTime}</span>
      </span>
    </div>
  )
}

