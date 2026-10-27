import { lazy, Suspense, useRef, useState } from 'react'
import { hasWebGL, useInView, useNearViewport, useReducedMotion } from '../lib/env'
import { useTheme } from '../lib/theme'
import type { RobotMode } from '../three/RobotViewer'
import { ROBOT_CONFIG, ROBOT_SCENARIOS, SCENARIO_PHOTO } from './content'
import { Photo } from './Photo'
import { StaticRobotArt } from './Icons'

const RobotViewer = lazy(() => import('../three/RobotViewer'))

const MODES: { id: RobotMode; label: string; hint: string }[] = [
  { id: 'stand', label: 'Stand', hint: 'Idle on station' },
  { id: 'walk', label: 'Walk', hint: 'Trotting gait' },
  { id: 'scan', label: 'Scan', hint: 'LiDAR sweep' },
]

export function Robotics() {
  const stage = useRef<HTMLDivElement>(null)
  const near = useNearViewport(stage, '500px')
  const inView = useInView(stage, '100px')
  const reduced = useReducedMotion()
  const theme = useTheme()
  const [mode, setMode] = useState<RobotMode>('walk')
  const [ready, setReady] = useState(false)
  const [scenario, setScenario] = useState<string>(ROBOT_SCENARIOS[0].id)
  const use3D = near && hasWebGL()
  const current = ROBOT_SCENARIOS.find((s) => s.id === scenario) ?? ROBOT_SCENARIOS[0]

  return (
    <section id="robotics" className="robotics" aria-labelledby="robotics-title">
      <div className="container">
        <header className="section-head reveal">
          <p className="eyebrow eyebrow--gold">Ground robotics</p>
          <h2 id="robotics-title" className="section-title split-words">
            The inspector that <em>walks</em> in.
          </h2>
          <p className="section-lede">
            Some jobs are under a roof. The ground unit goes where the drone can’t: plant floors, substations, tunnels
            and stairwells. Same plan, same sensors, same report.
          </p>
        </header>

        <div className="robotics__grid">
          <div className="robot-stage reveal">
            <div ref={stage} className="robot-stage__canvas" data-cursor="Drag">
              {use3D ? (
                <>
                  {!ready && (
                    <div className="robot-stage__loading">
                      <StaticRobotArt />
                      <p className="mono">Loading 3D model…</p>
                    </div>
                  )}
                  <Suspense fallback={null}>
                    <RobotViewer mode={reduced ? 'stand' : mode} active={inView} theme={theme} onReady={() => setReady(true)} />
                  </Suspense>
                </>
              ) : (
                <StaticRobotArt />
              )}
            </div>
            <div className="robot-stage__bar">
              <div className="segmented" role="group" aria-label="Robot behaviour">
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    aria-pressed={mode === m.id}
                    onClick={() => setMode(m.id)}
                    disabled={reduced || !use3D}
                    title={m.hint}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <p className="robot-stage__hint mono">{use3D ? 'Drag sideways to turn' : 'Interactive model loads with WebGL'}</p>
            </div>
          </div>

          <div className="robotics__info">
            <div className="reveal">
              <h3 className="kicker">What it’s built for <span className="tag">Proposed</span></h3>
              <dl className="spec-list">
                {ROBOT_CONFIG.map(([k, v]) => (
                  <div key={k}>
                    <dt className="mono">{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="fineprint">We’ll publish speeds, runtimes and payloads once they’re proven in field trials.</p>
            </div>

            <div className="scenarios reveal">
              <h3 className="kicker">Where it works</h3>
              <div className="scenarios__tabs" role="tablist" aria-label="Application scenarios">
                {ROBOT_SCENARIOS.map((s) => (
                  <button
                    key={s.id}
                    id={`tab-${s.id}`}
                    role="tab"
                    type="button"
                    aria-selected={scenario === s.id}
                    aria-controls="scenario-panel"
                    tabIndex={scenario === s.id ? 0 : -1}
                    onClick={() => setScenario(s.id)}
                    onKeyDown={(e) => {
                      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
                      const i = ROBOT_SCENARIOS.findIndex((x) => x.id === scenario)
                      const n = ROBOT_SCENARIOS.length
                      const next = ROBOT_SCENARIOS[(i + (e.key === 'ArrowRight' ? 1 : n - 1)) % n]
                      setScenario(next.id)
                      document.getElementById(`tab-${next.id}`)?.focus()
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <div id="scenario-panel" role="tabpanel" aria-labelledby={`tab-${current.id}`} className="scenarios__panel" key={current.id}>
                <div className="scenarios__photo">
                  <Photo name={SCENARIO_PHOTO[current.id]} sizes="(max-width: 1024px) 90vw, 40vw" />
                </div>
                <div className="scenarios__text">
                  <h4>{current.title}</h4>
                  <p>{current.body}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
