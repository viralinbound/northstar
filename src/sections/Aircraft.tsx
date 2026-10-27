import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { hasWebGL, useInView, useNearViewport, useReducedMotion } from '../lib/env'
import { useTheme } from '../lib/theme'
import { DRONE_PARTS } from './content'
import { StaticDroneArt } from './Icons'

const DroneViewer = lazy(() => import('../three/DroneViewer'))

/** Scroll-pinned breakdown: the aircraft separates into parts while the list walks through them. */
export function Aircraft() {
  const section = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const bar = useRef<HTMLSpanElement>(null)
  const progress = useRef({ current: 0, target: 0 })
  const [active, setActive] = useState(0)
  const [ready, setReady] = useState(false)
  const reduced = useReducedMotion()
  const theme = useTheme()
  const near = useNearViewport(section, '400px')
  const inView = useInView(stage)
  const immersive = !reduced && hasWebGL()

  useEffect(() => {
    if (!immersive || !section.current) return
    const st = ScrollTrigger.create({
      trigger: section.current,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        progress.current.target = self.progress
      },
    })
    return () => st.kill()
  }, [immersive])

  useEffect(() => {
    if (!immersive || !inView) return
    let raf = 0
    let shown = -1
    const tick = () => {
      const p = progress.current
      p.current += (p.target - p.current) * 0.09
      const idx = Math.min(DRONE_PARTS.length - 1, Math.max(0, Math.floor(((p.current - 0.08) / 0.82) * DRONE_PARTS.length)))
      if (idx !== shown) {
        shown = idx
        setActive(idx)
      }
      if (bar.current) bar.current.style.transform = `scaleX(${p.current})`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [immersive, inView])

  return (
    <section ref={section} id="aircraft" className={`aircraft ${immersive ? 'is-pinned' : ''}`} aria-labelledby="aircraft-title">
      <div className="aircraft__sticky">
        <div className="container aircraft__grid">
          <header className="aircraft__head">
            <p className="eyebrow">Inside the aircraft</p>
            <h2 id="aircraft-title" className="section-title split-words">
              Six parts. <em>Zero</em> mystery.
            </h2>
            <p className="section-lede">Scroll to pull it apart. Every piece is there for a reason you can see.</p>
            <span className="aircraft__progress" aria-hidden="true">
              <span ref={bar} />
            </span>
          </header>

          <div ref={stage} className="aircraft__stage">
            {immersive && near ? (
              <>
                {!ready && <p className="aircraft__loading mono">Loading model…</p>}
                <Suspense fallback={null}>
                  <DroneViewer progress={progress.current} active={inView} theme={theme} onReady={() => setReady(true)} />
                </Suspense>
              </>
            ) : (
              !immersive && <StaticDroneArt />
            )}
            <span className="aircraft__tag mono" aria-hidden="true">
              Reference design · {String(active + 1).padStart(2, '0')}/{String(DRONE_PARTS.length).padStart(2, '0')}
            </span>
          </div>

          <ol className="parts">
            {DRONE_PARTS.map((part, i) => (
              <li key={part.id} className={`parts__item ${i === active || !immersive ? 'is-active' : ''}`}>
                <span className="parts__n mono">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{part.label}</h3>
                  <p>{part.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
