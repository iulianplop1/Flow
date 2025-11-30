import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Clock, CheckCircle2, Target } from 'lucide-react'

interface AnalyticsData {
  completionRate: number
  totalTasks: number
  completedTasks: number
  averageDuration: number
  timeSaved: number
  tasksByTag: { name: string; value: number }[]
  tasksByEnergy: { name: string; value: number }[]
  weeklyCompletion: { day: string; completed: number; total: number }[]
}

export default function AnalyticsDashboard() {
  const { user } = useAuthStore()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState(7) // days

  useEffect(() => {
    if (user) {
      loadAnalytics()
    }
  }, [user, dateRange])

  const loadAnalytics = async () => {
    if (!user) return

    setLoading(true)
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - dateRange)

      // Get all tasks in date range
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*, activity:activities(*)')
        .eq('user_id', user.id)
        .gte('planned_date', startDate.toISOString().split('T')[0])
        .lte('planned_date', endDate.toISOString().split('T')[0])

      if (error) throw error

      // Calculate metrics
      const totalTasks = tasks?.length || 0
      const completedTasks = tasks?.filter((t) => t.status === 'Completed').length || 0
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

      // Average duration
      const completedWithDuration = tasks?.filter(
        (t) => t.status === 'Completed' && t.actual_duration
      ) || []
      const averageDuration =
        completedWithDuration.length > 0
          ? completedWithDuration.reduce((sum, t) => sum + (t.actual_duration || 0), 0) /
            completedWithDuration.length
          : 0

      // Time saved
      const { data: timeBank } = await supabase
        .from('time_bank')
        .select('minutes_saved')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])

      const timeSaved =
        timeBank?.reduce((sum, tb) => sum + tb.minutes_saved, 0) || 0

      // Tasks by tag
      const tagCounts: { [key: string]: number } = {}
      tasks?.forEach((t) => {
        const tag = t.activity?.tag || 'Other'
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
      const tasksByTag = Object.entries(tagCounts).map(([name, value]) => ({ name, value }))

      // Tasks by energy level
      const energyCounts: { [key: string]: number } = {}
      tasks?.forEach((t) => {
        const energy = t.activity?.energy_level || 'Medium'
        energyCounts[energy] = (energyCounts[energy] || 0) + 1
      })
      const tasksByEnergy = Object.entries(energyCounts).map(([name, value]) => ({
        name,
        value,
      }))

      // Weekly completion
      const weeklyData: { [key: string]: { completed: number; total: number } } = {}
      tasks?.forEach((t) => {
        const day = new Date(t.planned_date).toLocaleDateString('en-US', { weekday: 'short' })
        if (!weeklyData[day]) {
          weeklyData[day] = { completed: 0, total: 0 }
        }
        weeklyData[day].total++
        if (t.status === 'Completed') {
          weeklyData[day].completed++
        }
      })
      const weeklyCompletion = Object.entries(weeklyData).map(([day, data]) => ({
        day,
        ...data,
      }))

      setData({
        completionRate,
        totalTasks,
        completedTasks,
        averageDuration: Math.round(averageDuration),
        timeSaved,
        tasksByTag,
        tasksByEnergy,
        weeklyCompletion,
      })
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444']

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="text-center text-gray-400">Loading analytics...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="text-center text-gray-400">No data available</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(Number(e.target.value))}
          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Completion Rate</p>
              <p className="text-2xl font-bold">{data.completionRate.toFixed(1)}%</p>
            </div>
            <Target className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Tasks Completed</p>
              <p className="text-2xl font-bold">
                {data.completedTasks}/{data.totalTasks}
              </p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Avg Duration</p>
              <p className="text-2xl font-bold">{data.averageDuration} min</p>
            </div>
            <Clock className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Time Saved</p>
              <p className="text-2xl font-bold">{data.timeSaved} min</p>
            </div>
            <TrendingUp className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Tasks by Tag</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.tasksByTag}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.tasksByTag.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Tasks by Energy Level</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.tasksByEnergy}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
              />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Weekly Completion</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.weeklyCompletion}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="day" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
            />
            <Legend />
            <Bar dataKey="completed" fill="#10b981" name="Completed" />
            <Bar dataKey="total" fill="#6b7280" name="Total" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

