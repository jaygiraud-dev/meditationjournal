import type { ReactNode, RefObject } from 'react'

type Props = {
  open: boolean
  onClose?: () => void
  head?: ReactNode
  children: ReactNode
  dismissable?: boolean
  bodyRef?: RefObject<HTMLDivElement>
  onBodyScroll?: () => void
}

export function Sheet({ open, onClose, head, children, dismissable = true, bodyRef, onBodyScroll }: Props) {
  return (
    <>
      <div className={`scrim ${open ? 'open' : ''}`} onClick={dismissable ? onClose : undefined} />
      <div className={`sheet ${open ? 'open' : ''}`} aria-hidden={!open}>
        <div className="sheet-head">
          <div className="handle" onClick={dismissable ? onClose : undefined} />
          {head}
        </div>
        <div className="sheet-body" ref={bodyRef} onScroll={onBodyScroll}>{children}</div>
      </div>
    </>
  )
}
