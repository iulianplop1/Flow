import { useState } from 'react'
import { Task } from '../lib/types'
import { AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

interface CrisisButtonProps {
  tasks: Task[]
  onReschedule: () => Promise<void>
}

export default function CrisisButton({ tasks, onReschedule }: CrisisButtonProps) {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [reschedulePlan, setReschedulePlan] = useState<any>(null)

  const handleCrisis = async () => {
    if (!user || tasks.length === 0) {
      alert('No pending tasks to reschedule')
      return
    }

    setLoading(true)
    try {
      // Calculate available hours left today
      const now = new Date()
      const endOfDay = new Date(now)
      endOfDay.setHours(23, 59, 59, 999)
      const hoursLeft = (endOfDay.getTime() - now.getTime()) / (1000 * 60 * 60)

      // Prepare task data for AI
      const taskData = tasks.map((t) => ({
        id: t.id,
        activity_id: t.activity_id,
        name: t.activity?.name || 'Unknown',
        duration: t.activity?.duration_minutes || 30,
        min_duration: t.activity?.min_duration || 15,
        tag: t.activity?.tag || 'General',
        energy_level: t.activity?.energy_level || 'Medium',
      }))

      const { data, error } = await supabase.functions.invoke('reschedule-crisis', {
        body: {
          tasks: taskData,
          available_hours: hoursLeft,
        },
      })

      if (error) throw error

      if (data && data.actions) {
        setReschedulePlan(data.actions)
        setShowModal(true)
      }
    } catch (error) {
      console.error('Error in crisis reschedule:', error)
      alert('Failed to generate reschedule plan. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const applyReschedule = async () => {
    if (!reschedulePlan) return

    setLoading(true)
    try {
      for (const action of reschedulePlan) {
        if (action.action === 'delete') {
          await supabase.from('tasks').delete().eq('id', action.task_id)
        } else if (action.action === 'shorten') {
          await supabase
            .from('activities')
            .update({ duration_minutes: action.new_duration })
            .eq('id', action.activity_id)
        }
      }
      setShowModal(false)
      setReschedulePlan(null)
      await onReschedule()
      alert('Crisis reschedule applied!')
    } catch (error) {
      console.error('Error applying reschedule:', error)
      alert('Failed to apply reschedule. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={handleCrisis}
        disabled={loading || tasks.length === 0}
        className="bg-red-600 hover:bg-red-700 text-white rounded-full p-4 shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        title="Crisis / Overflow"
      >
        <AlertTriangle className="w-5 h-5" />
        {loading ? '...' : 'Crisis'}
      </button>

      {showModal && reschedulePlan && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-2xl border border-gray-700">
            <h2 className="text-2xl font-bold mb-4">Crisis Reschedule Plan</h2>
            <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
              {reschedulePlan.map((action: any, index: number) => (
                <div
                  key={index}
                  className="bg-gray-700 rounded-lg p-3 border border-gray-600"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{action.task_name}</p>
                      <p className="text-sm text-gray-400">
                        {action.action === 'delete'
                          ? 'Will be deleted'
                          : `Will be shortened to ${action.new_duration} min`}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        action.action === 'delete'
                          ? 'bg-red-900/50 text-red-300'
                          : 'bg-yellow-900/50 text-yellow-300'
                      }`}
                    >
                      {action.action}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={applyReschedule}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                Apply Reschedule
              </button>
              <button
                onClick={() => {
                  setShowModal(false)
                  setReschedulePlan(null)
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

