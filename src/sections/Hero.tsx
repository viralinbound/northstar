import { useTheme } from '../lib/theme'
import { HERO } from './content'
import { LeadForm } from './LeadForm'
import { Photo } from './Photo'

const NEXT = [
  ['Tell us about the site', 'Three quick steps, about two minutes.'],
  ['We plan the route', 'Drone, robot or both, matched to what you need to know.'],
  ['You get the plan', 'Sent to your inbox, ready to approve.'],
]

/** Ad landing hero: the offer and the form are both visible without scrolling. */
export function Hero() {
  const theme = useTheme()

  return (
    <section id="lead" className="hero" aria-labelledby="hero-title">
      {/* real photograph: dusk drone flight in dark mode, a drone's-eye site view in light mode */}
      <div className="hero__photo" aria-hidden="true">
        <Photo key={theme} name={theme === 'dark' ? 'hero-dark' : 'site-crane'} className={theme === 'dark' ? 'is-shifted' : ''} priority sizes="100vw" />
      </div>
      <div className="hero__bg" aria-hidden="true" />
      <div className="container hero__grid">
        <div className="hero__copy">
          <p className="eyebrow eyebrow--chip hero-fade">{HERO.eyebrow}</p>
          <h1 id="hero-title" className="display hero-title">
            {HERO.title.map((line, i) => (
              <span key={line} className="hero-title__line" style={{ animationDelay: `${0.1 + i * 0.1}s` }}>
                <span>{i === 2 ? <em>{line}</em> : line}</span>
              </span>
            ))}
          </h1>
          <p className="lede hero-fade" style={{ animationDelay: '0.45s' }}>
            {HERO.body}
          </p>
          <ol className="hero__next hero-fade" style={{ animationDelay: '0.6s' }}>
            {NEXT.map(([k, v], i) => (
              <li key={k}>
                <span className="hero__n mono">{i + 1}</span>
                <div>
                  <strong>{k}</strong>
                  <span>{v}</span>
                </div>
              </li>
            ))}
          </ol>
          <a className="hero__replay mono hero-fade" href="#product" style={{ animationDelay: '0.75s' }}>
            <span className="hero__replay-dot" /> Or step inside a live mission
          </a>
        </div>
        <div className="hero__form hero-fade" style={{ animationDelay: '0.3s' }}>
          <LeadForm variant="hero" />
        </div>
      </div>
    </section>
  )
}
