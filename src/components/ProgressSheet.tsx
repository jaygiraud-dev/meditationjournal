import { useMemo, useState } from 'react'
import { Sheet } from './Sheet'
import { StarsSmall } from './Stars'
import { SparkleIcon, TrashIcon } from './Icons'
import { bars, formatDuration, inPeriod, streak, summarize } from '../lib/stats'
import type { AiReview, Period, Session } from '../lib/types'

type Props = {
  open: boolean
  onClose: () => void
  sessions: Session[]
  reviews: AiReview[]
  onRemove: (id: string) => void
  onOpenReview: () => void
}

const LABELS: Record<Period, string> = { day: 'Day', week: 'Week', month: 'Month', year: 'Year' }
const RING_R = 48
const RING_C = 2 * Math.PI * RING_R

export function ProgressSheet({ open, onClose, sessions, reviews, onRemove, onOpenReview }: Props) {
  const [period, setPeriod] = useState<Period>('week')
  const scoped = useMemo(() => inPeriod(sessions, period), [sessions, period])
  const sum = useMemo(() => summarize(scoped), [scoped])
  const chart = useMemo(() => bars(sessions, period), [sessions, period])
  const max = Math.max(1, ...chart.map((b) => b.seconds))
  const streakDays = useMemo(() => streak(sessions), [sessions])
  const now = new Date()
  const ringTarget = period === 'day' ? 1 : period === 'week' ? 7 : period === 'month' ? new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() : 365
  const ringFrac = Math.min(1, sum.days / ringTarget)
  const latest = reviews[0]
  const monthName = now.toLocaleDateString(undefined, { month: 'long' })

  return (
    <Sheet open={open} onClose={onClose} head={
      <div className="row">
        <div>
          <div className="label">{monthName}</div>
          <div className="sheet-title">Progress</div>
        </div>
        <div className="segment">
          {(Object.keys(LABELS) as Period[]).map((p) => (
            <button key={p} className={p === period ? 'on' : ''} onClick={() => setPeriod(p)}>{LABELS[p]}</button>
          ))}
        </div>
      </div>
    }>
      <div className="card" style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
        <div className="ring">
          <svg width="112" height="112" viewBox="0 0 112 112">
            <circle cx="56" cy="56" r={RING_R} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="8" />
            <circle cx="56" cy="56" r={RING_R} fill="none" stroke="#d9a84e" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={RING_C} strokeDashoffset={RING_C * (1 - ringFrac)} transform="rotate(-90 56 56)" />
          </svg>
          <div className="ring-inner">
            <div className="stat-n" style={{ fontSize: 30 }}>{sum.days}<span style={{ fontSize: 16, color: 'var(--muted)' }}>/{ringTarget}</span></div>
            <div className="label" style={{ fontSize: 10 }}>days</div>
          </div>
        </div>
        <div className="stats-grid">
          <div><div className="stat-n gold">{streakDays}</div><div className="stat-l">day streak</div></div>
          <div><div className="stat-n">{formatDuration(sum.seconds)}</div><div className="stat-l">this {period}</div></div>
          <div><div className="stat-n">{sum.count}</div><div className="stat-l">session{sum.count === 1 ? '' : 's'}</div></div>
          <div><div className="stat-n">{sum.avgRating ? sum.avgRating.toFixed(1) : '–'}</div><div className="stat-l">avg rating</div></div>
        </div>
      </div>

      {chart.length > 0 && (
        <div className="bars" style={{ gridTemplateColumns: `repeat(${chart.length}, minmax(0, 1fr))` }}>
          {chart.map((b, i) => (
            <div className="bar" key={i}>
              <i className={`${b.isNow ? 'today' : ''} ${b.seconds === 0 ? 'zero' : ''}`} style={{ height: `${Math.max(6, (b.seconds / max) * 100)}%` }} />
              <b className={b.isNow ? 'today' : ''}>{b.label || ' '}</b>
            </div>
          ))}
        </div>
      )}

      <div className="card ai">
        <div className="row">
          <div className="row" style={{ gap: 8, justifyContent: 'flex-start' }}>
            <SparkleIcon />
            <div className="label gold">AI read</div>
          </div>
          {latest && <div className="muted">{new Date(latest.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>}
        </div>
        <div className="body serif" style={{ fontStyle: 'normal', fontSize: 18 }}>
          {latest ? latest.content.split('\n').filter(Boolean)[0] : 'Get an honest read on how your practice is going, drawn from your notes, ratings and consistency.'}
        </div>
        <button className="btn outline" onClick={onOpenReview}>{latest ? 'Read the full review' : 'Review my journal'}</button>
      </div>

      <div className="stack" style={{ gap: 10 }}>
        <div className="h2">{period === 'day' ? 'Today' : 'Recent sessions'}</div>
        {scoped.length === 0 && <div className="muted">No sessions in this {period} yet.</div>}
        {scoped.slice(0, 30).map((s) => {
          const d = new Date(s.started_at)
          return (
            <div className="logrow" key={s.id}>
              <div className="logdate">
                <small>{d.toLocaleDateString(undefined, { weekday: 'short' })}</small>
                <b>{d.getDate()}</b>
              </div>
              <div className="logmain">
                <div className="logtitle">{formatDuration(s.duration_seconds)}{s.track_name ? ` · ${s.track_name}` : ''}{s.pending ? ' · not synced' : ''}</div>
                <div className="lognote">{s.notes || d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</div>
              </div>
              <div className="lograting"><StarsSmall value={s.rating} /></div>
              <button className="iconbtn" style={{ width: 36, color: 'var(--dim)' }} aria-label="Delete session"
                onClick={() => { if (confirm('Delete this session?')) onRemove(s.id) }}><TrashIcon /></button>
            </div>
          )
        })}
      </div>
    </Sheet>
  )
}
