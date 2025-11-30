import { useState, useEffect } from 'react'
import { Task } from '../lib/types'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { Sparkles, X, Play } from 'lucide-react'

interface SmartStartProps {
  tasks: Task[]
  onStartTask: (task: Task) => void
  onDismiss: () => void
}

interface SmartStartData {
  prompt: string
  task_id: string
  duration: number
}

export default function SmartStart({ tasks, onStartTask, onDismiss }: SmartStartProps) {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [smartStartData, setSmartStartData] = useState<SmartStartData | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (user && tasks.length > 0 && !dismissed) {
      loadSmartStart()
    }
  }, [user, tasks, dismissed])

  const loadSmartStart = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Get current time
      const now = new Date()
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

      // Get user history for context
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { data: recentTasks } = await supabase
        .from('tasks')
        .select('*, activity:activities(*)')
        .eq('user_id', user.id)
        .gte('planned_date', sevenDaysAgo.toISOString().split('T')[0])
        .order('created_at', { ascending: false })
        .limit(50)

      // Analyze history
      const completedTasks = recentTasks?.filter((t) => t.status === 'Completed') || []
      const tagCounts: { [key: string]: number } = {}
      completedTasks.forEach((t) => {
        const tag = t.activity?.tag || 'Other'
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
      const mostCompletedTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([tag]) => tag)

      const durations = completedTasks
        .filter((t) => t.actual_duration)
        .map((t) => t.actual_duration || 0)
      const avgCompletionTime =
        durations.length > 0
          ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
          : null

      // Determine typical energy at current time
      const currentHour = now.getHours()
      const tasksAtThisTime = recentTasks?.filter((t) => {
        if (!t.planned_time) return false
        const [hour] = t.planned_time.split(':').map(Number)
        return hour === currentHour
      }) || []
      const energyLevels = tasksAtThisTime
        .map((t) => t.activity?.energy_level)
        .filter(Boolean) as string[]
      const typicalEnergyAtTime =
        energyLevels.length > 0
          ? energyLevels.reduce((a, b, _, arr) =>
              arr.filter((v) => v === a).length >= arr.filter((v) => v === b).length ? a : b
            )
          : null

      const completionRate =
        recentTasks && recentTasks.length > 0
          ? Math.round((completedTasks.length / recentTasks.length) * 100)
          : 0

      const userHistory = {
        mostCompletedTags,
        avgCompletionTime,
        typicalEnergyAtTime,
        completionRate,
      }

      // Call smart-start edge function
      const { data, error } = await supabase.functions.invoke('smart-start', {
        body: {
          currentTime,
          tasks: tasks.map((t) => ({
            id: t.id,
            status: t.status,
            activity: t.activity,
            planned_time: t.planned_time,
          })),
          userHistory,
        },
      })

      if (error) throw error

      if (data && data.task_id) {
        setSmartStartData(data)
      }
    } catch (error) {
      console.error('Error loading smart start:', error)
      // Don't show error to user, just don't show smart start
    } finally {
      setLoading(false)
    }
  }

  const handleStart = () => {
    if (!smartStartData) return

    const task = tasks.find((t) => t.id === smartStartData.task_id)
    if (task) {
      onStartTask(task)
      setDismissed(true)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss()
  }

  // Don't show if loading, dismissed, or no data
  if (loading || dismissed || !smartStartData || !smartStartData.task_id) {
    return null
  }

  const task = tasks.find((t) => t.id === smartStartData.task_id)
  if (!task) {
    return null
  }

  return (
    <div className="mb-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/50 rounded-xl p-6 relative">
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        title="Dismiss"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-blue-600/30 rounded-full flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-blue-300" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-lg text-white mb-4 leading-relaxed">{smartStartData.prompt}</p>

          <button
            onClick={handleStart}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-lg hover:shadow-xl"
          >
            <Play className="w-5 h-5" />
            Start Focus Session
          </button>
        </div>
      </div>
    </div>
  )
}

