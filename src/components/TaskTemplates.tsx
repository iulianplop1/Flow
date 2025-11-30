import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { Activity, TaskTemplate } from '../lib/types'
import { FileText, Plus, X, Trash2 } from 'lucide-react'

export default function TaskTemplates() {
  const { user } = useAuthStore()
  const [templates, setTemplates] = useState<TaskTemplate[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [showModal, setShowModal] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([])

  useEffect(() => {
    if (user) {
      loadTemplates()
      loadActivities()
    }
  }, [user])

  const loadTemplates = async () => {
    if (!user) return

    const { data } = await supabase
      .from('task_templates')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) setTemplates(data)
  }

  const loadActivities = async () => {
    if (!user) return

    const { data } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true })

    if (data) setActivities(data)
  }

  const handleCreateTemplate = async () => {
    if (!user || !templateName || selectedActivityIds.length === 0) {
      alert('Please provide a name and select at least one activity')
      return
    }

    const { error } = await supabase.from('task_templates').insert({
      user_id: user.id,
      name: templateName,
      description: templateDescription || null,
      activity_ids: selectedActivityIds,
    })

    if (error) {
      alert('Failed to create template')
      return
    }

    setTemplateName('')
    setTemplateDescription('')
    setSelectedActivityIds([])
    setShowModal(false)
    loadTemplates()
  }

  const handleUseTemplate = async (template: TaskTemplate, date: string) => {
    if (!user) return

    const tasks = template.activity_ids.map((activityId) => ({
      activity_id: activityId,
      user_id: user.id,
      planned_date: date,
      status: 'Pending',
    }))

    const { error } = await supabase.from('tasks').insert(tasks)

    if (error) {
      alert('Failed to create tasks from template')
    } else {
      alert(`Created ${tasks.length} tasks from template!`)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Delete this template?')) return

    await supabase.from('task_templates').delete().eq('id', templateId)
    loadTemplates()
  }

  const toggleActivity = (activityId: string) => {
    setSelectedActivityIds((prev) =>
      prev.includes(activityId)
        ? prev.filter((id) => id !== activityId)
        : [...prev, activityId]
    )
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors text-sm"
        title="Task Templates"
      >
        <FileText className="w-4 h-4" />
        Templates
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Task Templates</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Create New Template */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Create New Template
                </h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Template name (e.g., Morning Routine)"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="w-full bg-gray-600 border border-gray-500 rounded-lg px-4 py-2 text-white placeholder-gray-400"
                  />
                  <textarea
                    placeholder="Description (optional)"
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                    className="w-full bg-gray-600 border border-gray-500 rounded-lg px-4 py-2 text-white placeholder-gray-400 min-h-[60px]"
                  />
                  <div>
                    <p className="text-sm text-gray-300 mb-2">Select Activities:</p>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {activities.map((activity) => (
                        <label
                          key={activity.id}
                          className="flex items-center gap-2 p-2 bg-gray-600 rounded cursor-pointer hover:bg-gray-500"
                        >
                          <input
                            type="checkbox"
                            checked={selectedActivityIds.includes(activity.id)}
                            onChange={() => toggleActivity(activity.id)}
                            className="rounded"
                          />
                          <span className="text-sm">
                            {activity.name} ({activity.duration_minutes} min)
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={handleCreateTemplate}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg"
                  >
                    Create Template
                  </button>
                </div>
              </div>

              {/* Existing Templates */}
              <div>
                <h3 className="font-semibold mb-3">Saved Templates</h3>
                <div className="space-y-2">
                  {templates.length === 0 ? (
                    <p className="text-gray-400 text-sm">No templates yet. Create one above!</p>
                  ) : (
                    templates.map((template) => {
                      const templateActivities = activities.filter((a) =>
                        template.activity_ids.includes(a.id)
                      )
                      return (
                        <div
                          key={template.id}
                          className="bg-gray-700 rounded-lg p-4 flex items-center justify-between"
                        >
                          <div className="flex-1">
                            <div className="font-semibold">{template.name}</div>
                            {template.description && (
                              <div className="text-sm text-gray-400 mt-1">
                                {template.description}
                              </div>
                            )}
                            <div className="text-xs text-gray-500 mt-2">
                              {templateActivities.length} activities
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                handleUseTemplate(template, new Date().toISOString().split('T')[0])
                              }
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                            >
                              Use Today
                            </button>
                            <button
                              onClick={() => handleDeleteTemplate(template.id)}
                              className="p-1 text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

