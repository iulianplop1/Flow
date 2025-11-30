import { useEffect, useState } from 'react'
import { Task } from '../lib/types'

export function useNotifications(tasks: Task[]) {
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(setPermission)
      } else {
        setPermission(Notification.permission)
      }
    }
  }, [])

  useEffect(() => {
    if (permission !== 'granted') return

    const checkTasks = () => {
      const now = new Date()
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

      tasks.forEach((task) => {
        if (
          task.status === 'Pending' &&
          task.planned_time &&
          task.planned_time === currentTime
        ) {
          // Check if we've already notified for this task today
          const notificationKey = `notified-${task.id}-${new Date().toDateString()}`
          if (!localStorage.getItem(notificationKey)) {
            new Notification(`Time for: ${task.activity?.name || 'Task'}`, {
              body: `Scheduled at ${task.planned_time}. Duration: ${task.activity?.duration_minutes || 30} minutes`,
              icon: '/vite.svg',
              tag: task.id,
              requireInteraction: false,
            })

            localStorage.setItem(notificationKey, 'true')
          }
        }
      })
    }

    // Check every minute
    const interval = setInterval(checkTasks, 60000)
    checkTasks() // Check immediately

    return () => clearInterval(interval)
  }, [tasks, permission])

  return { permission }
}

