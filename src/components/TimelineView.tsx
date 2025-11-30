import { Task } from '../lib/types'
import { Clock, Play, CheckCircle2, Circle, GripVertical } from 'lucide-react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { supabase } from '../lib/supabase'

interface TimelineViewProps {
  tasks: Task[]
  onStartTask: (task: Task) => void
  onCompleteTask: (task: Task) => void
  onTaskUpdate: () => Promise<void>
}

function DraggableTask({ task, onStartTask, getTaskPosition, getStatusColor }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const { top, height } = getTaskPosition(task)

  return (
    <div
      ref={setNodeRef}
      className={`absolute left-0 right-0 rounded-lg border-2 p-2 cursor-move hover:opacity-80 transition-opacity ${getStatusColor(task)}`}
      style={{
        ...style,
        top: `${top}px`,
        height: `${Math.max(height, 40)}px`,
        zIndex: isDragging ? 50 : 10,
      }}
      onClick={() => {
        if (task.status === 'Pending' && !isDragging) {
          onStartTask(task)
        }
      }}
    >
      <div className="flex items-center justify-between h-full">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
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

export default function TimelineView({ tasks, onStartTask, onCompleteTask: _onCompleteTask, onTaskUpdate }: TimelineViewProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeTask = tasks.find((t) => t.id === active.id)
    const overTask = tasks.find((t) => t.id === over.id)

    if (!activeTask || !overTask || !activeTask.planned_time || !overTask.planned_time) return

    // Swap times
    const tempTime = activeTask.planned_time
    await supabase
      .from('tasks')
      .update({ planned_time: overTask.planned_time })
      .eq('id', activeTask.id)
    await supabase
      .from('tasks')
      .update({ planned_time: tempTime })
      .eq('id', overTask.id)

    await onTaskUpdate()
  }
  // Sort tasks by time
  const sortedTasks = [...tasks]
    .filter((t) => t.planned_time)
    .sort((a, b) => {
      if (!a.planned_time || !b.planned_time) return 0
      return a.planned_time.localeCompare(b.planned_time)
    })

  // Group tasks by hour
  const tasksByHour: { [hour: string]: Task[] } = {}
  sortedTasks.forEach((task) => {
    if (task.planned_time) {
      const hour = task.planned_time.split(':')[0]
      if (!tasksByHour[hour]) {
        tasksByHour[hour] = []
      }
      tasksByHour[hour].push(task)
    }
  })

  // Generate time slots from 6 AM to 11 PM
  const timeSlots: string[] = []
  for (let hour = 6; hour < 24; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`)
  }

  const getTaskPosition = (task: Task): { top: number; height: number } => {
    if (!task.planned_time || !task.activity) return { top: 0, height: 0 }
    
    const [hours, minutes] = task.planned_time.split(':').map(Number)
    const startMinutes = hours * 60 + minutes
    const duration = task.activity.duration_minutes || 30
    
    // Each hour = 80px, each minute = 80/60 = 1.33px
    const top = ((startMinutes - 6 * 60) / 60) * 80
    const height = (duration / 60) * 80
    
    return { top, height }
  }

  const getStatusColor = (task: Task): string => {
    if (task.status === 'Completed') return 'bg-green-600/50 border-green-500'
    if (task.status === 'Skipped') return 'bg-red-600/50 border-red-500'
    if (task.activity?.energy_level === 'High') return 'bg-blue-600/50 border-blue-500'
    if (task.activity?.energy_level === 'Low') return 'bg-purple-600/50 border-purple-500'
    return 'bg-gray-600/50 border-gray-500'
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5" />
        Daily Timeline
      </h3>
      
      <div className="relative">
        {/* Time labels */}
        <div className="flex flex-col gap-0 mb-4">
          {timeSlots.map((time) => (
            <div
              key={time}
              className="flex items-start gap-4 h-20 border-b border-gray-800"
            >
              <div className="w-16 text-sm text-gray-400 font-mono flex-shrink-0 pt-1">
                {time}
              </div>
              <div className="flex-1 relative min-h-[80px]">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={tasksByHour[time.split(':')[0]]?.map((t) => t.id) || []}
                    strategy={verticalListSortingStrategy}
                  >
                    {/* Tasks for this hour */}
                    {tasksByHour[time.split(':')[0]]?.map((task) => (
                      <DraggableTask
                        key={task.id}
                        task={task}
                        onStartTask={onStartTask}
                        getTaskPosition={getTaskPosition}
                        getStatusColor={getStatusColor}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          ))}
        </div>

        {/* Current time indicator */}
        {(() => {
          const now = new Date()
          const currentHour = now.getHours()
          const currentMinute = now.getMinutes()
          const currentMinutes = currentHour * 60 + currentMinute
          if (currentMinutes >= 6 * 60 && currentMinutes < 24 * 60) {
            const top = ((currentMinutes - 6 * 60) / 60) * 80
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

