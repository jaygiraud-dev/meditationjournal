import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { DEFAULT_SECTIONS, mergeSections } from '../lib/scriptDefaults'
import type { ScriptSection } from '../lib/types'

const cacheKey = (uid: string) => `script:${uid}`

export function useScript(userId: string | null) {
  const [sections, setSections] = useState<ScriptSection[]>(DEFAULT_SECTIONS)
  const [saving, setSaving] = useState(false)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    if (!userId) return
    try {
      const raw = localStorage.getItem(cacheKey(userId))
      if (raw) setSections(mergeSections(JSON.parse(raw)))
    } catch { /* ignore */ }
    supabase.from('scripts').select('sections').eq('user_id', userId).maybeSingle().then(({ data }) => {
      if (data?.sections) {
        const merged = mergeSections(data.sections)
        setSections(merged)
        localStorage.setItem(cacheKey(userId), JSON.stringify(merged))
      }
    })
  }, [userId])

  const persist = useCallback(async (next: ScriptSection[]) => {
    if (!userId) return
    setSaving(true)
    await supabase.from('scripts').upsert({ user_id: userId, sections: next, updated_at: new Date().toISOString() })
    setSaving(false)
  }, [userId])

  // Edits save locally at once and to Supabase after a short pause in typing.
  const update = useCallback((key: string, body: string) => {
    setSections((cur) => {
      const next = cur.map((s) => (s.key === key ? { ...s, body } : s))
      if (userId) localStorage.setItem(cacheKey(userId), JSON.stringify(next))
      if (timer.current) window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => persist(next), 800)
      return next
    })
  }, [userId, persist])

  const flush = useCallback(() => {
    if (timer.current) { window.clearTimeout(timer.current); timer.current = null; persist(sections) }
  }, [persist, sections])

  return { sections, update, saving, flush }
}
