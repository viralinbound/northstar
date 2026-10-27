import { useCallback, useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { MAP_M, MAP_W, renderLayer } from '../lib/maprender'
import { useInView, useNearViewport } from '../lib/env'
import { useTheme } from '../lib/theme'
import { SITE, type Pt } from '../lib/survey'
import { HOME, PLAN, POIS, REPLAY_FACTOR, ROUTE, T_TOTAL, fmtClock, frameAt, paintedSpans, routeUpTo, spotted, type Poi } from '../lib/missionSim'
import { RobotLive } from './RobotLive'
import { Logo } from './Icons'

const M = MAP_W / MAP_M.w // map pixels per metre
type Found = { poi: Poi; t: number }

/** "Inside the product": a live Mission Control screen playing a demo flight in real time. */
export function MissionControl() {
  const section = useRef<HTMLElement>(null)
  const device = useRef<HTMLDivElement>(null)
  const mapBox = useRef<HTMLDivElement>(null)
  const base = useRef<HTMLCanvasElement>(null)
  const cov = useRef<HTMLCanvasElement>(null)
  const over = useRef<HTMLCanvasElement>(null)
  const cam = useRef<HTMLCanvasElement>(null)
  const ortho = useRef<HTMLCanvasElement | null>(null)
  const tele = useRef<Record<string, HTMLElement | SVGElement | null>>({})
  const sim = useRef({ t: 0, prevD: 0, found: new Set<string>(), heading: 0, camHeading: 0 })

  const [tab, setTab] = useState<'drone' | 'robot'>('drone')
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [thermal, setThermal] = useState(false)
  const [found, setFound] = useState<Found[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [booted, setBooted] = useState(false)
  const near = useNearViewport(section, '700px')
  const inView = useInView(device)
  const theme = useTheme()

  const t = (k: string) => (el: HTMLElement | SVGElement | null) => {
    tele.current[k] = el
  }

  // coverage layer: clipped to the site boundary, painted as the drone flies
  const resetCoverage = useCallback(() => {
    const c = cov.current?.getContext('2d')
    if (!c) return
    c.restore()
    c.clearRect(0, 0, MAP_W, MAP_W)
    c.save()
    c.beginPath()
    SITE.forEach(([x, y], i) => (i ? c.lineTo(x * M, y * M) : c.moveTo(x * M, y * M)))
    c.closePath()
    c.clip()
    sim.current.prevD = 0
    sim.current.found.clear()
    setFound([])
    setSelected(null)
  }, [])

  useEffect(() => {
    if (!near) return
    let live = true
    renderLayer('ortho', theme).then((src) => {
      if (!live) return
      ortho.current = src
      ;[base.current, cov.current].forEach((cv) => {
        if (!cv) return
        cv.width = src.width
        cv.height = src.height
      })
      base.current?.getContext('2d')?.drawImage(src, 0, 0)
      const c = cov.current?.getContext('2d')
      if (c) {
        c.save()
        resetCoverage()
        // repaint whatever was already flown (e.g. after a theme switch)
        paintedSpans(0, frameAt(sim.current.t).travelled).forEach((s) => paintSpan(c, src, s))
        sim.current.prevD = frameAt(sim.current.t).travelled
      }
      setReady(true)
    })
    return () => {
      live = false
    }
  }, [near, theme, resetCoverage])

  // first time on screen: a short "connecting" boot overlay
  useEffect(() => {
    if (!inView || booted) return
    const id = setTimeout(() => setBooted(true), 1400)
    return () => clearTimeout(id)
  }, [inView, booted])

  // the live loop (only while visible, on the drone tab)
  useEffect(() => {
    if (!ready || !inView || tab !== 'drone') return
    const ov = over.current
    const box = mapBox.current
    const camC = cam.current
    if (!ov || !box || !camC) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const size = () => {
      ov.width = box.clientWidth * dpr
      ov.height = box.clientHeight * dpr
    }
    size()
    const ro = new ResizeObserver(size)
    ro.observe(box)
    camC.width = 480
    camC.height = 300

    let raf = 0
    let last = performance.now()
    let lastClock = 0
    const s = sim.current
    const covCtx = cov.current!.getContext('2d')!
    const o = ov.getContext('2d')!
    const cc = camC.getContext('2d')!
    const css = getComputedStyle(document.documentElement)
    const accent = css.getPropertyValue('--cyan').trim() || '#3be3f6'
    const accent2 = css.getPropertyValue('--violet').trim() || '#9d7bff'
    const warn = css.getPropertyValue('--gold').trim() || '#ffc35a'

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (playing) s.t += dt * speed
      if (s.t >= T_TOTAL) {
        s.t = 0
        resetCoverage()
      }
      const f = frameAt(s.t)

      // coverage + findings
      if (f.travelled > s.prevD && ortho.current) {
        paintedSpans(s.prevD, f.travelled).forEach((sp) => paintSpan(covCtx, ortho.current!, sp))
        POIS.forEach((p) => {
          if (!s.found.has(p.id) && spotted(p, f, s.prevD)) {
            s.found.add(p.id)
            setFound((list) => [{ poi: p, t: f.t }, ...list])
          }
        })
        s.prevD = f.travelled
      }
      s.heading = lerpAngle(s.heading, f.heading, 0.12)
      s.camHeading = lerpAngle(s.camHeading, f.heading, 0.06)

      drawOverlay(o, ov.width, ov.height, f, s.heading, now, accent, accent2, warn, s.found, selected)
      if (ortho.current) drawCamera(cc, ortho.current, f, s.camHeading)

      // telemetry text (direct DOM writes, no re-render)
      const T = tele.current
      if (T.alt) T.alt.textContent = f.alt.toFixed(1)
      if (T.spd) T.spd.textContent = f.speed.toFixed(1)
      if (T.bat) T.bat.textContent = String(Math.round(f.battery))
      if (T.batBar) T.batBar.style.transform = `scaleX(${f.battery / 100})`
      if (T.photos) T.photos.textContent = f.photos.toLocaleString('en')
      if (T.cov) T.cov.textContent = String(Math.round(f.coverage))
      if (T.covRing) T.covRing.style.strokeDashoffset = String(100 - f.coverage)
      if (T.wind) T.wind.textContent = (3.4 + Math.sin(now / 1700) * 0.6 + Math.sin(now / 430) * 0.2).toFixed(1)
      if (T.phase) T.phase.textContent = f.phase
      if (T.line) T.line.textContent = f.phase === 'Survey' ? `Line ${f.line} of ${f.lines}` : f.phase
      if (T.prog) T.prog.style.transform = `scaleX(${f.t / T_TOTAL})`
      if (T.elapsed) T.elapsed.textContent = fmtClock(f.t * REPLAY_FACTOR)
      if (T.camAlt) T.camAlt.textContent = `${f.alt.toFixed(0)} m`
      if (T.camTime) T.camTime.textContent = fmtClock(f.t * REPLAY_FACTOR)
      if (now - lastClock > 500 && T.clock) {
        lastClock = now
        T.clock.textContent = new Date().toLocaleTimeString('en-GB')
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [ready, inView, tab, playing, speed, selected, resetCoverage])

  // desktop: the screen tilts up and fills out as it scrolls in ("going inside")
  useEffect(() => {
    const mm = gsap.matchMedia()
    mm.add('(min-width: 1025px) and (prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(
        device.current,
        { rotateX: 26, scale: 0.8, y: 60, opacity: 0.55 },
        {
          rotateX: 0,
          scale: 1,
          y: 0,
          opacity: 1,
          ease: 'none',
          scrollTrigger: { trigger: device.current, start: 'top bottom', end: 'top 18%', scrub: 0.6 },
        },
      )
    })
    return () => mm.revert()
  }, [])

  return (
    <section ref={section} id="product" className="product" aria-labelledby="product-title">
      <div className="container product__head">
        <p className="eyebrow">Inside the product</p>
        <h2 id="product-title" className="section-title split-words">
          This is the screen your team watches. <em>Live.</em>
        </h2>
        <p className="section-lede">
          A demo mission is flying below. The map fills in as it flies, the camera follows it, and anything worth a look
          drops into the findings list. Click around.
        </p>
      </div>

      <div className="product__stage container">
        <div ref={device} className={`app ${booted ? 'is-booted' : ''}`} data-cursor="Live">
          {/* top bar */}
          <header className="app__bar">
            <div className="app__brand">
              <Logo size={18} />
              <strong>Mission Control</strong>
              <span className="app__project">Demo site · Survey 14</span>
            </div>
            <div className="app__tabs" role="tablist" aria-label="Live view">
              <button role="tab" type="button" aria-selected={tab === 'drone'} onClick={() => setTab('drone')}>
                Drone NS-01
              </button>
              <button role="tab" type="button" aria-selected={tab === 'robot'} onClick={() => setTab('robot')}>
                Robot GU-02
              </button>
            </div>
            <div className="app__meta mono">
              <span className="app__live">
                <span /> Live
              </span>
              <span ref={t('clock')} className="app__clock">--:--:--</span>
              <span className="app__demo">Demo data</span>
            </div>
          </header>

          {tab === 'drone' ? (
            <div className="app__body">
              {/* map */}
              <div className="app__map">
                <div className="app__panel-head mono">
                  <span>Site map · coverage</span>
                  <span ref={t('line')}>Pre-flight</span>
                </div>
                <div ref={mapBox} className="app__mapbox">
                  <canvas ref={base} className="app__base" aria-hidden="true" />
                  <canvas ref={cov} className="app__cov" aria-hidden="true" />
                  <canvas ref={over} className="app__over" aria-label="Live map of the drone route and covered area" role="img" />
                  {!ready && <p className="app__loading mono">Loading site map…</p>}
                </div>
                <div className="app__legend mono">
                  <span><i className="lg lg--done" /> Mapped</span>
                  <span><i className="lg lg--route" /> Planned route</span>
                  <span><i className="lg lg--find" /> Finding</span>
                </div>
              </div>

              {/* right column */}
              <aside className="app__side">
                <div className="app__cam">
                  <canvas ref={cam} className={thermal ? 'is-thermal' : ''} aria-label="Simulated downward camera feed" role="img" />
                  <div className="app__hud mono" aria-hidden="true">
                    <span className="app__rec"><i /> REC</span>
                    <span ref={t('camTime')} className="app__tc">00:00</span>
                    <span className="app__cross" />
                    <span ref={t('camAlt')} className="app__alt">0 m</span>
                    <span className="app__scan" />
                  </div>
                  <div className="app__camtabs">
                    <button type="button" aria-pressed={!thermal} onClick={() => setThermal(false)}>RGB</button>
                    <button type="button" aria-pressed={thermal} onClick={() => setThermal(true)}>Thermal</button>
                  </div>
                </div>

                <dl className="app__tele">
                  <div>
                    <dt className="mono">Altitude</dt>
                    <dd><span ref={t('alt')}>0.0</span><small>m</small></dd>
                  </div>
                  <div>
                    <dt className="mono">Speed</dt>
                    <dd><span ref={t('spd')}>0.0</span><small>m/s</small></dd>
                  </div>
                  <div>
                    <dt className="mono">Battery</dt>
                    <dd><span ref={t('bat')}>100</span><small>%</small></dd>
                    <span className="app__meter"><span ref={t('batBar')} /></span>
                  </div>
                  <div>
                    <dt className="mono">Photos</dt>
                    <dd><span ref={t('photos')}>0</span></dd>
                  </div>
                  <div className="app__covcell">
                    <dt className="mono">Coverage</dt>
                    <dd><span ref={t('cov')}>0</span><small>%</small></dd>
                    <svg viewBox="0 0 36 36" className="app__ring" aria-hidden="true">
                      <circle cx="18" cy="18" r="15.9" pathLength="100" />
                      <circle ref={t('covRing')} cx="18" cy="18" r="15.9" pathLength="100" className="app__ring-val" />
                    </svg>
                  </div>
                  <div>
                    <dt className="mono">Wind</dt>
                    <dd><span ref={t('wind')}>3.4</span><small>m/s</small></dd>
                  </div>
                </dl>

                <div className="app__finds">
                  <div className="app__panel-head mono">
                    <span>Findings</span>
                    <span>{found.length} / {POIS.length}</span>
                  </div>
                  <ul aria-live="polite">
                    {found.length === 0 && <li className="app__empty">Nothing flagged yet. Watch the map.</li>}
                    {found.map(({ poi, t: at }) => (
                      <li key={poi.id}>
                        <button
                          type="button"
                          className={`find ${selected === poi.id ? 'is-on' : ''}`}
                          onClick={() => setSelected((s) => (s === poi.id ? null : poi.id))}
                        >
                          <Thumb src={ortho.current} at={poi.at} />
                          <span className="find__txt">
                            <strong>{poi.title}</strong>
                            <span className="mono">
                              {poi.kind} · {fmtClock(at * REPLAY_FACTOR)}
                            </span>
                          </span>
                          <span className={`find__lvl find__lvl--${poi.level.toLowerCase()}`}>{poi.level}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </aside>

              {/* timeline */}
              <footer className="app__time">
                <button type="button" className="app__play" onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause' : 'Play'}>
                  {playing ? (
                    <svg viewBox="0 0 24 24" width="16" height="16"><path d="M7 5h3v14H7zM14 5h3v14h-3z" /></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="16" height="16"><path d="M7 4l13 8-13 8z" /></svg>
                  )}
                </button>
                <div className="app__track">
                  <span ref={t('prog')} className="app__prog" />
                  <span className="app__ticks mono" aria-hidden="true">
                    <i style={{ left: '0%' }}>Take-off</i>
                    <i style={{ left: '12%' }}>Survey</i>
                    <i style={{ left: '82%' }}>Home</i>
                  </span>
                </div>
                <span className="app__elapsed mono">
                  <span ref={t('elapsed')}>00:00</span> · <span ref={t('phase')}>Pre-flight</span>
                </span>
                <div className="app__speed" role="group" aria-label="Playback speed">
                  {[1, 2, 4].map((x) => (
                    <button key={x} type="button" aria-pressed={speed === x} onClick={() => setSpeed(x)}>
                      {x}×
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="app__restart mono"
                  onClick={() => {
                    sim.current.t = 0
                    resetCoverage()
                    setPlaying(true)
                  }}
                >
                  Restart
                </button>
              </footer>
            </div>
          ) : (
            <RobotLive active={inView && tab === 'robot'} />
          )}

          <div className="app__boot mono" aria-hidden="true">
            <span>Connecting to NS-01</span>
            <span>Link OK · GPS 18 sats · Battery 100%</span>
          </div>
        </div>
        <p className="product__note mono">
          Demo mission on a generated site, played about {REPLAY_FACTOR}× faster than a real flight. Findings are examples.
        </p>
      </div>
    </section>
  )
}

function paintSpan(c: CanvasRenderingContext2D, src: HTMLCanvasElement, s: { x0: number; x1: number; y: number }) {
  const x = (s.x0 - PLAN.along / 2) * M
  const y = (s.y - PLAN.across / 2) * M
  const w = (s.x1 - s.x0 + PLAN.along) * M
  const h = PLAN.across * M
  c.drawImage(src, x, y, w, h, x, y, w, h)
}

function lerpAngle(a: number, b: number, k: number) {
  const d = Math.atan2(Math.sin(b - a), Math.cos(b - a))
  return a + d * k
}

function drawOverlay(
  o: CanvasRenderingContext2D,
  W: number,
  H: number,
  f: ReturnType<typeof frameAt>,
  heading: number,
  now: number,
  accent: string,
  accent2: string,
  warn: string,
  found: Set<string>,
  selected: string | null,
) {
  const k = W / MAP_M.w
  o.clearRect(0, 0, W, H)
  o.lineJoin = 'round'
  o.lineCap = 'round'
  const path = (pts: Pt[]) => {
    o.beginPath()
    pts.forEach(([x, y], i) => (i ? o.lineTo(x * k, y * k) : o.moveTo(x * k, y * k)))
  }
  // site boundary
  path([...SITE, SITE[0]])
  o.setLineDash([6 * k, 4 * k])
  o.lineWidth = 1.5 * (W / 600)
  o.strokeStyle = warn
  o.stroke()
  // planned route (dashed) and flown route (solid)
  o.setLineDash([3 * k, 4 * k])
  o.lineWidth = 1.2 * (W / 600)
  o.strokeStyle = 'rgba(255,255,255,0.45)'
  path(ROUTE)
  o.stroke()
  o.setLineDash([])
  o.lineWidth = 2.4 * (W / 600)
  o.strokeStyle = accent
  path(routeUpTo(f.travelled))
  o.stroke()
  // home pad
  o.fillStyle = warn
  o.beginPath()
  o.arc(HOME[0] * k, HOME[1] * k, 4.5 * (W / 600), 0, Math.PI * 2)
  o.fill()
  // findings
  POIS.forEach((p) => {
    if (!found.has(p.id)) return
    const [x, y] = [p.at[0] * k, p.at[1] * k]
    const pulse = (now / 1000) % 1.6
    o.strokeStyle = p.id === selected ? accent2 : '#ff5a4f'
    o.lineWidth = 2
    o.globalAlpha = 1 - pulse / 1.6
    o.beginPath()
    o.arc(x, y, (6 + pulse * 14) * (W / 600), 0, Math.PI * 2)
    o.stroke()
    o.globalAlpha = 1
    o.fillStyle = p.id === selected ? accent2 : '#ff5a4f'
    o.beginPath()
    o.arc(x, y, 4.5 * (W / 600), 0, Math.PI * 2)
    o.fill()
    if (p.id === selected) {
      o.lineWidth = 2
      o.strokeStyle = accent2
      o.strokeRect(x - 22 * (W / 600), y - 22 * (W / 600), 44 * (W / 600), 44 * (W / 600))
    }
  })
  // drone: camera footprint + marker
  const [dx, dy] = [f.pos[0] * k, f.pos[1] * k]
  const scale = Math.max(0.15, f.alt / 70)
  o.save()
  o.translate(dx, dy)
  o.rotate(heading)
  o.fillStyle = 'rgba(255,255,255,0.12)'
  o.strokeStyle = 'rgba(255,255,255,0.8)'
  o.lineWidth = 1
  const fw = PLAN.along * k * scale
  const fh = PLAN.across * k * scale
  o.fillRect(-fw / 2, -fh / 2, fw, fh)
  o.strokeRect(-fw / 2, -fh / 2, fw, fh)
  const r = 9 * (W / 600)
  o.fillStyle = accent
  o.shadowColor = accent
  o.shadowBlur = 14
  o.beginPath()
  o.moveTo(r * 1.3, 0)
  o.lineTo(-r * 0.8, r * 0.85)
  o.lineTo(-r * 0.35, 0)
  o.lineTo(-r * 0.8, -r * 0.85)
  o.closePath()
  o.fill()
  o.restore()
  o.shadowBlur = 0
}

function drawCamera(c: CanvasRenderingContext2D, src: HTMLCanvasElement, f: ReturnType<typeof frameAt>, heading: number) {
  const W = c.canvas.width
  const H = c.canvas.height
  const viewM = 14 + f.alt * 1.25 // metres across the frame
  const s = W / viewM / M
  c.fillStyle = '#05070d'
  c.fillRect(0, 0, W, H)
  c.save()
  c.translate(W / 2, H / 2)
  c.rotate(-Math.PI / 2 - heading)
  c.scale(s, s)
  c.imageSmoothingEnabled = true
  c.drawImage(src, -f.pos[0] * M, -f.pos[1] * M)
  c.restore()
  // slight vignette
  const g = c.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.7)
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(1, 'rgba(0,0,0,0.55)')
  c.fillStyle = g
  c.fillRect(0, 0, W, H)
}

/** Tiny crop of the map around a finding. */
function Thumb({ src, at }: { src: HTMLCanvasElement | null; at: Pt }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c || !src) return
    c.width = 112
    c.height = 112
    const ctx = c.getContext('2d')!
    const half = 22 * M
    ctx.drawImage(src, at[0] * M - half, at[1] * M - half, half * 2, half * 2, 0, 0, 112, 112)
    ctx.strokeStyle = '#ff5a4f'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(56, 56, 18, 0, Math.PI * 2)
    ctx.stroke()
  }, [src, at])
  return <canvas ref={ref} className="find__thumb" aria-hidden="true" />
}
