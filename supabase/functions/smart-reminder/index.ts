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
    const { task, reminder_minutes } = body

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `The user has a task "${task.name}" (${task.tag}, ${task.energy_level} energy, ${task.duration} minutes) starting in ${reminder_minutes} minutes.

Provide a brief, actionable preparation suggestion (1-2 sentences max) to help them get ready. Be specific and helpful.

Examples:
- "Gather your materials and find a quiet space"
- "Take 3 deep breaths and clear your workspace"
- "Have a glass of water and set your phone to silent"

Return ONLY the suggestion text, no additional commentary.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const suggestion = response.text().trim()

    return new Response(
      JSON.stringify({ suggestion }),
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

