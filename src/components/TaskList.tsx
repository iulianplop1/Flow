import { Task } from '../lib/types'
import { CheckCircle2, Circle, X, Play, SkipForward, Clock, Edit2, GripVertical } from 'lucide-react'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import SocraticDebriefer from './SocraticDebriefer'

interface TaskListProps {
  tasks: Task[]
  onStartTask: (task: Task) => void
  onTaskUpdate: () => Promise<void>
}

export default function TaskList({ tasks, onStartTask, onTaskUpdate }: TaskListProps) {
  const [skippingTask, setSkippingTask] = useState<Task | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editTime, setEditTime] = useState('')
  const [editDuration, setEditDuration] = useState(0)

  // Sort tasks by sort_order or planned_time
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.sort_order !== null && b.sort_order !== null) {
      return a.sort_order - b.sort_order
    }
    if (a.planned_time && b.planned_time) {
      return a.planned_time.localeCompare(b.planned_time)
    }
    if (a.planned_time) return -1
    if (b.planned_time) return 1
    return 0
  })

  const handleComplete = async (task: Task) => {
    await supabase
      .from('tasks')
      .update({
        status: 'Completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', task.id)
    await onTaskUpdate()
  }

  const handleSkip = (task: Task) => {
    setSkippingTask(task)
  }

  const handleSkipConfirmed = async () => {
    if (skippingTask) {
      await supabase
        .from('tasks')
        .update({
          status: 'Skipped',
        })
        .eq('id', skippingTask.id)
      await onTaskUpdate()
      setSkippingTask(null)
    }
  }

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setEditTime(task.planned_time || '')
    setEditDuration(task.activity?.duration_minutes || 30)
  }

  const handleSaveEdit = async () => {
    if (!editingTask) return

    try {
      // Update task time
      await supabase
        .from('tasks')
        .update({
          planned_time: editTime || null,
        })
        .eq('id', editingTask.id)

      // Update activity duration if changed
      if (editingTask.activity_id && editDuration !== editingTask.activity?.duration_minutes) {
        await supabase
          .from('activities')
          .update({
            duration_minutes: editDuration,
          })
          .eq('id', editingTask.activity_id)
      }

      setEditingTask(null)
      await onTaskUpdate()
    } catch (error) {
      console.error('Error updating task:', error)
      alert('Failed to update task')
    }
  }

  const handleMoveUp = async (task: Task, index: number) => {
    if (index === 0) return
    const prevTask = sortedTasks[index - 1]
    const currentOrder = task.sort_order ?? index
    const prevOrder = prevTask.sort_order ?? index - 1

    await supabase
      .from('tasks')
      .update({ sort_order: prevOrder })
      .eq('id', task.id)
    await supabase
      .from('tasks')
      .update({ sort_order: currentOrder })
      .eq('id', prevTask.id)
    await onTaskUpdate()
  }

  const handleMoveDown = async (task: Task, index: number) => {
    if (index === sortedTasks.length - 1) return
    const nextTask = sortedTasks[index + 1]
    const currentOrder = task.sort_order ?? index
    const nextOrder = nextTask.sort_order ?? index + 1

    await supabase
      .from('tasks')
      .update({ sort_order: nextOrder })
      .eq('id', task.id)
    await supabase
      .from('tasks')
      .update({ sort_order: currentOrder })
      .eq('id', nextTask.id)
    await onTaskUpdate()
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>No tasks for this day. Create one using the Smart Input!</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {sortedTasks.map((task, index) => (
          <div
            key={task.id}
            className={`bg-gray-800 border rounded-lg p-4 transition-all ${
              task.status === 'Completed'
                ? 'border-green-700 opacity-60'
                : task.status === 'Skipped'
                ? 'border-red-700 opacity-60'
                : 'border-gray-700 hover:border-gray-600'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {task.status === 'Completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  ) : task.status === 'Skipped' ? (
                    <X className="w-5 h-5 text-red-500 flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                  {task.status === 'Pending' && (
                    <button
                      onClick={() => handleMoveUp(task, index)}
                      disabled={index === 0}
                      className="text-gray-500 hover:text-gray-300 disabled:opacity-30"
                      title="Move up"
                    >
                      ↑
                    </button>
                  )}
                  <h3 className="font-semibold text-lg">{task.activity?.name || 'Unknown Activity'}</h3>
                  {task.planned_time && (
                    <div className="flex items-center gap-1 text-blue-400 text-sm">
                      <Clock className="w-4 h-4" />
                      {task.planned_time}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 ml-8 mb-3">
                  <span className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-300">
                    {task.activity?.tag}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      task.activity?.energy_level === 'High'
                        ? 'bg-blue-900/50 text-blue-300'
                        : task.activity?.energy_level === 'Low'
                        ? 'bg-purple-900/50 text-purple-300'
                        : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    {task.activity?.energy_level} Energy
                  </span>
                  <span className="text-xs text-gray-400">
                    {task.activity?.duration_minutes} min
                  </span>
                  {task.actual_duration && (
                    <span className="text-xs text-green-400">
                      Actual: {task.actual_duration} min
                    </span>
                  )}
                </div>

                {task.notes && (
                  <p className="text-sm text-gray-400 ml-8 mb-2">{task.notes}</p>
                )}
              </div>

              {task.status === 'Pending' && (
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(task)}
                    className="p-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                    title="Edit Time/Duration"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onStartTask(task)}
                    className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    title="Start Focus Mode"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleComplete(task)}
                    className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                    title="Mark Complete"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleSkip(task)}
                    className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    title="Skip"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                  {index < sortedTasks.length - 1 && (
                    <button
                      onClick={() => handleMoveDown(task, index)}
                      className="text-gray-500 hover:text-gray-300"
                      title="Move down"
                    >
                      ↓
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {skippingTask && (
        <SocraticDebriefer
          task={skippingTask}
          onClose={() => setSkippingTask(null)}
          onSkip={handleSkipConfirmed}
          onReschedule={async (newDate: string) => {
            await supabase
              .from('tasks')
              .update({
                planned_date: newDate,
                status: 'Pending',
              })
              .eq('id', skippingTask.id)
            await onTaskUpdate()
            setSkippingTask(null)
          }}
        />
      )}

      {editingTask && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-xl font-bold mb-4">Edit Task</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Time
                </label>
                <input
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  value={editDuration}
                  onChange={(e) => setEditDuration(Number(e.target.value))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

