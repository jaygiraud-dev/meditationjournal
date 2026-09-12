import type { Period, Session } from './types'

const DAY = 24 * 60 * 60 * 1000

export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function startOfDay(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
export function startOfWeek(d: Date) {
  const x = startOfDay(d); const dow = (x.getDay() + 6) % 7 // Monday = 0
  x.setDate(x.getDate() - dow); return x
}
export function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1) }
export function startOfYear(d: Date) { return new Date(d.getFullYear(), 0, 1) }

export function periodStart(period: Period, now = new Date()) {
  switch (period) {
    case 'day': return startOfDay(now)
    case 'week': return startOfWeek(now)
    case 'month': return startOfMonth(now)
    case 'year': return startOfYear(now)
  }
}

export function inPeriod(sessions: Session[], period: Period, now = new Date()) {
  const start = periodStart(period, now).getTime()
  return sessions.filter((s) => new Date(s.started_at).getTime() >= start)
}

export function summarize(sessions: Session[]) {
  const count = sessions.length
  const seconds = sessions.reduce((a, s) => a + s.duration_seconds, 0)
  const rated = sessions.filter((s) => s.rating != null)
  const avgRating = rated.length ? rated.reduce((a, s) => a + (s.rating ?? 0), 0) / rated.length : null
  const avgMinutes = count ? Math.round(seconds / 60 / count) : 0
  const days = new Set(sessions.map((s) => dayKey(new Date(s.started_at)))).size
  return { count, seconds, avgRating, avgMinutes, days }
}

export function streak(sessions: Session[], now = new Date()) {
  const days = new Set(sessions.map((s) => dayKey(new Date(s.started_at))))
  let cursor = startOfDay(now)
  if (!days.has(dayKey(cursor))) cursor = new Date(cursor.getTime() - DAY) // today not yet, count from yesterday
  let n = 0
  while (days.has(dayKey(cursor))) { n++; cursor = new Date(cursor.getTime() - DAY) }
  return n
}

export function formatDuration(seconds: number) {
  if (seconds < 60) return `${Math.round(seconds)} sec`
  const m = Math.round(seconds / 60)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60), r = m % 60
  return r ? `${h}h ${String(r).padStart(2, '0')}` : `${h}h`
}

export function formatClock(seconds: number) {
  const s = Math.max(0, Math.floor(seconds))
  const m = Math.floor(s / 60), r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

export type Bar = { label: string; seconds: number; isNow: boolean }

// Bars for the chart under the period summary.
export function bars(sessions: Session[], period: Period, now = new Date()): Bar[] {
  if (period === 'day') {
    // one bar per session today
    return inPeriod(sessions, 'day', now).slice().reverse().map((s, i) => ({
      label: `${i + 1}`, seconds: s.duration_seconds, isNow: true,
    }))
  }
  if (period === 'week') {
    const start = startOfWeek(now)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start.getTime() + i * DAY)
      const k = dayKey(d)
      return {
        label: ['M', 'T', 'W', 'T', 'F', 'S', 'S'][i],
        seconds: sessions.filter((s) => dayKey(new Date(s.started_at)) === k).reduce((a, s) => a + s.duration_seconds, 0),
        isNow: k === dayKey(now),
      }
    })
  }
  if (period === 'month') {
    const start = startOfMonth(now)
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(start.getFullYear(), start.getMonth(), i + 1)
      const k = dayKey(d)
      return {
        label: (i + 1) % 5 === 0 || i === 0 ? `${i + 1}` : '',
        seconds: sessions.filter((s) => dayKey(new Date(s.started_at)) === k).reduce((a, s) => a + s.duration_seconds, 0),
        isNow: k === dayKey(now),
      }
    })
  }
  return Array.from({ length: 12 }, (_, m) => ({
    label: 'JFMAMJJASOND'[m],
    seconds: sessions.filter((s) => {
      const d = new Date(s.started_at); return d.getFullYear() === now.getFullYear() && d.getMonth() === m
    }).reduce((a, s) => a + s.duration_seconds, 0),
    isNow: m === now.getMonth(),
  }))
}
