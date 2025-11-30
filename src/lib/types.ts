export interface Profile {
  id: string
  username: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Activity {
  id: string
  user_id: string
  name: string
  duration_minutes: number
  min_duration: number
  tag: string
  energy_level: 'High' | 'Medium' | 'Low'
  recurrence: string | null
  recurrence_pattern: string | null
  recurrence_end_date: string | null
  linked_activity_id: string | null
  created_at: string
  updated_at: string
}

export interface TaskTemplate {
  id: string
  user_id: string
  name: string
  description: string | null
  activity_ids: string[]
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  activity_id: string
  user_id: string
  status: 'Pending' | 'Completed' | 'Skipped'
  planned_date: string
  planned_time: string | null // Time in HH:MM format
  sort_order: number | null
  actual_duration: number | null
  completed_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
  activity?: Activity
}

export interface TimeBank {
  id: string
  user_id: string
  date: string
  minutes_saved: number
  minutes_spent: number
  created_at: string
  updated_at: string
}

export type EnergyLevel = 'High' | 'Medium' | 'Low'

export interface ParsedTaskInput {
  name: string
  duration: number
  tag: string
  energy_level: EnergyLevel
  recurrence?: string
  planned_time?: string // Optional time in HH:MM format
}

export interface ScheduledTask {
  task_id?: string
  activity_id?: string
  name: string
  duration: number
  tag: string
  energy_level: EnergyLevel
  planned_time: string // HH:MM format
  sort_order: number
}

