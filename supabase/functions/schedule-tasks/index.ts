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
    // Parse request body safely
    let body
    try {
      body = await req.json()
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { tasks, available_hours, start_time } = body

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
          `- ${t.name} (${t.duration}min, ${t.tag}, ${t.energy_level} energy)`
      )
      .join('\n')

    const startTimeStr = start_time || '09:00'
    const endTime = available_hours 
      ? new Date(`2000-01-01T${startTimeStr}`).getTime() + (available_hours * 60 * 60 * 1000)
      : null
    const endTimeStr = endTime 
      ? new Date(endTime).toTimeString().slice(0, 5)
      : '22:00'

    const prompt = `You are an intelligent task scheduler. The user has ${tasks.length} tasks to schedule for today.

Tasks:
${tasksSummary}

Available time: ${startTimeStr} to ${endTimeStr} (${available_hours?.toFixed(1) || 'all day'} hours)

Your goal: Schedule all tasks optimally considering:
1. Energy levels - High energy tasks when user is fresh (morning), Low energy tasks when tired (evening)
2. Task types - Deep Work needs focus time, Chores can be flexible
3. Breaks - Add 5-10 min breaks between tasks
4. No overlaps - Tasks must not overlap
5. Realistic timing - Don't schedule too tightly

Return a JSON array where each task has:
{
  "task_id": "original task id if exists",
  "activity_id": "original activity id if exists",
  "name": "task name",
  "duration": number (minutes),
  "tag": "task tag",
  "energy_level": "High/Medium/Low",
  "planned_time": "HH:MM format (24-hour)",
  "sort_order": number (0, 1, 2, ... for ordering)
}

Return ONLY the JSON array, no additional text.`

    let result
    let response
    let text
    
    try {
      result = await model.generateContent(prompt)
      response = await result.response
      text = response.text()
      
      if (!text || text.trim().length === 0) {
        throw new Error('Empty response from Gemini API')
      }
    } catch (apiError: any) {
      console.error('Gemini API Error:', apiError)
      return new Response(
        JSON.stringify({ 
          error: 'AI service error',
          details: apiError.message || 'Failed to generate schedule'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract JSON array
    let scheduledTasks
    try {
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      scheduledTasks = JSON.parse(cleaned)
    } catch (e) {
      const arrayMatch = text.match(/\[[\s\S]*\]/)
      if (arrayMatch) {
        scheduledTasks = JSON.parse(arrayMatch[0])
      } else {
        // Fallback: create a simple schedule
        scheduledTasks = tasks.map((task: any, index: number) => {
          const start = new Date(`2000-01-01T${startTimeStr}`)
          let currentTime = new Date(start.getTime() + (index * (task.duration + 10) * 60 * 1000))
          if (index > 0) {
            // Add previous task duration + break
            const prevTask = tasks[index - 1]
            currentTime = new Date(start.getTime() + 
              tasks.slice(0, index).reduce((sum: number, t: any) => sum + t.duration + 10, 0) * 60 * 1000
            )
          }
          return {
            ...task,
            planned_time: currentTime.toTimeString().slice(0, 5),
            sort_order: index,
          }
        })
      }
    }

    // Map original task IDs
    const scheduledWithIds = scheduledTasks.map((scheduled: any, index: number) => {
      const originalTask = tasks.find((t: any) => t.name === scheduled.name || t.id === scheduled.task_id)
      return {
        ...scheduled,
        task_id: originalTask?.id || scheduled.task_id,
        activity_id: originalTask?.activity_id || scheduled.activity_id,
        sort_order: index,
      }
    })

    return new Response(
      JSON.stringify({ scheduled: scheduledWithIds }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Unexpected Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error?.message || 'An unexpected error occurred'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

