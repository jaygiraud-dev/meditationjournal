import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useSessions } from './hooks/useSessions'
import { useScript } from './hooks/useScript'
import { useReviews } from './hooks/useReviews'
import { usePlayer, type FinishedSession } from './hooks/usePlayer'
import { clearTrack, loadTrack, saveTrack } from './lib/trackStore'
import { inPeriod, streak, summarize } from './lib/stats'
import { AuthScreen } from './components/AuthScreen'
import { FocusScreen } from './components/FocusScreen'
import { RehearsePeek, RehearseSheet } from './components/RehearseSheet'
import { AfterSessionSheet } from './components/AfterSessionSheet'
import { ProgressSheet } from './components/ProgressSheet'
import { ReviewSheet } from './components/ReviewSheet'
import { AccountSheet } from './components/AccountSheet'

type Open = null | 'rehearse' | 'progress' | 'review' | 'account'

export default function App() {
  const { user, ready } = useAuth()
  if (!ready) return <div className="app" />
  if (!user) return <AuthScreen />
  return <Main userId={user.id} email={user.email ?? ''} />
}

function Main({ userId, email }: { userId: string; email: string }) {
  const { sessions, add, remove } = useSessions(userId)
  const script = useScript(userId)
  const reviews = useReviews(userId)

  const [track, setTrack] = useState<File | null>(null)
  const [open, setOpen] = useState<Open>(null)
  const [editing, setEditing] = useState(false)
  const [rehearseKey, setRehearseKey] = useState('thoughts')
  const [finished, setFinished] = useState<FinishedSession | null>(null)

  useEffect(() => { loadTrack().then(setTrack) }, [])

  const onFinished = useCallback((s: FinishedSession) => setFinished(s), [])
  const player = usePlayer(track, onFinished)

  const trackName = track ? track.name.replace(/\.[^.]+$/, '') : null
  const week = useMemo(() => summarize(inPeriod(sessions, 'week')), [sessions])
  const streakDays = useMemo(() => streak(sessions), [sessions])

  async function pickFile(file: File) {
    setTrack(file)
    try { await saveTrack(file) } catch { /* private mode: track lives for this visit only */ }
  }

  async function saveSession(rating: number | null, notes: string) {
    if (!finished) return
    await add({
      started_at: finished.startedAt.toISOString(),
      duration_seconds: finished.playedSeconds,
      rating, notes, track_name: trackName ?? '',
    })
    setFinished(null)
  }

  // "Day N" on the completion sheet: streak including the session just finished.
  const dayNumber = useMemo(() => {
    if (!finished) return 0
    const todayLogged = inPeriod(sessions, 'day').length > 0
    return todayLogged ? streakDays : streak(sessions, new Date(Date.now() - 86400000)) + 1
  }, [finished, sessions, streakDays])

  return (
    <div className={`app ${player.status === 'playing' ? 'is-playing' : ''}`}>
      <FocusScreen
        initial={email.charAt(0) || '?'}
        streakDays={streakDays}
        weekCount={week.count}
        weekSeconds={week.seconds}
        trackName={trackName}
        status={player.status}
        currentTime={player.currentTime}
        duration={player.duration}
        onToggle={player.toggle}
        onEnd={player.end}
        onPickFile={pickFile}
        onOpenProgress={() => setOpen('progress')}
        onOpenAccount={() => setOpen('account')}
      />
      <RehearsePeek
        sections={script.sections}
        onExpand={(key) => { setRehearseKey(key); setEditing(false); setOpen('rehearse') }}
        onEdit={() => { setRehearseKey('thoughts'); setEditing(true); setOpen('rehearse') }}
        onOpenReview={() => setOpen('review')}
      />

      <RehearseSheet
        open={open === 'rehearse'} onClose={() => setOpen(null)}
        editing={editing} setEditing={setEditing} initialKey={rehearseKey}
        sections={script.sections} onUpdate={script.update} onFlush={script.flush} saving={script.saving}
        onOpenReview={() => setOpen('review')}
      />
      <ProgressSheet
        open={open === 'progress'} onClose={() => setOpen(null)}
        sessions={sessions} reviews={reviews.reviews} onRemove={remove}
        onOpenReview={() => setOpen('review')}
      />
      <ReviewSheet
        open={open === 'review'} onClose={() => setOpen(null)}
        reviews={reviews.reviews} busy={reviews.busy} error={reviews.error} onRequest={reviews.request}
        sessionCount={sessions.length}
      />
      <AccountSheet
        open={open === 'account'} onClose={() => setOpen(null)} email={email} trackName={trackName}
        onClearTrack={() => { clearTrack(); setTrack(null) }}
      />
      <AfterSessionSheet finished={finished} dayNumber={dayNumber} onSave={saveSession} onDismiss={() => setFinished(null)} />
    </div>
  )
}
