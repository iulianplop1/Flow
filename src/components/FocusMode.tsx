import { useState, useEffect, useRef } from 'react'
import { Task } from '../lib/types'
import { Square, Play, Pause } from 'lucide-react'
import confetti from 'canvas-confetti'

interface FocusModeProps {
  task: Task
  onComplete: (actualDuration: number) => Promise<void>
  onStop: () => void
}

export default function FocusMode({ task, onComplete, onStop }: FocusModeProps) {
  const plannedMinutes = task.activity?.duration_minutes || 30
  const [secondsRemaining, setSecondsRemaining] = useState(plannedMinutes * 60)
  const [isRunning, setIsRunning] = useState(true)
  const [startTime, setStartTime] = useState(Date.now())
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const handleComplete = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsRunning(false)
    
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000)
    const actualMinutes = Math.ceil(elapsedSeconds / 60)

    // Celebrate!
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    })

    try {
      await onComplete(actualMinutes)
    } catch (error) {
      console.error('Error completing task:', error)
    }
  }

  useEffect(() => {
    if (isRunning && secondsRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            handleComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isRunning, secondsRemaining])

  const togglePause = () => {
    setIsRunning(!isRunning)
  }

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const progress = ((plannedMinutes * 60 - secondsRemaining) / (plannedMinutes * 60)) * 100

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold mb-4">{task.activity?.name || 'Focus Session'}</h2>
        <div className="text-6xl font-mono font-bold mb-4">
          {formatTime(secondsRemaining)}
        </div>
        <div className="w-full max-w-md bg-gray-800 rounded-full h-2 mb-4">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-gray-400">
          Planned: {plannedMinutes} minutes
        </p>
      </div>

      <div className="flex gap-4">
        <button
          onClick={togglePause}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors"
        >
          {isRunning ? (
            <>
              <Pause className="w-5 h-5" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Resume
            </>
          )}
        </button>
        <button
          onClick={handleComplete}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors"
        >
          Complete
        </button>
        <button
          onClick={onStop}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors"
        >
          <Square className="w-5 h-5" />
          Stop
        </button>
      </div>

      {/* Optional: Binaural beats iframe (hidden by default) */}
      <div className="mt-8 text-gray-500 text-sm">
        <button
          onClick={() => {
            const iframe = document.getElementById('binaural-beats')
            if (iframe) {
              iframe.style.display = iframe.style.display === 'none' ? 'block' : 'none'
            }
          }}
          className="text-gray-400 hover:text-gray-300"
        >
          Toggle Binaural Beats
        </button>
        <iframe
          id="binaural-beats"
          width="560"
          height="315"
          src="https://www.youtube.com/embed/jgpJVI3tDbY?autoplay=0"
          title="Binaural Beats"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="mt-4 hidden"
        />
      </div>
    </div>
  )
}

