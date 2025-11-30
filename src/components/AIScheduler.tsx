import { useState } from 'react'
import { Calendar, Clock, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { ScheduledTask } from '../lib/types'

interface AISchedulerProps {
  tasks: any[]
  selectedDate: string
  onScheduled: () => Promise<void>
}

export default function AIScheduler({ tasks, selectedDate, onScheduled }: AISchedulerProps) {
  const { user } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [scheduled, setScheduled] = useState<ScheduledTask[]>([])
  const [startTime, setStartTime] = useState('09:00')
  const [availableHours, setAvailableHours] = useState(8)

  const handleSchedule = async () => {
    if (!user || tasks.length === 0) {
      alert('No tasks to schedule')
      return
    }

    setLoading(true)
    try {
      // Prepare task data
      const taskData = tasks.map((t) => ({
        id: t.id,
        activity_id: t.activity_id,
        name: t.activity?.name || 'Unknown',
        duration: t.activity?.duration_minutes || 30,
        tag: t.activity?.tag || 'General',
        energy_level: t.activity?.energy_level || 'Medium',
      }))

      const { data, error } = await supabase.functions.invoke('schedule-tasks', {
        body: {
          tasks: taskData,
          available_hours: availableHours,
          start_time: startTime,
        },
      })

      if (error) throw error

      if (data && data.scheduled) {
        setScheduled(data.scheduled)
      }
    } catch (error) {
      console.error('Error scheduling tasks:', error)
      alert('Failed to schedule tasks. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const applySchedule = async () => {
    if (!user || scheduled.length === 0) return

    setLoading(true)
    try {
      // Update all tasks with their scheduled times
      for (const scheduledTask of scheduled) {
        if (scheduledTask.task_id) {
          await supabase
            .from('tasks')
            .update({
              planned_time: scheduledTask.planned_time,
              sort_order: scheduledTask.sort_order,
            })
            .eq('id', scheduledTask.task_id)
        }
      }

      setIsOpen(false)
      setScheduled([])
      await onScheduled()
      alert('Schedule applied successfully!')
    } catch (error) {
      console.error('Error applying schedule:', error)
      alert('Failed to apply schedule. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (tasks.length === 0) {
    return null
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
        title="AI Schedule Tasks"
      >
        <Sparkles className="w-5 h-5" />
        AI Schedule
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-3xl border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-400" />
                AI Task Scheduler
              </h2>
              <button
                onClick={() => {
                  setIsOpen(false)
                  setScheduled([])
                }}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Available Hours
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={availableHours}
                    onChange={(e) => setAvailableHours(Number(e.target.value))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  />
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-300 mb-2">
                  {tasks.length} tasks to schedule for {selectedDate}
                </p>
                <ul className="text-sm text-gray-400 space-y-1">
                  {tasks.map((t) => (
                    <li key={t.id}>
                      • {t.activity?.name} ({t.activity?.duration_minutes} min, {t.activity?.energy_level} energy)
                    </li>
                  ))}
                </ul>
              </div>

              {!scheduled.length && (
                <button
                  onClick={handleSchedule}
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Scheduling...' : 'Generate Schedule'}
                </button>
              )}

              {scheduled.length > 0 && (
                <>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Generated Schedule</h3>
                    <div className="space-y-2">
                      {scheduled.map((task, index) => (
                        <div
                          key={index}
                          className="bg-gray-600 rounded-lg p-3 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-purple-400 font-mono font-bold">
                              {task.planned_time}
                            </div>
                            <div>
                              <div className="font-semibold">{task.name}</div>
                              <div className="text-xs text-gray-400">
                                {task.duration} min • {task.tag} • {task.energy_level}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={applySchedule}
                      disabled={loading}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Apply Schedule
                    </button>
                    <button
                      onClick={handleSchedule}
                      disabled={loading}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      Regenerate
                    </button>
                    <button
                      onClick={() => {
                        setIsOpen(false)
                        setScheduled([])
                      }}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

