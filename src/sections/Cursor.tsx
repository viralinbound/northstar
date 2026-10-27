import { useEffect, useRef, useState } from 'react'

const HOVER = 'a, button, [role="tab"], input, label, [data-cursor]'

/** Ring cursor that trails the pointer and grows over anything clickable. Fine pointers only. */
export function Cursor() {
  const ring = useRef<HTMLDivElement>(null)
  const dot = useRef<HTMLDivElement>(null)
  const [enabled] = useState(
    () => window.matchMedia('(pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    if (!enabled) return
    let x = innerWidth / 2
    let y = innerHeight / 2
    let rx = x
    let ry = y
    let raf = 0
    let visible = false
    const move = (e: PointerEvent) => {
      x = e.clientX
      y = e.clientY
      if (!visible) {
        visible = true
        rx = x
        ry = y
        ring.current?.classList.add('is-visible')
        dot.current?.classList.add('is-visible')
      }
      const target = (e.target as Element | null)?.closest?.(HOVER) as HTMLElement | null
      const label = target?.dataset.cursor ?? ''
      ring.current?.classList.toggle('is-hover', !!target)
      if (ring.current) ring.current.dataset.label = label
      ring.current?.classList.toggle('has-label', !!label)
    }
    const leave = () => {
      visible = false
      ring.current?.classList.remove('is-visible')
      dot.current?.classList.remove('is-visible')
    }
    const down = () => ring.current?.classList.add('is-down')
    const up = () => ring.current?.classList.remove('is-down')
    const tick = () => {
      rx += (x - rx) * 0.18
      ry += (y - ry) * 0.18
      if (ring.current) ring.current.style.transform = `translate3d(${rx}px, ${ry}px, 0)`
      if (dot.current) dot.current.style.transform = `translate3d(${x}px, ${y}px, 0)`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    window.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerleave', leave)
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', move)
      document.removeEventListener('pointerleave', leave)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
    }
  }, [enabled])

  if (!enabled) return null
  return (
    <>
      <div ref={ring} className="cursor-ring" aria-hidden="true" />
      <div ref={dot} className="cursor-dot" aria-hidden="true" />
    </>
  )
}
