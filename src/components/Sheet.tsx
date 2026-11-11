import { useEffect, useRef, type ReactNode, type RefObject } from 'react'

type Props = {
  open: boolean
  onClose?: () => void
  head?: ReactNode
  children: ReactNode
  dismissable?: boolean
  bodyRef?: RefObject<HTMLDivElement>
  onBodyScroll?: () => void
}

// Bottom sheet. Closes on a tap outside, a tap on the handle, or a downward
// swipe: from the header anywhere, or from the content once it is scrolled to
// the top (the same rule as iOS sheets).
export function Sheet({ open, onClose, head, children, dismissable = true, bodyRef, onBodyScroll }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const scrimRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  // Hand the transform back to CSS once the open state has caught up.
  useEffect(() => {
    if (sheetRef.current) { sheetRef.current.style.transform = ''; sheetRef.current.style.transition = '' }
    if (scrimRef.current) { scrimRef.current.style.opacity = ''; scrimRef.current.style.transition = '' }
  }, [open])

  useEffect(() => {
    const sheet = sheetRef.current
    if (!sheet || !dismissable) return
    let startX = 0, startY = 0, startT = 0, dy = 0
    let mode: 'idle' | 'pending' | 'drag' | 'native' = 'idle'

    const onStart = (e: TouchEvent) => {
      const t = e.target as HTMLElement
      if (e.touches.length !== 1 || t.closest('textarea, input, .grip')) { mode = 'idle'; return }
      startX = e.touches[0].clientX; startY = e.touches[0].clientY; startT = Date.now(); dy = 0
      mode = 'pending'
    }
    const onMove = (e: TouchEvent) => {
      if (mode === 'idle' || mode === 'native') return
      const dx = e.touches[0].clientX - startX
      const d = e.touches[0].clientY - startY
      if (mode === 'pending') {
        if (dx === 0 && d === 0) return
        const body = sheet.querySelector('.sheet-body') as HTMLElement | null
        const inBody = !!(e.target as HTMLElement).closest('.sheet-body')
        const atTop = (body?.scrollTop ?? 0) <= 0
        if (!e.cancelable || Math.abs(dx) > Math.abs(d) || d < 0 || (inBody && !atTop)) { mode = 'native'; return }
        mode = 'drag'
        sheet.style.transition = 'none'
        if (scrimRef.current) scrimRef.current.style.transition = 'none'
      }
      e.preventDefault()
      dy = Math.max(0, d)
      sheet.style.transform = `translateY(${dy}px)`
      if (scrimRef.current) scrimRef.current.style.opacity = String(Math.max(0, 1 - dy / sheet.offsetHeight))
    }
    const onEnd = () => {
      if (mode === 'drag') {
        sheet.style.transition = ''
        if (scrimRef.current) scrimRef.current.style.transition = ''
        const fast = dy / Math.max(1, Date.now() - startT) > 0.5
        if (dy > 110 || (fast && dy > 30)) {
          sheet.style.transform = 'translateY(105%)'
          if (scrimRef.current) scrimRef.current.style.opacity = '0'
          onCloseRef.current?.()
        } else {
          sheet.style.transform = ''
          if (scrimRef.current) scrimRef.current.style.opacity = ''
        }
      }
      mode = 'idle'
    }
    sheet.addEventListener('touchstart', onStart, { passive: true })
    sheet.addEventListener('touchmove', onMove, { passive: false })
    sheet.addEventListener('touchend', onEnd)
    sheet.addEventListener('touchcancel', onEnd)
    return () => {
      sheet.removeEventListener('touchstart', onStart)
      sheet.removeEventListener('touchmove', onMove)
      sheet.removeEventListener('touchend', onEnd)
      sheet.removeEventListener('touchcancel', onEnd)
    }
  }, [dismissable])

  return (
    <>
      <div ref={scrimRef} className={`scrim ${open ? 'open' : ''}`} onClick={dismissable ? onClose : undefined} />
      <div ref={sheetRef} className={`sheet ${open ? 'open' : ''}`} aria-hidden={!open}>
        <div className="sheet-head">
          <div className="handle" onClick={dismissable ? onClose : undefined} />
          {head}
        </div>
        <div className="sheet-body" ref={bodyRef} onScroll={onBodyScroll}>{children}</div>
      </div>
    </>
  )
}
