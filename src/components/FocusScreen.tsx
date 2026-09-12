import { useRef } from 'react'
import { BarsIcon, FolderIcon, PauseIcon, PlayIcon, StopIcon } from './Icons'
import { formatClock, formatDuration } from '../lib/stats'
import type { PlayerStatus } from '../hooks/usePlayer'

type Props = {
  initial: string
  streakDays: number
  weekCount: number
  weekSeconds: number
  trackName: string | null
  status: PlayerStatus
  currentTime: number
  duration: number
  onToggle: () => void
  onEnd: () => void
  onPickFile: (file: File) => void
  onOpenProgress: () => void
  onOpenAccount: () => void
}

const R = 120
const CIRC = 2 * Math.PI * R

export function FocusScreen(p: Props) {
  const fileInput = useRef<HTMLInputElement>(null)
  const progress = p.duration > 0 ? Math.min(1, p.currentTime / p.duration) : 0
  const remaining = p.duration > 0 ? p.duration - p.currentTime : 0
  const playing = p.status === 'playing'
  const inSession = p.status !== 'idle'

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <button className="avatar" onClick={p.onOpenAccount} aria-label="Account">{p.initial}</button>
          <div className="statline">
            {p.streakDays > 0 ? `${p.streakDays}-day streak` : 'No streak yet'} · {p.weekCount} this week
            {p.weekSeconds > 0 ? ` · ${formatDuration(p.weekSeconds)}` : ''}
          </div>
        </div>
        <button className="iconbtn" onClick={p.onOpenProgress} aria-label="Progress"><BarsIcon /></button>
      </div>

      <div className="stage">
        <div className="dial">
          <svg viewBox="0 0 260 260">
            <circle cx="130" cy="130" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
            <circle className="dial-ring" cx="130" cy="130" r={R} fill="none" stroke="#d9a84e" strokeWidth="3" strokeLinecap="round"
              strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - progress)} transform="rotate(-90 130 130)" />
            <circle className={playing ? 'breathe' : ''} cx="130" cy="130" r="98" fill="rgba(217,168,78,0.06)" stroke="rgba(217,168,78,0.25)" strokeWidth="1" />
          </svg>
          <div className="dial-inner">
            <button className={`playbtn ${playing ? 'playing' : ''}`} onClick={p.onToggle} disabled={!p.trackName} aria-label={playing ? 'Pause' : 'Play'}>
              {playing ? <PauseIcon /> : <PlayIcon />}
            </button>
            <div className="dial-time">{inSession ? formatClock(remaining) : formatClock(p.duration)}</div>
            {inSession && <div className="dial-sub">{playing ? 'remaining' : 'paused'}</div>}
          </div>
        </div>

        <div className="trackblock">
          <div className={`trackname ${p.trackName ? '' : 'empty'}`}>{p.trackName ?? 'No track yet'}</div>
          <div className="trackactions">
            {inSession ? (
              <button className="pill danger" onClick={p.onEnd}><StopIcon /> End session</button>
            ) : (
              <button className="pill" onClick={() => fileInput.current?.click()}>
                <FolderIcon /> {p.trackName ? 'Change track' : 'Choose from Files'}
              </button>
            )}
          </div>
          <input ref={fileInput} type="file" accept="audio/*,.m4a,.mp3,.wav,.aac" hidden
            onChange={(e) => { const f = e.target.files?.[0]; if (f) p.onPickFile(f); e.target.value = '' }} />
        </div>
      </div>
    </>
  )
}
