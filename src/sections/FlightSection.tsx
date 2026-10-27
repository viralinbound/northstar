import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CHAPTERS, chapterAt, flight, smoothstep, windowed } from '../lib/flight'
import { useCompact, useInView, useNearViewport } from '../lib/env'
import { useTheme } from '../lib/theme'
import { AERIAL_CAPS, CHAPTER_COPY } from './content'
import { CapIcon } from './Icons'

gsap.registerPlugin(ScrollTrigger)

const FlightScene = lazy(() => import('../three/FlightScene'))

/** Scroll-driven mission replay: lift-off, five capability chapters and the handoff to robotics. */
export function FlightSection() {
  const section = useRef<HTMLElement>(null)
  const sticky = useRef<HTMLDivElement>(null)
  const hero = useRef<HTMLDivElement>(null)
  const chapters = useRef<(HTMLElement | null)[]>([])
  const cards = useRef<(HTMLElement | null)[]>([])
  const railFill = useRef<HTMLSpanElement>(null)
  const hud = useRef<{ alt: HTMLElement | null; spd: HTMLElement | null; hdg: HTMLElement | null; mode: HTMLElement | null }>({
    alt: null,
    spd: null,
    hdg: null,
    mode: null,
  })
  const exit = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [ready, setReady] = useState(false)
  const compact = useCompact()
  const theme = useTheme()
  const near = useNearViewport(section, '200px')
  const inView = useInView(sticky)

  // Scroll position → flight.target
  useEffect(() => {
    const el = section.current
    if (!el) return
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        flight.target = self.progress
      },
    })
    flight.target = st.progress
    return () => st.kill()
  }, [])

  // Ease flight.current and drive overlay text/HUD (runs only while visible)
  useEffect(() => {
    if (!inView) return
    let raf = 0
    let last = performance.now()
    let lastChapter = -1
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 20)
      last = now
      const before = flight.current
      flight.current += (flight.target - flight.current) * (1 - Math.exp(-dt * 4.5))
      if (Math.abs(flight.target - flight.current) < 1e-5) flight.current = flight.target
      flight.velocity = (flight.current - before) / Math.max(dt, 1e-4)
      const p = flight.current

      if (hero.current) {
        const o = 1 - smoothstep(0.035, 0.085, p)
        hero.current.style.opacity = String(o)
        hero.current.style.transform = `translate3d(0, ${(1 - o) * -24}px, 0)`
        hero.current.style.visibility = o < 0.01 ? 'hidden' : 'visible'
      }
      CHAPTERS.forEach((c, i) => {
        const el = chapters.current[i]
        if (!el || i === 0) return
        const last = i === CHAPTERS.length - 1
        const o = windowed(c.start - 0.005, c.start + 0.03, last ? 2 : c.end - 0.03, last ? 3 : c.end, p)
        el.style.opacity = String(o)
        el.style.transform = `translate3d(0, ${(1 - o) * 18}px, 0)`
        el.style.pointerEvents = o > 0.5 ? 'auto' : 'none'
      })
      AERIAL_CAPS.forEach((cap, i) => {
        const el = cards.current[i]
        const c = CHAPTERS.find((x) => x.id === cap.chapter)
        if (!el || !c) return
        const second = i % 2 === 1
        const s = c.start + (second ? 0.045 : 0.02)
        const o = windowed(s, s + 0.03, c.end - 0.03, c.end, p)
        el.style.opacity = String(o)
        el.style.transform = `translate3d(${(1 - o) * 26}px, 0, 0)`
      })
      if (railFill.current) railFill.current.style.transform = `scaleY(${p})`
      if (exit.current) exit.current.style.opacity = String(smoothstep(0.9, 1, p))

      const h = hud.current
      if (h.alt) h.alt.textContent = flight.altitude.toFixed(1)
      if (h.spd) h.spd.textContent = Math.min(flight.speed, 99).toFixed(1)
      if (h.hdg) h.hdg.textContent = String(Math.round(flight.heading)).padStart(3, '0')
      const ch = chapterAt(p)
      if (ch !== lastChapter) {
        lastChapter = ch
        if (h.mode) h.mode.textContent = CHAPTERS[ch].mode
        setActive(ch)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView])

  const jumpTo = (start: number) => {
    const el = section.current
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY
    const span = el.offsetHeight - window.innerHeight
    window.scrollTo({ top: top + span * (start + 0.012), behavior: 'smooth' })
  }

  return (
    <section ref={section} id="flight" className="flight" aria-label="Mission replay">
      <div ref={sticky} className="flight__sticky">
        <div className={`flight__poster ${ready ? 'is-hidden' : ''}`} aria-hidden="true">
          <div className="flight__poster-horizon" />
          {!ready && near && <p className="flight__loading mono">Calibrating sensors…</p>}
        </div>
        {near && (
          <div className={`flight__canvas ${ready ? 'is-ready' : ''}`}>
            <Suspense fallback={null}>
              <FlightScene active={inView} compact={compact} theme={theme} onReady={() => setReady(true)} />
            </Suspense>
          </div>
        )}
        <div className="flight__veil" aria-hidden="true" />
        <div className="hud-frame" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>

        <div className="flight__overlay container">
          <div ref={hero} className="flight__hero flight__intro">
            <p className="eyebrow">Mission replay</p>
            <h2 className="flight__title">
              Watch one flight, <em>start to finish.</em>
            </h2>
            <p className="flight__body">
              Keep scrolling. The drone lifts off, maps the site, inspects it, builds the 3D model and hands over to the
              robot.
            </p>
            <p className="flight__cue mono" aria-hidden="true">
              <span className="flight__cue-line" /> Scroll to take off
            </p>
          </div>

          {CHAPTERS.map((c, i) => {
            if (i === 0) return null
            const copy = CHAPTER_COPY[c.id]
            const caps = AERIAL_CAPS.map((cap, idx) => ({ cap, idx })).filter((x) => x.cap.chapter === c.id)
            return (
              <article
                key={c.id}
                ref={(el) => {
                  chapters.current[i] = el
                }}
                className={`flight__chapter ${caps.length ? 'has-cards' : ''} ${c.id === 'handoff' ? 'is-handoff' : ''}`}
                style={{ opacity: 0 }}
              >
                <p className="eyebrow">{copy.eyebrow}</p>
                <h2 className="flight__title">{copy.title}</h2>
                {copy.body && <p className="flight__body">{copy.body}</p>}
                {c.id === 'handoff' && (
                  <a className="btn btn--gold" href="#robotics">
                    Explore robotics
                  </a>
                )}
                {caps.length > 0 && (
                  <ul className="flight__cards">
                    {caps.map(({ cap, idx }) => (
                      <li
                        key={cap.id}
                        ref={(el) => {
                          cards.current[idx] = el
                        }}
                        className="cap-card"
                        style={{ opacity: 0 }}
                      >
                        <CapIcon id={cap.id} />
                        <div>
                          <h3>{cap.title}</h3>
                          <p>{cap.body}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            )
          })}
        </div>

        <div className="hud mono" aria-hidden="true">
          <div>
            <span className="hud__k">ALT</span>
            <span ref={(el) => { hud.current.alt = el }}>0.0</span>
            <span className="hud__u">m</span>
          </div>
          <div>
            <span className="hud__k">SPD</span>
            <span ref={(el) => { hud.current.spd = el }}>0.0</span>
            <span className="hud__u">m/s</span>
          </div>
          <div>
            <span className="hud__k">HDG</span>
            <span ref={(el) => { hud.current.hdg = el }}>000</span>
            <span className="hud__u">°</span>
          </div>
          <div className="hud__mode">
            <span className="hud__dot" />
            <span ref={(el) => { hud.current.mode = el }}>PAD</span>
          </div>
        </div>

        <nav className="rail" aria-label="Flight chapters">
          <span className="rail__track">
            <span ref={railFill} className="rail__fill" />
          </span>
          <ol>
            {CHAPTERS.map((c, i) => (
              <li key={c.id}>
                <button
                  type="button"
                  className={i === active ? 'is-active' : ''}
                  aria-current={i === active ? 'step' : undefined}
                  onClick={() => jumpTo(c.start)}
                >
                  <span className="rail__dot" />
                  <span className="rail__label mono">{c.label}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
        <div ref={exit} className="flight__exit" aria-hidden="true" />
      </div>
    </section>
  )
}
