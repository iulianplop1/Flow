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
    const { task, conversation } = await req.json()

    if (!task || !conversation || !Array.isArray(conversation)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request' }),
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

    const conversationHistory = conversation
      .map((msg: any) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n')

    const prompt = `You are an empathetic accountability partner helping someone understand why they're skipping a task.

Task: ${task.name} (${task.tag}, ${task.energy_level} energy)

Conversation so far:
${conversationHistory}

Your role:
1. Be empathetic and non-judgmental
2. Ask thoughtful questions to understand the root cause
3. If appropriate, suggest rescheduling to a better time
4. Keep responses concise (2-3 sentences max)
5. If you suggest rescheduling, provide a specific date in YYYY-MM-DD format

Respond naturally as a supportive friend. If you want to suggest rescheduling, end your response with: "SUGGEST_RESCHEDULE:YYYY-MM-DD"

Return only your response text, no JSON.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text().trim()

    // Check for reschedule suggestion
    const rescheduleMatch = text.match(/SUGGEST_RESCHEDULE:(\d{4}-\d{2}-\d{2})/)
    let suggestedDate = null
    let cleanResponse = text

    if (rescheduleMatch) {
      suggestedDate = rescheduleMatch[1]
      cleanResponse = text.replace(/SUGGEST_RESCHEDULE:\d{4}-\d{2}-\d{2}/, '').trim()
    }

    return new Response(
      JSON.stringify({
        response: cleanResponse,
        suggested_date: suggestedDate,
      }),
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

