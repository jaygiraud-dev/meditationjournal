import type { ReactNode } from 'react'

type Props = { open: boolean; onClose?: () => void; head?: ReactNode; children: ReactNode; dismissable?: boolean }

export function Sheet({ open, onClose, head, children, dismissable = true }: Props) {
  return (
    <>
      <div className={`scrim ${open ? 'open' : ''}`} onClick={dismissable ? onClose : undefined} />
      <div className={`sheet ${open ? 'open' : ''}`} aria-hidden={!open}>
        <div className="sheet-head">
          <div className="handle" onClick={dismissable ? onClose : undefined} />
          {head}
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </>
  )
}
