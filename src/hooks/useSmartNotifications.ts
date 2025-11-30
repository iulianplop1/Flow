import { useEffect, useState } from 'react'
import { Task } from '../lib/types'
import { supabase } from '../lib/supabase'

interface NotificationSettings {
  enabled: boolean
  reminderMinutes: number // Minutes before task to remind
  breakReminders: boolean
  energyAlerts: boolean
}

export function useSmartNotifications(
  tasks: Task[],
  settings: NotificationSettings = {
    enabled: true,
    reminderMinutes: 5,
    breakReminders: true,
    energyAlerts: true,
  }
) {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [notifiedTasks, setNotifiedTasks] = useState<Set<string>>(new Set())

  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(setPermission)
      } else {
        setPermission(Notification.permission)
      }
    }
  }, [])

  useEffect(() => {
    if (permission !== 'granted' || !settings.enabled) return

    const checkTasks = async () => {
      const now = new Date()

      // Check for task reminders
      tasks.forEach((task) => {
        if (task.status !== 'Pending' || !task.planned_time || !task.activity) return

        const [taskHour, taskMinute] = task.planned_time.split(':').map(Number)
        const taskTime = taskHour * 60 + taskMinute
        const currentTimeMinutes = now.getHours() * 60 + now.getMinutes()
        const reminderTime = taskTime - settings.reminderMinutes

        const notificationKey = `notified-${task.id}-${new Date().toDateString()}`

        // Reminder notification
        if (
          currentTimeMinutes >= reminderTime &&
          currentTimeMinutes < taskTime &&
          !notifiedTasks.has(notificationKey)
        ) {
          // Get AI suggestion for preparation
          getAIPreparationSuggestion(task).then((suggestion) => {
            new Notification(`⏰ Reminder: ${task.activity?.name}`, {
              body: suggestion || `Starting in ${settings.reminderMinutes} minutes. Duration: ${task.activity?.duration_minutes} min`,
              icon: '/vite.svg',
              tag: `reminder-${task.id}`,
              requireInteraction: false,
            })
          })

          setNotifiedTasks((prev) => new Set(prev).add(notificationKey))
        }

        // Task start notification
        if (currentTimeMinutes === taskTime && !notifiedTasks.has(`start-${notificationKey}`)) {
          new Notification(`🚀 Time to start: ${task.activity?.name}`, {
            body: `Scheduled at ${task.planned_time}. Duration: ${task.activity?.duration_minutes} minutes`,
            icon: '/vite.svg',
            tag: `start-${task.id}`,
            requireInteraction: false,
          })

          setNotifiedTasks((prev) => new Set(prev).add(`start-${notificationKey}`))
        }
      })

      // Check for break reminders
      if (settings.breakReminders) {
        checkBreakReminders(tasks, now)
      }

      // Check for energy level alerts
      if (settings.energyAlerts) {
        checkEnergyAlerts(tasks)
      }
    }

    // Check every minute
    const interval = setInterval(checkTasks, 60000)
    checkTasks() // Check immediately

    return () => clearInterval(interval)
  }, [tasks, permission, settings, notifiedTasks])

  const getAIPreparationSuggestion = async (task: Task): Promise<string | null> => {
    try {
      const { data } = await supabase.functions.invoke('smart-reminder', {
        body: {
          task: {
            name: task.activity?.name,
            tag: task.activity?.tag,
            energy_level: task.activity?.energy_level,
            duration: task.activity?.duration_minutes,
          },
          reminder_minutes: settings.reminderMinutes,
        },
      })

      return data?.suggestion || null
    } catch (error) {
      console.error('Error getting AI suggestion:', error)
      return null
    }
  }

  const checkBreakReminders = (tasks: Task[], now: Date) => {
    // Find completed tasks in last hour
    const recentCompleted = tasks.filter((t) => {
      if (t.status !== 'Completed' || !t.completed_at) return false
      const completed = new Date(t.completed_at)
      const diff = now.getTime() - completed.getTime()
      return diff < 60 * 60 * 1000 && diff > 0 // Within last hour
    })

    // Check if there's a gap before next task
    const nextTask = tasks
      .filter((t) => t.status === 'Pending' && t.planned_time)
      .sort((a, b) => {
        if (!a.planned_time || !b.planned_time) return 0
        return a.planned_time.localeCompare(b.planned_time)
      })[0]

    if (recentCompleted.length > 0 && nextTask && nextTask.planned_time) {
      const [nextHour, nextMinute] = nextTask.planned_time.split(':').map(Number)
      const nextTime = nextHour * 60 + nextMinute
      const currentTimeMinutes = now.getHours() * 60 + now.getMinutes()
      const gap = nextTime - currentTimeMinutes

      // Suggest break if gap is 10-30 minutes
      if (gap >= 10 && gap <= 30) {
        const breakKey = `break-${nextTask.id}-${now.toDateString()}`
        if (!notifiedTasks.has(breakKey)) {
          new Notification('☕ Break Time!', {
            body: `You have ${gap} minutes before your next task. Consider taking a short break!`,
            icon: '/vite.svg',
            tag: breakKey,
          })
          setNotifiedTasks((prev) => new Set(prev).add(breakKey))
        }
      }
    }
  }

  const checkEnergyAlerts = (tasks: Task[]) => {
    // Check for high-energy tasks scheduled in evening
    const highEnergyTasks = tasks.filter(
      (t) =>
        t.status === 'Pending' &&
        t.planned_time &&
        t.activity?.energy_level === 'High'
    )

    highEnergyTasks.forEach((task) => {
      if (!task.planned_time) return
      const [taskHour] = task.planned_time.split(':').map(Number)

      if (taskHour >= 18) {
        const alertKey = `energy-alert-${task.id}`
        if (!notifiedTasks.has(alertKey)) {
          new Notification('⚠️ Energy Level Alert', {
            body: `You have a high-energy task "${task.activity?.name}" scheduled for ${task.planned_time}. Consider rescheduling if you're feeling tired.`,
            icon: '/vite.svg',
            tag: alertKey,
          })
          setNotifiedTasks((prev) => new Set(prev).add(alertKey))
        }
      }
    })
  }

  return { permission }
}

