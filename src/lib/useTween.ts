import { useEffect, useRef, useState } from 'react'

/** Animates a number toward `value` (ease-out) so stats roll instead of jumping. */
export function useTween(value: number, duration = 550) {
  const [shown, setShown] = useState(value)
  const from = useRef(value)
  const current = useRef(value)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      current.current = value
      setShown(value)
      return
    }
    from.current = current.current
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const e = 1 - Math.pow(1 - t, 3)
      current.current = from.current + (value - from.current) * e
      setShown(current.current)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])

  return shown
}
