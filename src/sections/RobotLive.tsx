import { useEffect, useRef, useState } from 'react'

/** Checkpoints on the robot's patrol. Values are simulated demo readings. */
const STOPS = [
  { id: 'P-2', at: 0.12, label: 'Pump P-2 pressure', unit: 'bar', base: 4.2, spread: 0.15, limit: 4.8 },
  { id: 'V-7', at: 0.31, label: 'Valve V-7 position', unit: '% open', base: 100, spread: 0, limit: 999 },
  { id: 'MCC', at: 0.52, label: 'Panel MCC-1 surface temp', unit: '°C', base: 41.5, spread: 1.2, limit: 42 },
  { id: 'T-3', at: 0.71, label: 'Tank T-3 level', unit: '%', base: 72, spread: 1.5, limit: 95 },
  { id: 'AIR', at: 0.9, label: 'Gas sniffer, corridor B', unit: 'ppm', base: 3, spread: 1, limit: 25 },
] as const

type Reading = { value: number; time: string; alert: boolean }
const LOOP_MS = 30000

/** Robot tab: floor plan with the unit walking its round and readings landing as it reaches each stop. */
export function RobotLive({ active }: { active: boolean }) {
  const route = useRef<SVGPathElement>(null)
  const bot = useRef<SVGGElement>(null)
  const needle = useRef<SVGLineElement>(null)
  const [readings, setReadings] = useState<Record<string, Reading>>({})
  const [current, setCurrent] = useState<string>('P-2')
  const latest = useRef(readings)
  latest.current = readings
  const startedAt = useRef(performance.now())

  useEffect(() => {
    if (!active) return
    const path = route.current
    const g = bot.current
    if (!path || !g) return
    const len = path.getTotalLength()
    let raf = 0
    const start = startedAt.current
    let lastStop = -1
    const tick = (now: number) => {
      const t = ((now - start) % LOOP_MS) / LOOP_MS
      const p = path.getPointAtLength(t * len)
      const q = path.getPointAtLength(Math.min(len, t * len + 2))
      const ang = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI
      g.setAttribute('transform', `translate(${p.x} ${p.y}) rotate(${ang})`)
      const idx = STOPS.findIndex((s, i) => t >= s.at && (i === STOPS.length - 1 || t < STOPS[i + 1].at))
      if (idx !== lastStop) {
        lastStop = idx
        if (idx >= 0) {
          const s = STOPS[idx]
          const value = +(s.base + (Math.random() - 0.3) * s.spread * 2).toFixed(1)
          setCurrent(s.id)
          setReadings((r) => ({
            ...r,
            [s.id]: { value, time: new Date().toLocaleTimeString('en-GB'), alert: value > s.limit },
          }))
        }
      }
      if (needle.current) {
        const s = STOPS[Math.max(0, idx)]
        const v = latest.current[s.id]?.value ?? s.base
        const frac = s.unit.includes('%') ? v / 100 : Math.min(1, v / (s.limit * 1.25))
        needle.current.setAttribute('transform', `rotate(${-120 + frac * 240} 60 60)`)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active])

  const cur = STOPS.find((s) => s.id === current)!
  const r = readings[current]

  return (
    <div className="app__body app__body--robot">
      <div className="app__map">
        <div className="app__panel-head mono">
          <span>Plant room B · patrol round</span>
          <span>Robot GU-02 · walking</span>
        </div>
        <div className="app__mapbox app__mapbox--plan">
          <svg viewBox="0 0 420 294" className="plan" role="img" aria-label="Floor plan with the robot's patrol route">
            <defs>
              <pattern id="plan-grid" width="14" height="14" patternUnits="userSpaceOnUse">
                <path d="M14 0H0V14" className="plan__grid" />
              </pattern>
            </defs>
            <rect width="420" height="294" fill="url(#plan-grid)" />
            <g className="plan__walls">
              <rect x="20" y="20" width="380" height="254" rx="6" />
              <path d="M150 20v100M150 160v114M270 20v70M270 130v144M150 140h120" />
            </g>
            <g className="plan__kit">
              <rect x="40" y="40" width="80" height="40" rx="4" />
              <circle cx="330" cy="70" r="26" />
              <rect x="300" y="190" width="70" height="50" rx="4" />
              <rect x="40" y="200" width="70" height="40" rx="4" />
              <path d="M120 60H300M80 80v120M335 96v94" className="plan__pipe" />
            </g>
            <path
              ref={route}
              className="plan__route"
              d="M60 140 L60 110 L130 110 L200 110 L210 60 L290 60 L330 110 L340 170 L335 180 L300 215 L200 215 L130 240 L75 225 L60 180 Z"
            />
            {STOPS.map((s) => {
              const pos = stopPos(s.at)
              const rd = readings[s.id]
              return (
                <g key={s.id} transform={`translate(${pos[0]} ${pos[1]})`} className={`plan__stop ${rd?.alert ? 'is-alert' : rd ? 'is-ok' : ''}`}>
                  <circle r="7" />
                  <text y="-12">{s.id}</text>
                </g>
              )
            })}
            <g ref={bot} className="plan__bot">
              <circle r="16" className="plan__lidar" />
              <rect x="-9" y="-6" width="18" height="12" rx="3" />
              <rect x="7" y="-4" width="5" height="8" rx="2" className="plan__head" />
            </g>
          </svg>
        </div>
        <div className="app__legend mono">
          <span><i className="lg lg--route" /> Patrol route</span>
          <span><i className="lg lg--done" /> Reading OK</span>
          <span><i className="lg lg--find" /> Needs a look</span>
        </div>
      </div>

      <aside className="app__side">
        <div className="gauge">
          <svg viewBox="0 0 120 84" aria-hidden="true">
            <path d="M14 70a50 50 0 0 1 92 0" className="gauge__track" />
            <path d="M14 70a50 50 0 0 1 92 0" className="gauge__fill" pathLength="100" />
            <line ref={needle} x1="60" y1="60" x2="60" y2="22" className="gauge__needle" />
            <circle cx="60" cy="60" r="4" className="gauge__hub" />
          </svg>
          <div className="gauge__read">
            <span className="mono">{cur.id} · now reading</span>
            <strong className={r?.alert ? 'is-alert' : ''}>
              {r ? r.value : '—'} <small>{cur.unit}</small>
            </strong>
            <span>{cur.label}</span>
          </div>
        </div>

        <div className="app__finds">
          <div className="app__panel-head mono">
            <span>This round</span>
            <span>{Object.keys(readings).length} / {STOPS.length}</span>
          </div>
          <ul>
            {STOPS.map((s) => {
              const rd = readings[s.id]
              return (
                <li key={s.id}>
                  <div className={`find find--static ${s.id === current ? 'is-on' : ''}`}>
                    <span className="find__id mono">{s.id}</span>
                    <span className="find__txt">
                      <strong>{s.label}</strong>
                      <span className="mono">{rd ? `${rd.value} ${s.unit} · ${rd.time}` : 'Waiting for the robot'}</span>
                    </span>
                    <span className={`find__lvl ${rd ? (rd.alert ? 'find__lvl--check' : 'find__lvl--ok') : 'find__lvl--note'}`}>
                      {rd ? (rd.alert ? 'Hotter than last round' : 'OK') : 'Next'}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </aside>
    </div>
  )
}

// approximate positions of the stops along the route (matches the path above)
const ROUTE_PTS: [number, number][] = [
  [60, 140], [60, 110], [130, 110], [200, 110], [210, 60], [290, 60], [330, 110], [340, 170], [335, 180], [300, 215], [200, 215], [130, 240], [75, 225], [60, 180], [60, 140],
]
function stopPos(frac: number): [number, number] {
  const seg = ROUTE_PTS.slice(1).map((p, i) => Math.hypot(p[0] - ROUTE_PTS[i][0], p[1] - ROUTE_PTS[i][1]))
  const total = seg.reduce((a, b) => a + b, 0)
  let d = frac * total
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i]) {
      const a = ROUTE_PTS[i]
      const b = ROUTE_PTS[i + 1]
      const k = d / seg[i]
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]
    }
    d -= seg[i]
  }
  return ROUTE_PTS[0]
}
