import { useState, useRef, useEffect } from 'react'
import { Plus, X, Sparkles, Mic, MicOff } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { ParsedTaskInput } from '../lib/types'

interface SmartInputProps {
  onTaskCreated: () => Promise<void>
}

export default function SmartInput({ onTaskCreated }: SmartInputProps) {
  const { user } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<ParsedTaskInput | null>(null)
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [selectedTime, setSelectedTime] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      })

      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await transcribeAudio(audioBlob)
        
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)
    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('Microphone access denied. Please enable it in your browser settings.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true)
    try {
      // Convert blob to base64
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1]

        const { data, error } = await supabase.functions.invoke('transcribe-audio', {
          body: {
            audioBase64: base64Audio,
            mimeType: 'audio/webm',
          },
        })

        if (error) throw error

        if (data && data.transcript) {
          setInput((prev) => (prev ? prev + ' ' + data.transcript : data.transcript))
        }
        setIsTranscribing(false)
      }
      reader.readAsDataURL(audioBlob)
    } catch (error) {
      console.error('Error transcribing audio:', error)
      alert('Failed to transcribe audio. Please try again.')
      setIsTranscribing(false)
    }
  }

  const parseInput = async (text: string) => {
    if (!text.trim()) return

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('parse-task', {
        body: { input: text },
      })

      if (error) throw error

      if (data && data.parsed) {
        setPreview(data.parsed)
        // If time was parsed, set it
        if (data.parsed.planned_time) {
          setSelectedTime(data.parsed.planned_time)
        }
      }
    } catch (error) {
      console.error('Error parsing input:', error)
      alert('Failed to parse input. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!preview || !user) return

    setLoading(true)
    try {
      // Check if activity exists
      const { data: existingActivity } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .eq('name', preview.name)
        .single()

      let activityData
      if (existingActivity) {
        activityData = existingActivity
      } else {
        // Create new activity
        const { data: newActivity, error: activityError } = await supabase
          .from('activities')
          .insert({
            user_id: user.id,
            name: preview.name,
            duration_minutes: preview.duration,
            min_duration: Math.max(15, Math.floor(preview.duration * 0.5)),
            tag: preview.tag,
            energy_level: preview.energy_level,
            recurrence: preview.recurrence || null,
          })
          .select()
          .single()

        if (activityError) throw activityError
        activityData = newActivity
      }

      // Get max sort_order for the day to append new task
      const { data: existingTasks } = await supabase
        .from('tasks')
        .select('sort_order')
        .eq('user_id', user.id)
        .eq('planned_date', selectedDate)
        .order('sort_order', { ascending: false })
        .limit(1)

      const maxSortOrder = existingTasks && existingTasks.length > 0 
        ? (existingTasks[0].sort_order || 0) + 1 
        : 0

      // Create task
      const { error: taskError } = await supabase.from('tasks').insert({
        activity_id: activityData.id,
        user_id: user.id,
        planned_date: selectedDate,
        planned_time: selectedTime || null,
        sort_order: maxSortOrder,
        status: 'Pending',
      })

      if (taskError) throw taskError

      // Reset form
      setInput('')
      setPreview(null)
      setSelectedTime('')
      setIsOpen(false)
      await onTaskCreated()
    } catch (error) {
      console.error('Error creating task:', error)
      alert('Failed to create task. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all hover:scale-105"
        title="Smart Input"
      >
        <Plus className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-2xl border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-blue-400" />
                Smart Input
              </h2>
              <button
                onClick={() => {
                  setIsOpen(false)
                  setInput('')
                  setPreview(null)
                  setSelectedTime('')
                  if (isRecording) stopRecording()
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Time (Optional)
                  </label>
                  <input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Describe your task in natural language
                </label>
                <div className="relative">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onBlur={() => {
                      if (input.trim()) {
                        parseInput(input)
                      }
                    }}
                    placeholder="e.g., Deep work on Business for 90 mins at 2pm high priority"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 pr-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                  />
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isTranscribing}
                    className={`absolute right-2 top-2 p-2 rounded-lg transition-colors ${
                      isRecording
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : isTranscribing
                        ? 'bg-yellow-600 text-white'
                        : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                    } disabled:opacity-50`}
                    title={
                      isTranscribing
                        ? 'Transcribing...'
                        : isRecording
                        ? 'Stop Recording'
                        : 'Start AI Voice Input'
                    }
                  >
                    {isTranscribing ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : isRecording ? (
                      <MicOff className="w-5 h-5" />
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {loading && (
                <div className="text-center text-gray-400">Parsing with AI...</div>
              )}

              {preview && !loading && (
                <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                  <h3 className="font-semibold mb-3">Preview</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-400">Name:</span>{' '}
                      <span className="text-white">{preview.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Duration:</span>{' '}
                      <span className="text-white">{preview.duration} minutes</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Tag:</span>{' '}
                      <span className="text-white">{preview.tag}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Energy Level:</span>{' '}
                      <span className="text-white">{preview.energy_level}</span>
                    </div>
                    {preview.recurrence && (
                      <div>
                        <span className="text-gray-400">Recurrence:</span>{' '}
                        <span className="text-white">{preview.recurrence}</span>
                      </div>
                    )}
                    {preview.planned_time && (
                      <div>
                        <span className="text-gray-400">Time:</span>{' '}
                        <span className="text-white">{preview.planned_time}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={!preview || loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Task
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false)
                    setInput('')
                    setPreview(null)
                    setSelectedTime('')
                    if (isRecording) stopRecording()
                  }}
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

