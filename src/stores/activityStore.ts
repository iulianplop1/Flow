import { create } from 'zustand'
import { Activity, Task } from '../lib/types'

interface ActivityState {
  activities: Activity[]
  tasks: Task[]
  setActivities: (activities: Activity[]) => void
  setTasks: (tasks: Task[]) => void
  addActivity: (activity: Activity) => void
  updateActivity: (id: string, updates: Partial<Activity>) => void
  deleteActivity: (id: string) => void
  addTask: (task: Task) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  refreshActivities: () => Promise<void>
  refreshTasks: (date?: string) => Promise<void>
}

export const useActivityStore = create<ActivityState>((set) => ({
  activities: [],
  tasks: [],
  setActivities: (activities) => set({ activities }),
  setTasks: (tasks) => set({ tasks }),
  addActivity: (activity) =>
    set((state) => ({ activities: [...state.activities, activity] })),
  updateActivity: (id, updates) =>
    set((state) => ({
      activities: state.activities.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      ),
    })),
  deleteActivity: (id) =>
    set((state) => ({
      activities: state.activities.filter((a) => a.id !== id),
    })),
  addTask: (task) =>
    set((state) => ({ tasks: [...state.tasks, task] })),
  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    })),
  refreshActivities: async () => {
    // This will be implemented in the component
  },
  refreshTasks: async (_date?: string) => {
    // This will be implemented in the component
  },
}))

