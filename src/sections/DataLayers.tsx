import { useCallback, useEffect, useRef, useState } from 'react'
import { renderLayer, type Layer } from '../lib/maprender'
import { useInView, useNearViewport } from '../lib/env'
import { useTheme } from '../lib/theme'

const LAYERS: { id: Exclude<Layer, 'ortho'>; label: string; title: string; body: string; legend: string[] }[] = [
  {
    id: 'elevation',
    label: 'Elevation',
    title: 'Height of every point',
    body: 'Colour shows how high the ground is. Useful for drainage, earthworks and spotting where water will sit.',
    legend: ['Low', 'High'],
  },
  {
    id: 'contours',
    label: 'Contours',
    title: 'Lines your engineer already reads',
    body: 'A thin line every 2 m, a bold one every 10 m. Drops straight into CAD.',
    legend: ['2 m minor', '10 m major'],
  },
  {
    id: 'change',
    label: 'Change',
    title: 'What moved since last week',
    body: 'Two flights compared. Red is ground taken away, teal is ground added. Everything else is greyed out.',
    legend: ['Removed', 'Added'],
  },
]

/** Before/after slider: the stitched map on the left, an analysis layer on the right. */
export function DataLayers() {
  const section = useRef<HTMLElement>(null)
  const frame = useRef<HTMLDivElement>(null)
  const base = useRef<HTMLCanvasElement>(null)
  const over = useRef<HTMLCanvasElement>(null)
  const [layer, setLayer] = useState<(typeof LAYERS)[number]['id']>('elevation')
  const [split, setSplit] = useState(52)
  const [ready, setReady] = useState(false)
  const dragging = useRef(false)
  const near = useNearViewport(section, '500px')
  const inView = useInView(frame)
  const hinted = useRef(false)

  useEffect(() => {
    if (!ready || !inView || hinted.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    hinted.current = true
    const keys = [52, 80, 24, 52]
    const start = performance.now() + 400
    const dur = 2200
    let raf = 0
    const tick = (now: number) => {
      if (dragging.current) return
      const t = Math.min(1, Math.max(0, (now - start) / dur))
      const seg = Math.min(keys.length - 2, Math.floor(t * (keys.length - 1)))
      const local = t * (keys.length - 1) - seg
      const e = local * local * (3 - 2 * local)
      setSplit(keys[seg] + (keys[seg + 1] - keys[seg]) * e)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [ready, inView])
  const theme = useTheme()
  const current = LAYERS.find((l) => l.id === layer)!

  const paint = (target: HTMLCanvasElement | null, src: HTMLCanvasElement) => {
    if (!target) return
    target.width = src.width
    target.height = src.height
    target.getContext('2d')!.drawImage(src, 0, 0)
  }

  useEffect(() => {
    if (!near) return
    let live = true
    Promise.all([renderLayer('ortho', theme), renderLayer(layer, theme)]).then(([a, b]) => {
      if (!live) return
      paint(base.current, a)
      paint(over.current, b)
      setReady(true)
    })
    return () => {
      live = false
    }
  }, [near, layer, theme])

  const moveTo = useCallback((clientX: number) => {
    const r = frame.current?.getBoundingClientRect()
    if (!r) return
    setSplit(Math.min(98, Math.max(2, ((clientX - r.left) / r.width) * 100)))
  }, [])

  return (
    <section ref={section} id="data" className="layers" aria-labelledby="layers-title">
      <div className="container">
        <header className="section-head reveal">
          <p className="eyebrow">What you get back</p>
          <h2 id="layers-title" className="section-title split-words">
            One flight. <em>Four</em> ways to read it.
          </h2>
          <p className="section-lede">
            Drag the line. On the left is the stitched map. On the right is what the software pulls out of it.
          </p>
        </header>

        <div className="layers__tabs reveal" role="tablist" aria-label="Analysis layer">
          {LAYERS.map((l) => (
            <button key={l.id} type="button" role="tab" aria-selected={layer === l.id} onClick={() => setLayer(l.id)}>
              {l.label}
            </button>
          ))}
        </div>

        <div className="layers__grid">
          <div
            ref={frame}
            className={`compare reveal ${ready ? 'is-ready' : ''}`}
            data-cursor="Drag"
            style={{ ['--split' as string]: `${split}%` }}
            onPointerDown={(e) => {
              dragging.current = true
              ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
              moveTo(e.clientX)
            }}
            onPointerMove={(e) => dragging.current && moveTo(e.clientX)}
            onPointerUp={() => (dragging.current = false)}
            onPointerCancel={() => (dragging.current = false)}
          >
            <canvas ref={base} aria-hidden="true" />
            <canvas ref={over} className="compare__over" aria-hidden="true" />
            <span className="compare__label compare__label--l mono">Map</span>
            <span className="compare__label compare__label--r mono">{current.label}</span>
            <div
              className="compare__handle"
              role="slider"
              tabIndex={0}
              aria-label="Compare map and analysis layer"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(split)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft') setSplit((s) => Math.max(2, s - 4))
                if (e.key === 'ArrowRight') setSplit((s) => Math.min(98, s + 4))
              }}
            >
              <span />
            </div>
            {!ready && <p className="compare__loading mono">Rendering demo site…</p>}
          </div>

          <aside className="layers__info reveal" key={current.id}>
            <h3>{current.title}</h3>
            <p>{current.body}</p>
            <div className={`legend legend--${current.id}`}>
              <span className="legend__bar" />
              <span className="legend__ends mono">
                <span>{current.legend[0]}</span>
                <span>{current.legend[1]}</span>
              </span>
            </div>
            <p className="fineprint">Demo data generated from a terrain model. Not a real site.</p>
          </aside>
        </div>
      </div>
    </section>
  )
}
