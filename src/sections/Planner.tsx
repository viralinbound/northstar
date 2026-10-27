import { useEffect, useMemo, useRef, useState } from 'react'
import { MAP_M, renderLayer } from '../lib/maprender'
import { useInView, useNearViewport, useReducedMotion } from '../lib/env'
import { useTheme } from '../lib/theme'
import { BATTERY_MIN, CRUISE_MS, SITE, planSurvey } from '../lib/survey'
import { useTween } from '../lib/useTween'

const fmtTime = (min: number) => {
  const m = Math.floor(min)
  const s = Math.round((min - m) * 60)
  return `${m}:${String(s === 60 ? 59 : s).padStart(2, '0')}`
}

/** Interactive lawnmower planner: change height and overlap, watch the route and numbers update. */
export function Planner() {
  const section = useRef<HTMLElement>(null)
  const mapRef = useRef<HTMLCanvasElement>(null)
  const pathRef = useRef<SVGPolylineElement>(null)
  const dot = useRef<SVGGElement>(null)
  const [alt, setAlt] = useState(80)
  const [overlap, setOverlap] = useState(70)
  const [mapReady, setMapReady] = useState(false)
  const near = useNearViewport(section, '600px')
  const inView = useInView(section)
  const reduced = useReducedMotion()
  const theme = useTheme()

  const plan = useMemo(() => planSurvey(SITE, alt, overlap / 100), [alt, overlap])
  const points = plan.path.map((p) => p.join(',')).join(' ')

  useEffect(() => {
    if (!near) return
    let live = true
    renderLayer('ortho', theme).then((src) => {
      const c = mapRef.current
      if (!live || !c) return
      c.width = src.width
      c.height = src.height
      c.getContext('2d')!.drawImage(src, 0, 0)
      setMapReady(true)
    })
    return () => {
      live = false
    }
  }, [near, theme])

  // redraw the route whenever it changes
  useEffect(() => {
    const el = pathRef.current
    if (!el) return
    const len = el.getTotalLength()
    el.style.transition = 'none'
    el.style.strokeDasharray = `${len}`
    el.style.strokeDashoffset = reduced ? '0' : `${len}`
    el.getBoundingClientRect()
    el.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(.65,0,.35,1)'
    el.style.strokeDashoffset = '0'
  }, [points, reduced])

  // drone marker flying the route
  useEffect(() => {
    if (!inView || reduced) return
    const el = pathRef.current
    const g = dot.current
    if (!el || !g) return
    let raf = 0
    const start = performance.now()
    const len = el.getTotalLength()
    const dur = Math.max(9000, len * 2.2)
    const tick = (now: number) => {
      const t = ((now - start) % dur) / dur
      const p = el.getPointAtLength(t * len)
      const q = el.getPointAtLength(Math.min(len, t * len + 1))
      const ang = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI
      g.setAttribute('transform', `translate(${p.x} ${p.y}) rotate(${ang})`)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, reduced, points])

  const lines = useTween(plan.lines.length)
  const photos = useTween(plan.photos)
  const detail = useTween(plan.gsd)
  const minutes = useTween(plan.minutes)
  const stats = [
    { k: 'Flight lines', v: String(Math.round(lines)) },
    { k: 'Photos', v: Math.round(photos).toLocaleString('en') },
    { k: 'Detail', v: `${detail.toFixed(1)} cm/px` },
    { k: 'Flight time', v: fmtTime(minutes) },
    { k: 'Batteries', v: String(plan.batteries) },
    { k: 'Area', v: `${plan.area.toFixed(1)} ha` },
  ]

  return (
    <section ref={section} id="planner" className="planner" aria-labelledby="planner-title">
      <div className="container">
        <header className="section-head section-head--row reveal">
          <div>
            <p className="eyebrow">Try it</p>
            <h2 id="planner-title" className="section-title split-words">
              Plan a survey in <em>two</em> sliders.
            </h2>
          </div>
          <p className="section-lede">
            Fly higher and you cover ground faster but see less detail. Add overlap and the map gets sharper but takes
            longer. Move the sliders and watch the route rebuild.
          </p>
        </header>

        <div className="planner__grid">
          <figure className="planner__map reveal">
            <canvas ref={mapRef} className={mapReady ? 'is-ready' : ''} aria-hidden="true" />
            <svg viewBox={`0 0 ${MAP_M.w} ${MAP_M.h}`} role="img" aria-label={`Survey route with ${plan.lines.length} flight lines over a demo site`}>
              <defs>
                <clipPath id="site-clip">
                  <polygon points={SITE.map((p) => p.join(',')).join(' ')} />
                </clipPath>
              </defs>
              <path
                className="planner__shade"
                fillRule="evenodd"
                d={`M0 0H${MAP_M.w}V${MAP_M.h}H0Z M${SITE.map((p) => p.join(' ')).join(' L')}Z`}
              />
              <g clipPath="url(#site-clip)">
                <polygon className="planner__site-fill" points={SITE.map((p) => p.join(',')).join(' ')} />
                {plan.lines.map((l) => (
                  <rect
                    key={l.y}
                    className="planner__swath"
                    x={l.x0 - plan.along / 2}
                    y={l.y - plan.across / 2}
                    width={l.x1 - l.x0 + plan.along}
                    height={plan.across}
                  />
                ))}
              </g>
              <polygon className="planner__site" points={SITE.map((p) => p.join(',')).join(' ')} />
              <polyline ref={pathRef} className="planner__route" points={points} />
              {plan.path.length > 0 && (
                <g className="planner__home" transform={`translate(${plan.path[0][0]} ${plan.path[0][1]})`}>
                  <circle r="5" />
                  <text y="-9">Home</text>
                </g>
              )}
              <g ref={dot} className="planner__drone" transform={plan.path[0] ? `translate(${plan.path[0][0]} ${plan.path[0][1]})` : undefined}>
                <rect className="planner__fov" x={-plan.along / 2} y={-plan.across / 2} width={plan.along} height={plan.across} />
                <circle r="3.6" />
              </g>
            </svg>
            <figcaption className="mono">Demo site · rendered from generated terrain, not a real location</figcaption>
          </figure>

          <div className="planner__panel reveal">
            <label className="slider">
              <span className="slider__top">
                <span>Flight height</span>
                <output className="mono">{alt} m</output>
              </span>
              <input type="range" min={40} max={120} step={5} value={alt} onChange={(e) => setAlt(+e.target.value)} />
              <span className="slider__ends mono">
                <span>More detail</span>
                <span>Faster</span>
              </span>
            </label>
            <label className="slider">
              <span className="slider__top">
                <span>Photo overlap</span>
                <output className="mono">{overlap}%</output>
              </span>
              <input type="range" min={60} max={85} step={5} value={overlap} onChange={(e) => setOverlap(+e.target.value)} />
              <span className="slider__ends mono">
                <span>Quicker</span>
                <span>Sharper 3D</span>
              </span>
            </label>

            <dl className="stats" aria-live="polite">
              {stats.map((s) => (
                <div key={s.k}>
                  <dt className="mono">{s.k}</dt>
                  <dd>{s.v}</dd>
                </div>
              ))}
            </dl>
            <p className="fineprint">
              Worked out for a 1-inch, 20 MP mapping camera flying at {CRUISE_MS} m/s, with about {BATTERY_MIN} usable
              minutes per battery. Real plans also allow for wind, terrain and airspace.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
