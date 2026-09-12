import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Session } from '../lib/types'

const cacheKey = (uid: string) => `sessions:${uid}`
const pendingKey = (uid: string) => `sessions-pending:${uid}`

function readJson<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback } catch { return fallback }
}
function writeJson(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* storage full or blocked */ }
}

export type NewSession = Omit<Session, 'id' | 'user_id' | 'pending'>

// Sessions are cached locally so the main screen paints instantly and works
// offline; saves that fail (no network) are queued and retried on next sync.
export function useSessions(userId: string | null) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  const sync = useCallback(async (uid: string) => {
    const pending = readJson<Session[]>(pendingKey(uid), [])
    const stillPending: Session[] = []
    for (const p of pending) {
      const { pending: _p, ...row } = p
      const { error } = await supabase.from('sessions').upsert(row)
      if (error) stillPending.push(p)
    }
    writeJson(pendingKey(uid), stillPending)

    const { data, error } = await supabase.from('sessions').select('*')
      .eq('user_id', uid).order('started_at', { ascending: false }).limit(1000)
    if (!error && data) {
      const merged = [...stillPending, ...(data as Session[])]
      setSessions(merged)
      writeJson(cacheKey(uid), merged)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!userId) { setSessions([]); return }
    setSessions(readJson<Session[]>(cacheKey(userId), []))
    sync(userId)
    const onOnline = () => sync(userId)
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [userId, sync])

  const add = useCallback(async (input: NewSession) => {
    if (!userId) return
    const row: Session = { ...input, id: crypto.randomUUID(), user_id: userId }
    const next = [row, ...sessions]
    setSessions(next)
    writeJson(cacheKey(userId), next)
    const { error } = await supabase.from('sessions').insert(row)
    if (error) {
      const pending = readJson<Session[]>(pendingKey(userId), [])
      writeJson(pendingKey(userId), [...pending, { ...row, pending: true }])
      setSessions((cur) => cur.map((s) => (s.id === row.id ? { ...s, pending: true } : s)))
    }
  }, [userId, sessions])

  const remove = useCallback(async (id: string) => {
    if (!userId) return
    const next = sessions.filter((s) => s.id !== id)
    setSessions(next)
    writeJson(cacheKey(userId), next)
    writeJson(pendingKey(userId), readJson<Session[]>(pendingKey(userId), []).filter((s) => s.id !== id))
    await supabase.from('sessions').delete().eq('id', id)
  }, [userId, sessions])

  return { sessions, loading, add, remove, refresh: () => (userId ? sync(userId) : Promise.resolve()) }
}
