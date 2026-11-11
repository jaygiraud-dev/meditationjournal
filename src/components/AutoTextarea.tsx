import { useLayoutEffect, useRef, useState, type PointerEvent } from 'react'

type Props = {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  minHeight?: number
}

// A textarea that grows with its content, plus a grip underneath that can be
// dragged to make it taller. iOS ignores the native resize handle, so the grip
// is what makes "drag to expand" work on the phone.
export function AutoTextarea({ value, onChange, placeholder, minHeight = 96 }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const [floor, setFloor] = useState(minHeight)
  const drag = useRef<{ y: number; h: number } | null>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(floor, el.scrollHeight + 2)}px`
  }, [value, floor])

  function down(e: PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { y: e.clientY, h: ref.current?.offsetHeight ?? floor }
  }
  function move(e: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return
    setFloor(Math.max(64, drag.current.h + (e.clientY - drag.current.y)))
  }
  function up() { drag.current = null }

  return (
    <div className="autotext">
      <textarea ref={ref} className="textarea" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      <div className="grip" role="separator" aria-label="Drag to resize" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        <i />
      </div>
    </div>
  )
}
