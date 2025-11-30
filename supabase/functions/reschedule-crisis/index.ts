import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.1.3'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { tasks, available_hours } = await req.json()

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid tasks array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const tasksSummary = tasks
      .map(
        (t: any) =>
          `- ${t.name} (${t.duration}min, ${t.tag}, ${t.energy_level} energy, min: ${t.min_duration}min)`
      )
      .join('\n')

    const prompt = `You are a crisis management assistant. The user has ${available_hours.toFixed(1)} hours left today and ${tasks.length} pending tasks.

Tasks:
${tasksSummary}

Your goal: Prioritize "Deep Work" tasks, sacrifice "Chores" if needed. Return a JSON array of actions. Each action should be:
- {"action": "delete", "task_id": "...", "task_name": "..."} - to delete a task
- {"action": "shorten", "task_id": "...", "activity_id": "...", "task_name": "...", "new_duration": number} - to shorten a task to its min_duration

Prioritize keeping Deep Work tasks. Delete or shorten Chores first. Only delete/shorten if absolutely necessary to fit within available time.

Return ONLY a JSON array of actions, no additional text. Example format:
[
  {"action": "delete", "task_id": "123", "task_name": "Clean garage"},
  {"action": "shorten", "task_id": "456", "activity_id": "789", "task_name": "Read book", "new_duration": 15}
]`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Extract JSON array
    let actions
    try {
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      actions = JSON.parse(cleaned)
    } catch (e) {
      const arrayMatch = text.match(/\[[\s\S]*\]/)
      if (arrayMatch) {
        actions = JSON.parse(arrayMatch[0])
      } else {
        // Fallback: return empty array if parsing fails
        actions = []
      }
    }

    // Map task names to IDs
    const actionsWithIds = actions.map((action: any) => {
      const task = tasks.find(
        (t: any) => t.name === action.task_name || t.id === action.task_id
      )
      if (task) {
        return {
          ...action,
          task_id: task.id,
          activity_id: task.activity_id || task.id,
        }
      }
      return action
    })

    return new Response(
      JSON.stringify({ actions: actionsWithIds }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

