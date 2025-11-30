import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { Activity } from '../lib/types'
import { Repeat, X } from 'lucide-react'

export default function RecurringTasks() {
  const { user } = useAuthStore()
  const [activities, setActivities] = useState<Activity[]>([])
  const [showModal, setShowModal] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [recurrencePattern, setRecurrencePattern] = useState('daily')
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('')

  useEffect(() => {
    if (user) {
      loadActivities()
    }
  }, [user])

  const loadActivities = async () => {
    if (!user) return

    const { data } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) setActivities(data)
  }

  const handleSetRecurrence = async () => {
    if (!selectedActivity || !user) return

    await supabase
      .from('activities')
      .update({
        recurrence_pattern: recurrencePattern,
        recurrence_end_date: recurrenceEndDate || null,
      })
      .eq('id', selectedActivity.id)

    // Generate recurring tasks
    await generateRecurringTasks(selectedActivity, recurrencePattern, recurrenceEndDate)

    setShowModal(false)
    setSelectedActivity(null)
    alert('Recurring tasks created!')
  }

  const generateRecurringTasks = async (
    activity: Activity,
    pattern: string,
    endDate: string | null
  ) => {
    if (!user) return

    const startDate = new Date()
    const end = endDate ? new Date(endDate) : new Date()
    end.setMonth(end.getMonth() + 3) // Default 3 months if no end date

    const tasks: any[] = []
    const current = new Date(startDate)

    while (current <= end) {
      let shouldCreate = false

      switch (pattern) {
        case 'daily':
          shouldCreate = true
          break
        case 'weekdays':
          shouldCreate = current.getDay() >= 1 && current.getDay() <= 5
          break
        case 'weekends':
          shouldCreate = current.getDay() === 0 || current.getDay() === 6
          break
        case 'weekly':
          shouldCreate = current.getDay() === startDate.getDay()
          break
        case 'monthly':
          shouldCreate = current.getDate() === startDate.getDate()
          break
      }

      if (shouldCreate) {
        // Check if task already exists
        const { data: existing } = await supabase
          .from('tasks')
          .select('id')
          .eq('activity_id', activity.id)
          .eq('planned_date', current.toISOString().split('T')[0])
          .single()

        if (!existing) {
          tasks.push({
            activity_id: activity.id,
            user_id: user.id,
            planned_date: current.toISOString().split('T')[0],
            status: 'Pending',
          })
        }
      }

      current.setDate(current.getDate() + 1)
    }

    if (tasks.length > 0) {
      await supabase.from('tasks').insert(tasks)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors text-sm"
        title="Set Recurring Tasks"
      >
        <Repeat className="w-4 h-4" />
        Recurring
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Set Recurring Tasks</h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  setSelectedActivity(null)
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Activity
                </label>
                <select
                  value={selectedActivity?.id || ''}
                  onChange={(e) => {
                    const activity = activities.find((a) => a.id === e.target.value)
                    setSelectedActivity(activity || null)
                  }}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                >
                  <option value="">Choose an activity...</option>
                  {activities.map((activity) => (
                    <option key={activity.id} value={activity.id}>
                      {activity.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedActivity && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Recurrence Pattern
                    </label>
                    <select
                      value={recurrencePattern}
                      onChange={(e) => setRecurrencePattern(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekdays">Weekdays (Mon-Fri)</option>
                      <option value="weekends">Weekends (Sat-Sun)</option>
                      <option value="weekly">Weekly (Same day)</option>
                      <option value="monthly">Monthly (Same date)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={recurrenceEndDate}
                      onChange={(e) => setRecurrenceEndDate(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Leave empty to continue indefinitely
                    </p>
                  </div>

                  <button
                    onClick={handleSetRecurrence}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    Create Recurring Tasks
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

