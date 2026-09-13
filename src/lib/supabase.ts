import { createClient } from '@supabase/supabase-js'

const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim()

function validUrl(u: string | undefined) {
  if (!u || u.includes('your-project')) return false
  try { return new URL(u).protocol === 'https:' } catch { return false }
}

const keyLooksRight = Boolean(rawKey && !rawKey.includes('your-anon') && rawKey.length > 20)

export const supabaseConfigured = validUrl(rawUrl) && keyLooksRight

// A human-readable reason shown on the sign-in screen when setup is incomplete.
export const supabaseSetupProblem = !rawUrl && !rawKey
  ? 'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are not set. On Netlify or Vercel, add them under Environment variables and redeploy. Locally, copy .env.example to .env.'
  : !validUrl(rawUrl)
    ? `VITE_SUPABASE_URL should be a full address like https://abcdefgh.supabase.co (got "${rawUrl ?? ''}").`
    : !keyLooksRight
      ? 'VITE_SUPABASE_ANON_KEY is missing or still the placeholder.'
      : null

export const supabase = createClient(
  supabaseConfigured ? rawUrl! : 'https://placeholder.supabase.co',
  supabaseConfigured ? rawKey! : 'placeholder',
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } },
)
