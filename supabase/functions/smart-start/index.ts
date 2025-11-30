import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.1.3'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { currentTime, tasks, userHistory } = body

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    // Format tasks for AI
    const pendingTasks = tasks
      .filter((t: any) => t.status === 'Pending' && t.activity)
      .map((t: any) => ({
        id: t.id,
        name: t.activity.name,
        duration: t.activity.duration_minutes,
        energy_level: t.activity.energy_level,
        tag: t.activity.tag,
        planned_time: t.planned_time || null,
      }))

    if (pendingTasks.length === 0) {
      return new Response(
        JSON.stringify({ 
          prompt: "You're all caught up! No pending tasks for today.",
          task_id: null,
          duration: null
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Analyze user history for patterns
    const historySummary = userHistory
      ? `User's recent patterns:
- Most completed tasks: ${userHistory.mostCompletedTags?.join(', ') || 'N/A'}
- Average completion time: ${userHistory.avgCompletionTime || 'N/A'} minutes
- Typical energy level at this time: ${userHistory.typicalEnergyAtTime || 'Medium'}
- Completion rate: ${userHistory.completionRate || 0}%`
      : 'No history available yet.'

    const tasksList = pendingTasks
      .map((t: any) => `- "${t.name}" (${t.duration}min, ${t.energy_level} energy, ${t.tag}${t.planned_time ? `, scheduled at ${t.planned_time}` : ''})`)
      .join('\n')

    const hour = parseInt(currentTime.split(':')[0])
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

    const prompt = `You are a helpful productivity assistant. Analyze the user's situation and create a personalized, encouraging prompt to help them start their day.

Current time: ${currentTime} (${timeOfDay})
${historySummary}

Pending tasks:
${tasksList}

Create a friendly, personalized prompt that:
1. Uses the appropriate greeting (${greeting})
2. Mentions the current time
3. References their typical energy level at this time (if available)
4. Identifies the MOST IMPORTANT or MOST URGENT task (consider: scheduled time, energy level match, task importance)
5. Suggests starting a focus session for that task
6. Uses the task's actual duration
7. Be warm, encouraging, and action-oriented
8. Keep it concise (2-3 sentences max)

Format your response as JSON:
{
  "prompt": "The personalized prompt text",
  "task_id": "id of the recommended task",
  "duration": number (duration in minutes)
}

Return ONLY the JSON object, no additional text.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    let responseText = response.text().trim()

    // Clean up response (remove markdown code blocks if present)
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    let parsedResponse
    try {
      parsedResponse = JSON.parse(responseText)
    } catch (e) {
      // Fallback if JSON parsing fails
      const firstTask = pendingTasks[0]
      parsedResponse = {
        prompt: `${greeting}. It's ${currentTime} and you have "${firstTask.name}" scheduled. Want to start a ${firstTask.duration}-minute focus session for that now?`,
        task_id: firstTask.id,
        duration: firstTask.duration,
      }
    }

    // Validate task_id exists
    if (!pendingTasks.find((t: any) => t.id === parsedResponse.task_id)) {
      const firstTask = pendingTasks[0]
      parsedResponse.task_id = firstTask.id
      parsedResponse.duration = firstTask.duration
    }

    return new Response(
      JSON.stringify(parsedResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

