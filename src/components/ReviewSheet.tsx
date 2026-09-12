import { Sheet } from './Sheet'
import { SparkleIcon } from './Icons'
import type { AiReview } from '../lib/types'

type Props = {
  open: boolean
  onClose: () => void
  reviews: AiReview[]
  busy: boolean
  error: string | null
  onRequest: () => void
  sessionCount: number
}

export function ReviewSheet({ open, onClose, reviews, busy, error, onRequest, sessionCount }: Props) {
  const latest = reviews[0]
  return (
    <Sheet open={open} onClose={onClose} head={
      <div className="row">
        <div>
          <div className="label gold">AI read</div>
          <div className="sheet-title">How am I progressing?</div>
        </div>
        <SparkleIcon size={24} />
      </div>
    }>
      <div className="muted">
        Claude reads your session notes, ratings and consistency from the last 60 days, alongside your rehearsal script, and gives you an honest read.
      </div>
      <button className="btn primary" disabled={busy || sessionCount === 0} onClick={onRequest}>
        {busy ? <><span className="spin" /> Reading your journal…</> : latest ? 'Get a fresh read' : 'Review my journal'}
      </button>
      {sessionCount === 0 && <div className="muted center">Log a session first.</div>}
      {error && <div className="error">{error}</div>}
      {latest && (
        <div className="card ai">
          <div className="row">
            <div className="label gold">Latest</div>
            <div className="muted">{new Date(latest.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {latest.sessions_reviewed} sessions</div>
          </div>
          <div className="body serif" style={{ fontStyle: 'normal', fontSize: 19 }}>{latest.content}</div>
        </div>
      )}
      {reviews.slice(1).map((r) => (
        <div className="card" key={r.id}>
          <div className="row">
            <div className="label">Earlier</div>
            <div className="muted">{new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
          </div>
          <div className="body" style={{ color: 'var(--text-2)' }}>{r.content}</div>
        </div>
      ))}
    </Sheet>
  )
}
