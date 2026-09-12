import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { AiReview } from '../lib/types'

export function useReviews(userId: string | null) {
  const [reviews, setReviews] = useState<AiReview[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) { setReviews([]); return }
    supabase.from('ai_reviews').select('id,content,sessions_reviewed,created_at')
      .eq('user_id', userId).order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => { if (data) setReviews(data as AiReview[]) })
  }, [userId])

  const request = useCallback(async () => {
    setBusy(true); setError(null)
    const { data, error: fnError } = await supabase.functions.invoke<AiReview>('ai-review', { body: {} })
    if (fnError || !data) {
      let message = fnError?.message ?? 'Something went wrong.'
      // The function returns a JSON body with a friendlier message on 4xx/5xx.
      const ctx = (fnError as { context?: Response } | null)?.context
      if (ctx && typeof ctx.json === 'function') {
        try { const body = await ctx.json(); if (body?.error) message = body.error } catch { /* keep message */ }
      }
      setError(message)
    } else {
      setReviews((cur) => [data, ...cur])
    }
    setBusy(false)
  }, [])

  return { reviews, request, busy, error }
}
