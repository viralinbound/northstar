import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { MISSIONS } from './content'

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
              <MissionArt id={m.id} />
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

/** Line drawings for each mission, drawn in code so they follow the theme colours. */
function MissionArt({ id }: { id: string }) {
  const common = { viewBox: '0 0 320 200', className: 'mission-art', 'aria-hidden': true } as const
  switch (id) {
    case 'roof':
      return (
        <svg {...common}>
          <path className="ln" d="M40 170V110l90-60 90 60v60z" />
          <path className="ln" d="M20 122l110-80 110 80" />
          <ellipse className="hot" cx="110" cy="118" rx="26" ry="10" />
          <ellipse className="hot hot--2" cx="168" cy="132" rx="14" ry="6" />
          <g className="drone-mini" transform="translate(236 46)">
            <path d="M-22 0h44M-14 -6h-16M14 -6h16" />
            <rect x="-8" y="-4" width="16" height="8" rx="2" />
          </g>
          <path className="beam" d="M236 54L150 118M236 54L190 140" />
        </svg>
      )
    case 'stockpile':
      return (
        <svg {...common}>
          <path className="ln" d="M10 170c40-70 70-90 100-90s60 40 90 90" />
          <path className="ln dim" d="M40 150c26-40 46-52 70-52s44 24 66 52M66 130c16-20 28-26 44-26s30 12 42 26" />
          <path className="ln" d="M170 170c26-40 46-54 70-54s40 22 70 54" />
          <path className="grid" d="M0 180H320" />
          <g className="drone-mini" transform="translate(160 36)">
            <path d="M-22 0h44M-14 -6h-16M14 -6h16" />
            <rect x="-8" y="-4" width="16" height="8" rx="2" />
          </g>
          <path className="beam" d="M160 44L100 170M160 44L230 170" />
        </svg>
      )
    case 'substation':
      return (
        <svg {...common}>
          <rect className="ln" x="30" y="70" width="60" height="80" rx="4" />
          <rect className="ln" x="110" y="90" width="50" height="60" rx="4" />
          <path className="ln" d="M40 70V40M60 70V30M80 70V40M120 90V60M150 90V60M40 40h40M120 60h30" />
          <circle className="hot" cx="60" cy="34" r="9" />
          <g className="robot-mini" transform="translate(236 140)">
            <rect x="-30" y="-22" width="60" height="16" rx="5" />
            <rect x="26" y="-26" width="16" height="14" rx="4" />
            <path d="M-22 -6l-6 14 6 14M-8 -6l-6 14 6 14M10 -6l-6 14 6 14M24 -6l-6 14 6 14" />
          </g>
          <path className="beam" d="M276 116L66 38" />
          <path className="grid" d="M0 170H320" />
        </svg>
      )
    case 'tunnel':
      return (
        <svg {...common}>
          <path className="ln" d="M20 190V90a140 80 0 0 1 280 0v100" />
          <path className="ln dim" d="M90 190v-70a70 44 0 0 1 140 0v70M130 190v-46a30 22 0 0 1 60 0v46" />
          <path className="grid" d="M20 190L130 144M300 190L190 144" />
          <g className="robot-mini" transform="translate(160 176)">
            <rect x="-24" y="-18" width="48" height="13" rx="4" />
            <rect x="20" y="-22" width="13" height="11" rx="3" />
            <path d="M-17 -5l-5 11 5 11M-5 -5l-5 11 5 11M8 -5l-5 11 5 11M19 -5l-5 11 5 11" />
          </g>
          <path className="beam" d="M186 152L60 96M186 152L120 74M186 152L250 74M186 152L292 110" />
          <path className="crack" d="M238 98l8 10-6 8 9 12" />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <path className="ln" d="M150 190L170 20L190 190M156 140h28M160 100h20M164 60h12M156 140l24-40M160 100l16-40" />
          <ellipse className="orbit" cx="170" cy="70" rx="110" ry="26" />
          <g className="drone-mini" transform="translate(272 64)">
            <path d="M-22 0h44M-14 -6h-16M14 -6h16" />
            <rect x="-8" y="-4" width="16" height="8" rx="2" />
          </g>
          <path className="beam" d="M262 66L178 56" />
          <circle className="hot" cx="176" cy="56" r="6" />
        </svg>
      )
  }
}
