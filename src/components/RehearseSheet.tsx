import { useState } from 'react'
import { Sheet } from './Sheet'
import { CheckIcon, PencilIcon, SparkleIcon } from './Icons'
import { NEW_SELF_KEYS } from '../lib/scriptDefaults'
import type { ScriptSection } from '../lib/types'

type Props = {
  sections: ScriptSection[]
  onUpdate: (key: string, body: string) => void
  onFlush: () => void
  saving: boolean
  onOpenReview: () => void
}

function firstLine(sections: ScriptSection[]) {
  const beliefs = sections.find((s) => s.key === 'beliefs')?.body.trim()
  if (beliefs) return beliefs.split('\n').filter(Boolean).slice(0, 3).join(' ')
  const any = sections.find((s) => s.body.trim())
  return any ? any.body.trim().split('\n')[0] : null
}

// The peeking card at the bottom of the Focus screen, and the full sheet it
// expands into. Both live here so they share the edit state.
export function RehearsePeek({ sections, onExpand, onOpenReview, onEdit }: {
  sections: ScriptSection[]; onExpand: () => void; onOpenReview: () => void; onEdit: () => void
}) {
  const [chip, setChip] = useState(0)
  const line = firstLine(sections)
  const active = sections[chip]
  const shown = active?.body.trim() ? active.body.trim().split('\n').filter(Boolean).slice(0, 3).join(' · ') : null
  return (
    <div className="peek">
      <div className="handle" onClick={onExpand} />
      <div className="peek-head" onClick={onExpand}>
        <div>
          <div className="peek-title">Rehearse</div>
          <div className="peek-sub">Pull up to read the whole script</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }} onClick={(e) => e.stopPropagation()}>
          <button className="iconbtn outlined" onClick={onEdit} aria-label="Edit script"><PencilIcon /></button>
          <button className="iconbtn gold" onClick={onOpenReview} aria-label="AI review"><SparkleIcon /></button>
        </div>
      </div>
      <div className="chips">
        {sections.map((s, i) => (
          <button key={s.key} className={`chip ${NEW_SELF_KEYS.has(s.key) ? 'violet' : ''} ${i === chip ? 'on' : ''}`} onClick={() => setChip(i)}>
            {s.title.split(' ')[0] === 'Automatic' ? 'Habits' : s.title.split(' ')[0]}
          </button>
        ))}
      </div>
      <div className={`quote ${shown ? '' : 'muted'}`} onClick={onExpand}>
        {shown ? (active.key === 'beliefs' ? `“${shown}”` : shown) : line ?? 'Tap the pencil to write your script.'}
      </div>
    </div>
  )
}

export function RehearseSheet({ open, onClose, editing, setEditing, sections, onUpdate, onFlush, saving, onOpenReview }: Props & {
  open: boolean; onClose: () => void; editing: boolean; setEditing: (v: boolean) => void
}) {
  function close() { if (editing) { onFlush(); setEditing(false) } onClose() }
  return (
    <Sheet open={open} onClose={close} head={
      <div className="row">
        <div>
          <div className="sheet-title">{editing ? 'Edit your script' : 'Rehearse'}</div>
          <div className="peek-sub">{editing ? (saving ? 'Saving…' : 'Saves as you type') : 'Read through, then close your eyes.'}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {!editing && <button className="iconbtn gold" onClick={onOpenReview} aria-label="AI review"><SparkleIcon /></button>}
          <button className={`iconbtn ${editing ? 'gold' : 'outlined'}`} onClick={() => { if (editing) onFlush(); setEditing(!editing) }} aria-label={editing ? 'Done' : 'Edit'}>
            {editing ? <CheckIcon /> : <PencilIcon />}
          </button>
        </div>
      </div>
    }>
      {sections.map((s, i) => {
        const isNew = NEW_SELF_KEYS.has(s.key)
        const divider = i === 3
        return (
          <div key={s.key} className="stack">
            {divider && <div className="label" style={{ paddingTop: 6 }}>The new self</div>}
            {i === 0 && <div className="label">The old self</div>}
            <div className={`card ${isNew ? 'violet' : ''} ${s.key === 'thoughts' ? 'gold' : ''}`}>
              <div className={`label ${isNew ? 'violet' : 'gold'}`}>{s.title}</div>
              {editing ? (
                <textarea className="textarea" value={s.body} placeholder={placeholderFor(s.key)} onChange={(e) => onUpdate(s.key, e.target.value)} />
              ) : (
                <div className={`body ${s.key === 'beliefs' ? 'serif' : ''} ${s.body.trim() ? '' : 'empty'}`}>
                  {s.body.trim() || 'Nothing written yet'}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </Sheet>
  )
}

function placeholderFor(key: string) {
  switch (key) {
    case 'thoughts': return 'The thoughts you are letting go of…'
    case 'habits': return 'What you do on autopilot…'
    case 'emotions': return 'The emotions of the past…'
    case 'beliefs': return 'I can…'
    case 'behaviour': return 'Acting as someone who…'
    case 'feelings': return 'Safe, relaxed, joyful…'
    default: return ''
  }
}
