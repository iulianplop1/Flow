import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useActivityStore } from '../stores/activityStore'
import { useFilterStore } from '../stores/filterStore'
import { useTimeBankStore } from '../stores/timeBankStore'
import { Task } from '../lib/types'
import Header from '../components/Header'
import TaskList from '../components/TaskList'
import SmartInput from '../components/SmartInput'
import FocusMode from '../components/FocusMode'
import AIScheduler from '../components/AIScheduler'
import EnhancedTimelineView from '../components/EnhancedTimelineView'
import AnalyticsDashboard from '../components/AnalyticsDashboard'
import { useSmartNotifications } from '../hooks/useSmartNotifications'
import RecurringTasks from '../components/RecurringTasks'
import TaskTemplates from '../components/TaskTemplates'
import CrisisButton from '../components/CrisisButton'
import SmartStart from '../components/SmartStart'

export default function Dashboard() {
  const { user } = useAuthStore()
  const {
    activities,
    tasks,
    setActivities,
    setTasks,
  } = useActivityStore()
  const { energyLevel } = useFilterStore()
  const { timeBank } = useTimeBankStore()
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [focusTask, setFocusTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'timeline' | 'analytics'>('list')
  const [timelineViewMode, setTimelineViewMode] = useState<'day' | 'week' | 'month'>('day')
  const [smartStartDismissed, setSmartStartDismissed] = useState(false)
  
  // Enable smart notifications
  useSmartNotifications(tasks, {
    enabled: true,
    reminderMinutes: 5,
    breakReminders: true,
    energyAlerts: true,
  })

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user, selectedDate])

  // Load tasks for week/month view
  useEffect(() => {
    if (user && timelineViewMode !== 'day') {
      loadExtendedData()
    }
  }, [user, selectedDate, timelineViewMode])

  const loadExtendedData = async () => {
    if (!user) return

    try {
      let startDate: Date
      let endDate: Date

      if (timelineViewMode === 'week') {
        const date = new Date(selectedDate)
        const dayOfWeek = date.getDay()
        startDate = new Date(date)
        startDate.setDate(date.getDate() - dayOfWeek)
        endDate = new Date(startDate)
        endDate.setDate(startDate.getDate() + 6)
      } else {
        // month
        const date = new Date(selectedDate)
        startDate = new Date(date.getFullYear(), date.getMonth(), 1)
        endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      }

      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*, activity:activities(*)')
        .eq('user_id', user.id)
        .gte('planned_date', startDate.toISOString().split('T')[0])
        .lte('planned_date', endDate.toISOString().split('T')[0])
        .order('planned_date', { ascending: true })
        .order('planned_time', { ascending: true, nullsFirst: true })

      if (tasksData) {
        useActivityStore.getState().setTasks(tasksData)
      }
    } catch (error) {
      console.error('Error loading extended data:', error)
    }
  }

  const loadData = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Load activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (activitiesError) throw activitiesError
      setActivities(activitiesData || [])

      // Load tasks for selected date
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*, activity:activities(*)')
        .eq('user_id', user.id)
        .eq('planned_date', selectedDate)
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('planned_time', { ascending: true, nullsFirst: true })
        .order('created_at', { ascending: true })

      if (tasksError) throw tasksError
      setTasks(tasksData || [])

      // Load time bank for today
      const today = new Date().toISOString().split('T')[0]
      const { data: timeBankData, error: timeBankError } = await supabase
        .from('time_bank')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle()

      // maybeSingle() returns null if no record, doesn't throw 406 error
      if (timeBankData && !timeBankError) {
        useTimeBankStore.getState().setTimeBank(timeBankData)
      }

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const filteredTasks = tasks.filter((task) => {
    if (!task.activity) return false
    if (energyLevel === 'Low' && task.activity.energy_level === 'High')
      return false
    if (energyLevel === 'High' && task.activity.energy_level === 'Low')
      return false
    return true
  })

  if (focusTask) {
    return (
      <FocusMode
        task={focusTask}
        onComplete={async (actualDuration) => {
          try {
            const plannedDuration = focusTask.activity?.duration_minutes || 0
            const savedMinutes = Math.max(0, plannedDuration - actualDuration)

            // Update task
            await supabase
              .from('tasks')
              .update({
                status: 'Completed',
                actual_duration: actualDuration,
                completed_at: new Date().toISOString(),
              })
              .eq('id', focusTask.id)

            // Add to time bank if time was saved
            if (savedMinutes > 0) {
              const today = new Date().toISOString().split('T')[0]
              const { data: existing } = await supabase
                .from('time_bank')
                .select('*')
                .eq('user_id', user!.id)
                .eq('date', today)
                .maybeSingle()

              if (existing) {
                await supabase
                  .from('time_bank')
                  .update({
                    minutes_saved: existing.minutes_saved + savedMinutes,
                  })
                  .eq('id', existing.id)
              } else {
                await supabase.from('time_bank').insert({
                  user_id: user!.id,
                  date: today,
                  minutes_saved: savedMinutes,
                  minutes_spent: 0,
                })
              }
              // Refresh time bank data
              const today = new Date().toISOString().split('T')[0]
              const { data: timeBankData } = await supabase
                .from('time_bank')
                .select('*')
                .eq('user_id', user!.id)
                .eq('date', today)
                .maybeSingle()
              
              if (timeBankData) {
                useTimeBankStore.getState().setTimeBank(timeBankData)
              }
            }

            // Check for habit stacking
            if (focusTask.activity?.linked_activity_id) {
              const linkedActivity = activities.find(
                (a) => a.id === focusTask.activity!.linked_activity_id
              )
              if (linkedActivity) {
                // Create task for linked activity
                const { data: newTask } = await supabase
                  .from('tasks')
                  .insert({
                    activity_id: linkedActivity.id,
                    user_id: user!.id,
                    planned_date: selectedDate,
                    status: 'Pending',
                  })
                  .select('*, activity:activities(*)')
                  .single()

                if (newTask) {
                  alert(
                    `Great job! Start your next habit: ${linkedActivity.name}`
                  )
                }
              }
            }

            // Close focus mode and refresh data
            setFocusTask(null)
            await loadData()
          } catch (error) {
            console.error('Error completing task:', error)
            // Still close focus mode even if there's an error
            setFocusTask(null)
          }
        }}
        onStop={() => setFocusTask(null)}
      />
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onSignOut={handleSignOut}
      />

      <main className="container mx-auto px-4 py-4 md:py-8 max-w-4xl">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Today's Tasks</h2>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {timeBank && timeBank.minutes_saved > 0 && (
                <div className="bg-green-900/50 border border-green-700 px-3 sm:px-4 py-1 sm:py-2 rounded-lg text-xs sm:text-sm">
                  <span className="text-green-300 font-semibold">
                    ⏱️ Time Bank: {timeBank.minutes_saved} min saved
                  </span>
                </div>
              )}
              <AIScheduler
                tasks={tasks.filter((t) => t.status === 'Pending')}
                selectedDate={selectedDate}
                onScheduled={async () => {
                  await loadData()
                }}
              />
              <RecurringTasks />
              <TaskTemplates />
            </div>
          </div>
        </div>

        <div className="mb-4 flex gap-2 flex-wrap">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg transition-colors text-sm ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-4 py-2 rounded-lg transition-colors text-sm ${
              viewMode === 'timeline'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Timeline
          </button>
          <button
            onClick={() => setViewMode('analytics')}
            className={`px-4 py-2 rounded-lg transition-colors text-sm ${
              viewMode === 'analytics'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Analytics
          </button>
        </div>

        {/* Smart Start Prompt */}
        {!smartStartDismissed && filteredTasks.filter((t) => t.status === 'Pending').length > 0 && (
          <SmartStart
            tasks={filteredTasks.filter((t) => t.status === 'Pending')}
            onStartTask={setFocusTask}
            onDismiss={() => setSmartStartDismissed(true)}
          />
        )}

        {viewMode === 'list' ? (
          <TaskList
            tasks={filteredTasks}
            onStartTask={setFocusTask}
            onTaskUpdate={async () => {
              await loadData()
            }}
          />
        ) : viewMode === 'timeline' ? (
          <EnhancedTimelineView
            tasks={filteredTasks}
            onStartTask={setFocusTask}
            onCompleteTask={async (task) => {
              await supabase
                .from('tasks')
                .update({
                  status: 'Completed',
                  completed_at: new Date().toISOString(),
                })
                .eq('id', task.id)
              await loadData()
            }}
            onTaskUpdate={async () => {
              await loadData()
            }}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            viewMode={timelineViewMode}
            onViewModeChange={setTimelineViewMode}
          />
        ) : (
          <AnalyticsDashboard />
        )}

        <div className="fixed bottom-6 right-6 flex flex-col gap-3">
          <CrisisButton
            tasks={tasks.filter((t) => t.status === 'Pending')}
            onReschedule={async () => {
              await loadData()
            }}
          />
          <SmartInput onTaskCreated={async () => {
            await loadData()
          }} />
        </div>
      </main>
    </div>
  )
}

