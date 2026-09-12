// Supabase Edge Function: reads the caller's recent sessions and rehearsal
// script, asks Claude for an honest progress read, stores it, returns it.
// Deploy: supabase functions deploy ai-review
// Secret: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
import { createClient } from 'npm:@supabase/supabase-js@2'
import Anthropic from 'npm:@anthropic-ai/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Session = {
  started_at: string
  duration_seconds: number
  rating: number | null
  notes: string
  track_name: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } },
  )
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    return new Response(JSON.stringify({ error: 'Not signed in' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const userId = userData.user.id

  const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  const [{ data: sessions }, { data: script }, { data: lastReview }] = await Promise.all([
    supabase.from('sessions').select('started_at,duration_seconds,rating,notes,track_name')
      .eq('user_id', userId).gte('started_at', since).order('started_at', { ascending: false }).limit(120),
    supabase.from('scripts').select('sections').eq('user_id', userId).maybeSingle(),
    supabase.from('ai_reviews').select('content,created_at').eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  const rows = (sessions ?? []) as Session[]
  if (rows.length === 0) {
    return new Response(JSON.stringify({ error: 'No sessions in the last 60 days to review yet.' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const log = rows.map((s) => {
    const d = new Date(s.started_at)
    const mins = Math.round(s.duration_seconds / 60)
    const stars = s.rating ? `${s.rating}/5` : 'unrated'
    return `- ${d.toISOString().slice(0, 10)} · ${mins} min · ${stars}${s.notes ? ` · "${s.notes.replace(/\s+/g, ' ').trim()}"` : ''}`
  }).join('\n')

  const sections = (script?.sections ?? []) as { title: string; body: string }[]
  const scriptText = sections.filter((s) => s.body?.trim())
    .map((s) => `${s.title}:\n${s.body.trim()}`).join('\n\n')

  const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') })
  const response = await anthropic.beta.messages.create({
    model: 'claude-opus-5',
    max_tokens: 4000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: [
      'You are a thoughtful coach reviewing someone\'s meditation journal. They practice Dr. Joe Dispenza-style meditations: before each session they rehearse a script describing the old self (thoughts, automatic habits, emotions of the past) and the new self (beliefs, behaviours, feelings), then meditate to a recorded track and rate the session.',
      'Give an honest, specific, warm read of their progress. Draw only on the data provided. Notice consistency, session length, rating trends, and recurring themes in their notes, and connect what you see to the intentions in their script. Say plainly if something is slipping. Suggest at most two concrete things to try next.',
      'Write 3 short paragraphs in plain prose addressed to them as "you". No headers, no bullet lists, no emoji, no medical claims, no promises about healing or outcomes.',
    ].join(' '),
    messages: [{
      role: 'user',
      content: [
        `Today is ${new Date().toISOString().slice(0, 10)}.`,
        `Sessions from the last 60 days, newest first (${rows.length} total):\n${log}`,
        scriptText ? `Their current rehearsal script:\n${scriptText}` : 'They have not written a rehearsal script yet.',
        lastReview ? `Your previous review, from ${lastReview.created_at.slice(0, 10)}, for continuity:\n${lastReview.content}` : 'This is their first review.',
      ].join('\n\n'),
    }],
  })

  if (response.stop_reason === 'refusal') {
    return new Response(JSON.stringify({ error: 'The review could not be generated this time.' }), {
      status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const content = response.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
    .map((b) => b.text).join('\n').trim()

  const { data: saved, error: saveError } = await supabase.from('ai_reviews')
    .insert({ user_id: userId, content, sessions_reviewed: rows.length })
    .select('id,content,sessions_reviewed,created_at').single()
  if (saveError) {
    return new Response(JSON.stringify({ error: saveError.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  return new Response(JSON.stringify(saved), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
