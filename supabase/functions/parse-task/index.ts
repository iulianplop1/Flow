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

    const { input } = body

    if (!input || typeof input !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid input' }),
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

    const prompt = `Extract task information from this natural language input and return ONLY a valid JSON object with the following structure:
{
  "name": "string (task name)",
  "duration": number (duration in minutes, default 30 if not specified),
  "tag": "string (one of: Deep Work, Chore, Exercise, Learning, Social, Health, Other)",
  "energy_level": "string (one of: High, Medium, Low - infer from context)",
  "recurrence": "string (optional, e.g., 'Every Sunday', 'Daily', 'Weekly') or null",
  "planned_time": "string (optional, time in HH:MM format if mentioned, e.g., '14:00' for 2pm, or null if not specified)"
}

Input: "${input}"

If the user mentions a time (e.g., "at 2pm", "at 14:00", "in the morning", "afternoon"), extract it as HH:MM format (24-hour).
Return ONLY the JSON object, no additional text or explanation.`

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
          details: apiError.message || 'Failed to generate response'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Try to extract JSON from the response
    let parsed
    try {
      // Remove markdown code blocks if present
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      parsed = JSON.parse(cleaned)
    } catch (e) {
      // If direct parse fails, try to extract JSON from the text
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Could not parse JSON from response')
      }
    }

    // Validate and set defaults
    const validated = {
      name: parsed.name || input.split(' ').slice(0, 5).join(' '),
      duration: parsed.duration || 30,
      tag: parsed.tag || 'Other',
      energy_level: parsed.energy_level || 'Medium',
      recurrence: parsed.recurrence || null,
      planned_time: parsed.planned_time || null,
    }

    return new Response(
      JSON.stringify({ parsed: validated }),
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

