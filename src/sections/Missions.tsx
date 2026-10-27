import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { MISSIONS, MISSION_PHOTO } from './content'
import { Photo } from './Photo'

/** Pinned on desktop: vertical scroll drives the cards sideways. Phones get a native swipe row. */
export function Missions() {
  const section = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const mm = gsap.matchMedia()
    mm.add('(min-width: 861px) and (prefers-reduced-motion: no-preference)', () => {
      const el = track.current
      const sec = section.current
      if (!el || !sec) return
      const distance = () => el.scrollWidth - window.innerWidth + 48
      const tween = gsap.to(el, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: sec,
          start: 'top top',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          onUpdate: (self) => setIndex(Math.min(MISSIONS.length - 1, Math.round(self.progress * (MISSIONS.length - 1)))),
        },
      })
      // each card leans into place as it crosses the screen
      gsap.utils.toArray<HTMLElement>('.mission-card').forEach((card) => {
        gsap.fromTo(
          card,
          { rotate: 4, y: 40 },
          {
            rotate: 0,
            y: 0,
            ease: 'none',
            scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'center center', scrub: true },
          },
        )
      })
      return () => tween.scrollTrigger?.kill()
    })
    return () => mm.revert()
  }, [])

  return (
    <section ref={section} id="missions" className="missions" aria-labelledby="missions-title">
      <div className="missions__head container">
        <div>
          <p className="eyebrow fx-decode">Field missions</p>
          <h2 id="missions-title" className="section-title split-words">
            Five jobs it was <em>built</em> for.
          </h2>
        </div>
        <p className="missions__count mono" aria-hidden="true">
          <span>{String(index + 1).padStart(2, '0')}</span> / {String(MISSIONS.length).padStart(2, '0')}
        </p>
      </div>
      <div ref={track} className="missions__track">
        {MISSIONS.map((m, i) => (
          <article key={m.id} className="mission-card fx-surface" data-cursor="Mission">
            <div className="mission-card__art">
              <Photo name={MISSION_PHOTO[m.id]} sizes="(max-width: 860px) 82vw, 34vw" />
              <span className="mission-card__hud mono" aria-hidden="true">
                <i />
                {m.who === 'Drone' ? 'AIR' : 'GROUND'} · {m.kit}
              </span>
            </div>
            <div className="mission-card__body">
              <p className="mission-card__meta mono">
                <span>{String(i + 1).padStart(2, '0')}</span>
                <span className={`chip chip--${m.who.toLowerCase()}`}>{m.who}</span>
                <span className="chip">{m.kit}</span>
              </p>
              <h3>{m.title}</h3>
              <p>{m.body}</p>
            </div>
          </article>
        ))}
        <div className="missions__end" aria-hidden="true">
          <p>Got a job that isn’t here?</p>
          <a href="#get-plan" className="btn btn--primary magnetic">
            Tell us about it
          </a>
        </div>
      </div>
    </section>
  )
}
