import { useCallback, useEffect, useRef, useState } from 'react'

export type PlayerStatus = 'idle' | 'playing' | 'paused'

export type FinishedSession = { startedAt: Date; playedSeconds: number }

// Wraps one <audio> element. A "session" starts on the first play and ends
// when the track finishes or the user ends it; only time actually played
// counts toward the session's duration.
export function usePlayer(file: File | null, onFinished: (s: FinishedSession) => void) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const urlRef = useRef<string | null>(null)
  const startedAt = useRef<Date | null>(null)
  const played = useRef(0)
  const lastTime = useRef(0)
  const onFinishedRef = useRef(onFinished)
  onFinishedRef.current = onFinished

  const [status, setStatus] = useState<PlayerStatus>('idle')
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const finish = useCallback(() => {
    const a = audioRef.current
    if (a) { a.pause(); a.currentTime = 0 }
    const s = { startedAt: startedAt.current ?? new Date(), playedSeconds: Math.round(played.current) }
    startedAt.current = null; played.current = 0; lastTime.current = 0
    setStatus('idle'); setCurrentTime(0)
    if (s.playedSeconds >= 5) onFinishedRef.current(s)
  }, [])

  useEffect(() => {
    const a = new Audio()
    a.preload = 'metadata'
    audioRef.current = a
    const onTime = () => {
      const t = a.currentTime
      const delta = t - lastTime.current
      if (!a.paused && delta > 0 && delta < 2) played.current += delta
      lastTime.current = t
      setCurrentTime(t)
    }
    const onMeta = () => setDuration(a.duration || 0)
    const onEnded = () => finish()
    const onPause = () => { if (startedAt.current && !a.ended) setStatus('paused') }
    const onPlay = () => setStatus('playing')
    a.addEventListener('timeupdate', onTime)
    a.addEventListener('loadedmetadata', onMeta)
    a.addEventListener('durationchange', onMeta)
    a.addEventListener('ended', onEnded)
    a.addEventListener('pause', onPause)
    a.addEventListener('play', onPlay)
    return () => {
      a.pause()
      a.removeEventListener('timeupdate', onTime)
      a.removeEventListener('loadedmetadata', onMeta)
      a.removeEventListener('durationchange', onMeta)
      a.removeEventListener('ended', onEnded)
      a.removeEventListener('pause', onPause)
      a.removeEventListener('play', onPlay)
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    }
  }, [finish])

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = null }
    startedAt.current = null; played.current = 0; lastTime.current = 0
    setStatus('idle'); setCurrentTime(0); setDuration(0)
    if (file) {
      urlRef.current = URL.createObjectURL(file)
      a.src = urlRef.current
      a.load()
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: file.name.replace(/\.[^.]+$/, ''), artist: 'Meditation Journal',
        })
        navigator.mediaSession.setActionHandler('play', () => a.play())
        navigator.mediaSession.setActionHandler('pause', () => a.pause())
      }
    } else {
      a.removeAttribute('src')
    }
  }, [file])

  const play = useCallback(async () => {
    const a = audioRef.current
    if (!a || !file) return
    if (!startedAt.current) startedAt.current = new Date()
    lastTime.current = a.currentTime
    try { await a.play() } catch { /* autoplay blocked; user must tap again */ }
  }, [file])

  const pause = useCallback(() => audioRef.current?.pause(), [])

  const toggle = useCallback(() => (status === 'playing' ? pause() : play()), [status, play, pause])

  return { status, currentTime, duration, play, pause, toggle, end: finish, inSession: status !== 'idle' }
}
