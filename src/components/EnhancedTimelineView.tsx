import { useState, useMemo, useRef } from 'react'
import { Task } from '../lib/types'
import { Clock, Play, CheckCircle2, Circle, GripVertical, ZoomIn, ZoomOut, AlertTriangle } from 'lucide-react'
import { DndContext, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverlay, DragStartEvent, useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { supabase } from '../lib/supabase'

interface EnhancedTimelineViewProps {
  tasks: Task[]
  onStartTask: (task: Task) => void
  onCompleteTask: (task: Task) => void
  onTaskUpdate: () => Promise<void>
  selectedDate: string
  onDateChange: (date: string) => void
  viewMode: 'day' | 'week' | 'month'
  onViewModeChange: (mode: 'day' | 'week' | 'month') => void
}

function DraggableTask({ task, onStartTask, getTaskPosition, getStatusColor, hasConflict, isDragging }: any) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
    disabled: task.status === 'Completed' || task.status === 'Skipped',
  })

  const style = {
    transform: CSS.Translate.toString(transform),
  }

  const { top, height } = getTaskPosition(task)
  const colorClasses = getStatusColor(task)

  return (
    <div
      ref={setNodeRef}
      className={`absolute left-0 right-0 rounded-lg border-2 p-2 cursor-move hover:opacity-80 transition-opacity ${colorClasses} ${hasConflict ? 'border-red-500 border-4 animate-pulse' : ''} ${isDragging ? 'opacity-50' : ''}`}
      style={{
        ...style,
        top: `${top}px`,
        height: `${Math.max(height, 40)}px`,
        zIndex: isDragging ? 50 : hasConflict ? 15 : 10,
      }}
      onClick={() => {
        if (task.status === 'Pending' && !isDragging) {
          onStartTask(task)
        }
      }}
      title={hasConflict ? '⚠️ This task overlaps with another task!' : ''}
    >
      <div className="flex items-center justify-between h-full">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
          {hasConflict && <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate">{task.activity?.name}</div>
            <div className="text-xs text-gray-300 mt-1">
              {task.planned_time} • {task.activity?.duration_minutes} min
            </div>
            <div className="text-xs text-gray-400 mt-1">{task.activity?.tag}</div>
          </div>
        </div>
        <div className="flex-shrink-0 ml-2">
          {task.status === 'Completed' ? (
            <CheckCircle2 className="w-4 h-4 text-green-400" />
          ) : task.status === 'Pending' ? (
            <Circle className="w-4 h-4 text-gray-400" />
          ) : null}
        </div>
      </div>
    </div>
  )
}

function DroppableTimeline({ id, children, className, style }: { id: string; children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  })

  return (
    <div
      ref={setNodeRef}
      className={`${className || ''} ${isOver ? 'bg-blue-900/20' : ''}`}
      style={style}
    >
      {children}
    </div>
  )
}

function DroppableTimeSlot({ time, children, hourHeight }: { time: string; children: React.ReactNode; hourHeight: number }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `time-slot-${time}`,
  })

  return (
    <div
      ref={setNodeRef}
      data-time-slot={`time-slot-${time}`}
      className={`relative ${isOver ? 'bg-blue-900/30' : ''}`}
      style={{ height: `${hourHeight}px` }}
    >
      {children}
    </div>
  )
}

export default function EnhancedTimelineView({
  tasks,
  onStartTask,
  onCompleteTask: _onCompleteTask,
  onTaskUpdate,
  selectedDate,
  onDateChange: _onDateChange,
  viewMode,
  onViewModeChange,
}: EnhancedTimelineViewProps) {
  const [zoomLevel, setZoomLevel] = useState(1) // 1 = normal, 2 = 2x zoom
  const [activeId, setActiveId] = useState<string | null>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Detect conflicts
  const conflicts = useMemo(() => {
    const conflictsMap: { [key: string]: boolean } = {}
    const tasksWithTime = tasks.filter((t) => t.planned_time && t.status === 'Pending')

    for (let i = 0; i < tasksWithTime.length; i++) {
      const task1 = tasksWithTime[i]
      if (!task1.planned_time || !task1.activity) continue

      const [h1, m1] = task1.planned_time.split(':').map(Number)
      const start1 = h1 * 60 + m1
      const end1 = start1 + (task1.activity.duration_minutes || 30)

      for (let j = i + 1; j < tasksWithTime.length; j++) {
        const task2 = tasksWithTime[j]
        if (!task2.planned_time || !task2.activity) continue

        const [h2, m2] = task2.planned_time.split(':').map(Number)
        const start2 = h2 * 60 + m2
        const end2 = start2 + (task2.activity.duration_minutes || 30)

        // Check if tasks overlap
        if ((start1 < end2 && end1 > start2)) {
          conflictsMap[task1.id] = true
          conflictsMap[task2.id] = true
        }
      }
    }

    return conflictsMap
  }, [tasks])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeTask = tasks.find((t) => t.id === active.id)
    if (!activeTask || !activeTask.activity) return

    // Check if dropped on timeline or a time slot
    const isTimelineDrop = over.id === 'timeline-drop-zone'
    const isTimeSlotDrop = typeof over.id === 'string' && over.id.startsWith('time-slot-')

    if (!isTimelineDrop && !isTimeSlotDrop) return

    // Calculate new time based on drop position
    const timelineElement = timelineRef.current
    if (!timelineElement) return

    const rect = timelineElement.getBoundingClientRect()
    let dropY = 0

    if (isTimeSlotDrop && over.rect) {
      // Use the center of the drop zone for more accurate positioning
      const dropZoneCenter = over.rect.top + over.rect.height / 2
      dropY = dropZoneCenter - rect.top
    } else if (over.rect) {
      // Dropped on timeline zone - use top of drop zone
      dropY = over.rect.top - rect.top
    }

    // Calculate time from Y position
    // Each hour = hourHeight pixels, starting from 6 AM
    const hourHeight = 80 * zoomLevel
    const totalMinutes = (dropY / hourHeight) * 60 + 6 * 60 // Add 6 hours offset
    const hours = Math.floor(totalMinutes / 60)
    const minutes = Math.floor(totalMinutes % 60)

    // Round to nearest 15 minutes for better UX
    const roundedMinutes = Math.round(minutes / 15) * 15
    const finalHours = hours + Math.floor(roundedMinutes / 60)
    const finalMinutes = roundedMinutes % 60

    // Ensure time is within valid range (6 AM - 11:59 PM)
    if (finalHours < 6 || finalHours >= 24) return

    const newTime = `${String(finalHours).padStart(2, '0')}:${String(finalMinutes).padStart(2, '0')}`

    // Update task time
    await supabase
      .from('tasks')
      .update({ planned_time: newTime })
      .eq('id', activeTask.id)

    await onTaskUpdate()
  }

  // Filter tasks that have activity relation and planned_time
  const tasksWithTime = useMemo(() => {
    return tasks.filter((t) => t.planned_time && t.activity)
  }, [tasks])
  
  // Sort tasks by time
  const sortedTasks = useMemo(() => {
    return [...tasksWithTime].sort((a, b) => {
      if (!a.planned_time || !b.planned_time) return 0
      return a.planned_time.localeCompare(b.planned_time)
    })
  }, [tasksWithTime])

  // Group tasks by hour
  const tasksByHour = useMemo(() => {
    const grouped: { [hour: string]: Task[] } = {}
    sortedTasks.forEach((task) => {
      if (task.planned_time) {
        const hour = task.planned_time.split(':')[0]
        if (!grouped[hour]) {
          grouped[hour] = []
        }
        grouped[hour].push(task)
      }
    })
    return grouped
  }, [sortedTasks])

  // Generate time slots from 6 AM to 11 PM
  const timeSlots: string[] = []
  for (let hour = 6; hour < 24; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`)
  }

  const getTaskPosition = (task: Task, zoom: number = 1): { top: number; height: number } => {
    if (!task.planned_time || !task.activity) return { top: 0, height: 0 }

    const [hours, minutes] = task.planned_time.split(':').map(Number)
    const startMinutes = hours * 60 + minutes
    const duration = task.activity.duration_minutes || 30

    // Each hour = 80px * zoom, each minute = (80/60) * zoom
    const hourHeight = 80 * zoom
    const top = ((startMinutes - 6 * 60) / 60) * hourHeight
    const height = (duration / 60) * hourHeight

    return { top, height }
  }

  const getStatusColor = (task: Task): string => {
    // Enhanced color-coding with better visual distinction
    if (task.status === 'Completed') {
      return 'bg-green-600/70 border-green-400 shadow-lg shadow-green-500/20'
    }
    if (task.status === 'Skipped') {
      return 'bg-red-600/70 border-red-400 shadow-lg shadow-red-500/20'
    }
    
    // Color by energy level with distinct colors
    if (task.activity?.energy_level === 'High') {
      return 'bg-blue-600/70 border-blue-400 shadow-lg shadow-blue-500/20 hover:bg-blue-600/80'
    }
    if (task.activity?.energy_level === 'Low') {
      return 'bg-purple-600/70 border-purple-400 shadow-lg shadow-purple-500/20 hover:bg-purple-600/80'
    }
    // Medium energy or default
    return 'bg-amber-600/70 border-amber-400 shadow-lg shadow-amber-500/20 hover:bg-amber-600/80'
  }

  const hourHeight = 80 * zoomLevel

  // For week/month view, we'll show a simplified calendar view
  // For now, day view is fully implemented, week/month are placeholders
  const renderWeekView = () => {
    const startDate = new Date(selectedDate)
    const dayOfWeek = startDate.getDay()
    startDate.setDate(startDate.getDate() - dayOfWeek) // Start of week (Sunday)

    const weekDays = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      weekDays.push(date)
    }

    return (
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((date) => {
          const dateStr = date.toISOString().split('T')[0]
          const dayTasks = tasks.filter((t) => t.planned_date === dateStr)
          return (
            <div key={dateStr} className="bg-gray-800 rounded-lg p-2 border border-gray-700">
              <div className="text-xs font-semibold mb-2">
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className="text-sm mb-2">{date.getDate()}</div>
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className="text-xs bg-blue-600/50 rounded px-1 py-0.5 truncate"
                    title={task.activity?.name}
                  >
                    {task.planned_time} {task.activity?.name}
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div className="text-xs text-gray-400">+{dayTasks.length - 3} more</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderMonthView = () => {
    const date = new Date(selectedDate)
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }

    return (
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-xs font-semibold text-gray-400 p-2 text-center">
            {day}
          </div>
        ))}
        {days.map((day, index) => {
          if (day === null) {
            return <div key={index} className="p-2"></div>
          }

          const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const dayTasks = tasks.filter((t) => t.planned_date === dateStr)

          return (
            <div
              key={index}
              className={`bg-gray-800 rounded p-1 border border-gray-700 min-h-[60px] ${
                dateStr === selectedDate ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="text-xs font-semibold mb-1">{day}</div>
              <div className="space-y-0.5">
                {dayTasks.slice(0, 2).map((task) => (
                  <div
                    key={task.id}
                    className="text-[10px] bg-blue-600/50 rounded px-1 truncate"
                    title={task.activity?.name}
                  >
                    {task.planned_time?.slice(0, 5)} {task.activity?.name?.slice(0, 10)}
                  </div>
                ))}
                {dayTasks.length > 2 && (
                  <div className="text-[10px] text-gray-400">+{dayTasks.length - 2}</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="bg-gray-900 rounded-lg p-4 md:p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Timeline View
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => onViewModeChange('day')}
              className={`px-3 py-1 rounded text-sm ${
                viewMode === 'day' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => onViewModeChange('week')}
              className={`px-3 py-1 rounded text-sm ${
                viewMode === 'week' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => onViewModeChange('month')}
              className={`px-3 py-1 rounded text-sm ${
                viewMode === 'month' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Month
            </button>
          </div>
          {viewMode === 'day' && (
            <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}
                className="p-1 text-gray-400 hover:text-white"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs text-gray-400 px-2">{Math.round(zoomLevel * 100)}%</span>
              <button
                onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.25))}
                className="p-1 text-gray-400 hover:text-white"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {Object.keys(conflicts).length > 0 && (
        <div className="mb-4 bg-red-900/50 border border-red-700 rounded-lg p-3 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <span className="text-red-300 text-sm">
            Warning: {Object.keys(conflicts).length} task(s) have scheduling conflicts!
          </span>
        </div>
      )}

      {viewMode === 'day' && (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="relative overflow-x-auto" ref={timelineRef}>
            <DroppableTimeline id="timeline-drop-zone" className="flex flex-col gap-0" style={{ minWidth: '600px' }}>
              {timeSlots.map((time) => (
                <DroppableTimeSlot key={time} time={time} hourHeight={hourHeight}>
                  <div className="flex items-start gap-4 border-b border-gray-800 h-full">
                    <div className="w-16 text-sm text-gray-400 font-mono flex-shrink-0 pt-1">
                      {time}
                    </div>
                    <div className="flex-1 relative min-h-full">
                      {tasksByHour[time.split(':')[0]]?.map((task) => {
                        if (!task.activity) {
                          console.warn('Task missing activity:', task)
                          return null
                        }
                        return (
                          <DraggableTask
                            key={task.id}
                            task={task}
                            onStartTask={onStartTask}
                            getTaskPosition={(t: Task) => getTaskPosition(t, zoomLevel)}
                            getStatusColor={getStatusColor}
                            hasConflict={conflicts[task.id] || false}
                            isDragging={activeId === task.id}
                          />
                        )
                      })}
                    </div>
                  </div>
                </DroppableTimeSlot>
              ))}
            </DroppableTimeline>
            
            {/* Debug info - remove in production */}
            {tasks.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
                No tasks for this date. Create tasks with a time to see them on the timeline.
              </div>
            )}
            {tasks.length > 0 && tasksWithTime.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
                {tasks.length} task(s) found, but none have a scheduled time. Add a time to tasks to see them on the timeline.
              </div>
            )}

            {/* Current time indicator */}
            {(() => {
              const now = new Date()
              const currentHour = now.getHours()
              const currentMinute = now.getMinutes()
              const currentMinutes = currentHour * 60 + currentMinute
              if (currentMinutes >= 6 * 60 && currentMinutes < 24 * 60) {
                const top = ((currentMinutes - 6 * 60) / 60) * hourHeight
                return (
                  <div
                    className="absolute left-0 right-0 border-t-2 border-red-500 z-20 pointer-events-none"
                    style={{ top: `${top}px` }}
                  >
                    <div className="absolute -left-2 -top-2 w-4 h-4 bg-red-500 rounded-full"></div>
                    <div className="absolute -right-2 -top-2 text-xs text-red-400 font-mono bg-gray-900 px-1">
                      {now.toTimeString().slice(0, 5)}
                    </div>
                  </div>
                )
              }
              return null
            })()}
          </div>

          {/* Drag overlay */}
          <DragOverlay>
            {activeId ? (() => {
              const activeTask = tasks.find((t) => t.id === activeId)
              if (!activeTask) return null
              const colorClasses = getStatusColor(activeTask)
              return (
                <div className={`rounded-lg border-2 p-2 ${colorClasses} opacity-90 shadow-2xl`} style={{ width: '300px' }}>
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{activeTask.activity?.name}</div>
                      <div className="text-xs text-gray-300 mt-1">
                        {activeTask.planned_time} • {activeTask.activity?.duration_minutes} min
                      </div>
                    </div>
                  </div>
                </div>
              )
            })() : null}
          </DragOverlay>
        </DndContext>
      )}

      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'month' && renderMonthView()}

      {/* Unscheduled tasks */}
      {tasks.filter((t) => !t.planned_time && t.status === 'Pending').length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-800">
          <h4 className="text-sm font-semibold text-gray-400 mb-3">Unscheduled Tasks</h4>
          <div className="space-y-2">
            {tasks
              .filter((t) => !t.planned_time && t.status === 'Pending')
              .map((task) => (
                <div
                  key={task.id}
                  className="bg-gray-800 rounded-lg p-3 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold">{task.activity?.name}</div>
                    <div className="text-xs text-gray-400">
                      {task.activity?.duration_minutes} min • {task.activity?.tag}
                    </div>
                  </div>
                  <button
                    onClick={() => onStartTask(task)}
                    className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

