import { useState } from 'react'
import { Task } from '../lib/types'
import { X, Send } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface SocraticDebrieferProps {
  task: Task
  onClose: () => void
  onSkip: () => void
  onReschedule: (newDate: string) => Promise<void>
}

export default function SocraticDebriefer({
  task,
  onClose,
  onSkip,
  onReschedule,
}: SocraticDebrieferProps) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant' as const,
      content: `I noticed you're skipping "${task.activity?.name}". That's okay - we all have days like this. Can you help me understand what's getting in the way?`,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage = {
      role: 'user' as const,
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const { data, error } = await supabase.functions.invoke('debrief-task', {
        body: {
          task: {
            name: task.activity?.name,
            tag: task.activity?.tag,
            energy_level: task.activity?.energy_level,
          },
          conversation: [...messages, userMessage],
        },
      })

      if (error) throw error

      if (data) {
        const assistantMessage = {
          role: 'assistant' as const,
          content: data.response,
        }
        setMessages((prev) => [...prev, assistantMessage])

        // Check if AI suggests rescheduling
        if (data.suggested_date) {
          const shouldReschedule = window.confirm(
            `Would you like to reschedule this task to ${data.suggested_date}?`
          )
          if (shouldReschedule) {
            await onReschedule(data.suggested_date)
            onClose()
          }
        }
      }
    } catch (error) {
      console.error('Error in debrief:', error)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-2xl border border-gray-700 flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Socratic Debrief</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-100'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-700 rounded-lg p-3 text-gray-400">
                Thinking...
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Type your response..."
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={onSkip}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Skip Anyway
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

