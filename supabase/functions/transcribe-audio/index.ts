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
    // Parse request body
    let body
    try {
      body = await req.json()
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { audioBase64, mimeType } = body

    if (!audioBase64) {
      return new Response(
        JSON.stringify({ error: 'No audio data provided' }),
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

    // Convert base64 to buffer
    const audioData = Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0))

    try {
      // Use Gemini's audio transcription capability
      // Note: Gemini 2.5 Flash supports audio input
      const result = await model.generateContent([
        {
          inlineData: {
            data: btoa(String.fromCharCode(...audioData)),
            mimeType: mimeType || 'audio/webm',
          },
        },
        {
          text: 'Transcribe this audio to text. Return only the transcribed text, no additional commentary.',
        },
      ])

      const response = await result.response
      const transcript = response.text().trim()

      return new Response(
        JSON.stringify({ transcript }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (apiError: any) {
      console.error('Gemini API Error:', apiError)
      
      // Fallback: If Gemini doesn't support audio directly, we might need to use a different approach
      // For now, return an error with instructions
      return new Response(
        JSON.stringify({ 
          error: 'Audio transcription failed',
          details: apiError.message || 'Gemini API error',
          note: 'Audio transcription may require additional setup. Consider using a dedicated transcription service.'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
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

