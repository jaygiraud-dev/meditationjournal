import { useEffect, useState } from 'react'
import { Sheet } from './Sheet'
import { StarPicker } from './Stars'
import { formatDuration } from '../lib/stats'
import type { FinishedSession } from '../hooks/usePlayer'

const QUICK = ['Settled quickly', 'Distracted', 'Felt elevated', 'Fell asleep', 'Deep']

type Props = {
  finished: FinishedSession | null
  dayNumber: number
  onSave: (rating: number | null, notes: string) => Promise<void>
  onDismiss: () => void
}

export function AfterSessionSheet({ finished, dayNumber, onSave, onDismiss }: Props) {
  const [rating, setRating] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { if (finished) { setRating(null); setNotes(''); setBusy(false) } }, [finished])

  function addChip(c: string) {
    setNotes((n) => (n.includes(c) ? n : n.trim() ? `${n.trim()}${n.trim().endsWith('.') ? '' : '.'} ${c}.` : `${c}.`))
  }
  async function save(skip = false) {
    setBusy(true)
    await onSave(skip ? null : rating, skip ? '' : notes.trim())
    setBusy(false)
  }

  return (
    <Sheet open={!!finished} dismissable={false} head={
      <div className="center stack" style={{ gap: 4 }}>
        <div className="label gold">Session complete</div>
        <div className="sheet-title">{finished ? formatDuration(finished.playedSeconds) : ''}{dayNumber > 0 ? `. Day ${dayNumber}.` : '.'}</div>
        <div className="muted">How was it?</div>
      </div>
    }>
      <StarPicker value={rating} onChange={setRating} />
      <div className="stack">
        <div className="label">Notes</div>
        <textarea className="textarea" style={{ minHeight: 120 }} value={notes} placeholder="How did it go?" onChange={(e) => setNotes(e.target.value)} />
        <div className="chips">
          {QUICK.map((c) => <button key={c} className="chip" onClick={() => addChip(c)}>{c}</button>)}
        </div>
      </div>
      <div className="stack" style={{ gap: 10 }}>
        <button className="btn primary" disabled={busy} onClick={() => save(false)}>{busy ? <span className="spin" /> : 'Save to journal'}</button>
        <button className="btn ghost" disabled={busy} onClick={() => save(true).then(onDismiss)}>Log time only, skip notes</button>
      </div>
    </Sheet>
  )
}
