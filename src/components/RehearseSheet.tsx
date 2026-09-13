import { useEffect, useRef, useState } from 'react'
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

const shortTitle = (s: ScriptSection) => (s.key === 'habits' ? 'Habits' : s.title.split(' ')[0])

function firstLine(sections: ScriptSection[]) {
  const beliefs = sections.find((s) => s.key === 'beliefs')?.body.trim()
  if (beliefs) return beliefs.split('\n').filter(Boolean).slice(0, 3).join(' ')
  const any = sections.find((s) => s.body.trim())
  return any ? any.body.trim().split('\n')[0] : null
}

function SectionChips({ sections, active, onPick }: { sections: ScriptSection[]; active: string; onPick: (key: string) => void }) {
  return (
    <div className="chips">
      {sections.map((s) => (
        <button key={s.key} className={`chip ${NEW_SELF_KEYS.has(s.key) ? 'violet' : ''} ${s.key === active ? 'on' : ''}`} onClick={() => onPick(s.key)}>
          {shortTitle(s)}
        </button>
      ))}
    </div>
  )
}

// The peeking card at the bottom of the Focus screen. The chips preview one
// section at a time; pulling up opens the full sheet at that section.
export function RehearsePeek({ sections, onExpand, onOpenReview, onEdit }: {
  sections: ScriptSection[]; onExpand: (key: string) => void; onOpenReview: () => void; onEdit: () => void
}) {
  const [chip, setChip] = useState(sections[0]?.key ?? 'thoughts')
  const line = firstLine(sections)
  const active = sections.find((s) => s.key === chip) ?? sections[0]
  const shown = active?.body.trim() ? active.body.trim().split('\n').filter(Boolean).slice(0, 3).join(' · ') : null
  return (
    <div className="peek">
      <div className="handle" onClick={() => onExpand(chip)} />
      <div className="peek-head" onClick={() => onExpand(chip)}>
        <div>
          <div className="peek-title">Rehearse</div>
          <div className="peek-sub">Pull up to read the whole script</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }} onClick={(e) => e.stopPropagation()}>
          <button className="iconbtn outlined" onClick={onEdit} aria-label="Edit script"><PencilIcon /></button>
          <button className="iconbtn gold" onClick={onOpenReview} aria-label="AI review"><SparkleIcon /></button>
        </div>
      </div>
      <SectionChips sections={sections} active={chip} onPick={setChip} />
      <div className={`quote ${shown ? '' : 'muted'}`} onClick={() => onExpand(chip)}>
        {shown ? (active.key === 'beliefs' ? `“${shown}”` : shown) : line ?? 'Tap the pencil to write your script.'}
      </div>
    </div>
  )
}

export function RehearseSheet({ open, onClose, editing, setEditing, initialKey, sections, onUpdate, onFlush, saving, onOpenReview }: Props & {
  open: boolean; onClose: () => void; editing: boolean; setEditing: (v: boolean) => void; initialKey: string
}) {
  const [active, setActive] = useState(initialKey)
  const bodyRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const scrollingTo = useRef<string | null>(null)

  function jump(key: string, smooth = true) {
    const el = sectionRefs.current[key]
    const body = bodyRef.current
    if (!el || !body) return
    scrollingTo.current = key
    setActive(key)
    body.scrollTo({ top: el.offsetTop - 4, behavior: smooth ? 'smooth' : 'auto' })
    window.setTimeout(() => { scrollingTo.current = null }, smooth ? 600 : 0)
  }

  // Land on the section that was previewed on the peek card.
  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => jump(initialKey, false), 30)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialKey])

  // Keep the highlighted chip in step with what's scrolled into view.
  function onScroll() {
    if (scrollingTo.current) return
    const body = bodyRef.current
    if (!body) return
    const line = body.scrollTop + 40
    let best = sections[0]?.key
    for (const s of sections) {
      const el = sectionRefs.current[s.key]
      if (el && el.offsetTop <= line) best = s.key
    }
    if (best && best !== active) setActive(best)
  }

  function close() { if (editing) { onFlush(); setEditing(false) } onClose() }

  return (
    <Sheet open={open} onClose={close} bodyRef={bodyRef} onBodyScroll={onScroll} head={
      <>
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
        <SectionChips sections={sections} active={active} onPick={(k) => jump(k)} />
      </>
    }>
      {sections.map((s, i) => {
        const isNew = NEW_SELF_KEYS.has(s.key)
        return (
          <div key={s.key} className="stack" ref={(el) => { sectionRefs.current[s.key] = el }}>
            {i === 0 && <div className="label">The old self</div>}
            {i === 3 && <div className="label" style={{ paddingTop: 6 }}>The new self</div>}
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
      <div style={{ height: '70vh', flexShrink: 0 }} />
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
