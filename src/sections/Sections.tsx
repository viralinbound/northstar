import { useEffect, useState } from 'react'
import { setTheme, useTheme } from '../lib/theme'
import { INDUSTRIES, MARQUEE, PLATFORM_STEPS } from './content'
import { Logo } from './Icons'
import { LeadForm } from './LeadForm'

const NAV = [
  { href: '#product', label: 'Live demo' },
  { href: '#flight', label: 'Replay' },
  { href: '#robotics', label: 'Robotics' },
  { href: '#aircraft', label: 'Aircraft' },
  { href: '#planner', label: 'Planner' },
  { href: '#data', label: 'Data' },
  { href: '#industries', label: 'Industries' },
]

export function Nav() {
  const [open, setOpen] = useState(false)
  const [solid, setSolid] = useState(false)
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 40)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className={`nav ${solid ? 'is-solid' : ''} ${open ? 'is-open' : ''}`}>
      <div className="container nav__inner">
        <a href="#top" className="brand" aria-label="Northstar home">
          <Logo />
          <span>Northstar</span>
        </a>
        <nav id="nav-menu" className="nav__links" aria-label="Primary">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} onClick={() => setOpen(false)}>
              {n.label}
            </a>
          ))}
          <a href="#lead" className="btn btn--primary btn--sm" onClick={() => setOpen(false)}>
            Get a mission plan
          </a>
        </nav>
        <ThemeToggle />
        <button
          type="button"
          className="nav__toggle"
          aria-expanded={open}
          aria-controls="nav-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
        </button>
      </div>
    </header>
  )
}

function ThemeToggle() {
  const theme = useTheme()
  const next = theme === 'dark' ? 'light' : 'dark'
  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      onClick={() => setTheme(next)}
    >
      {theme === 'dark' ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 14.6A8.2 8.2 0 0 1 9.4 4a8.2 8.2 0 1 0 10.6 10.6z" />
        </svg>
      )}
    </button>
  )
}

export function Marquee() {
  const items = [...MARQUEE, ...MARQUEE]
  return (
    <div className="marquee" aria-hidden="true">
      {[0, 1].map((row) => (
        <div key={row} className={`marquee__row ${row ? 'is-reverse' : ''}`}>
          <div className="marquee__track">
            {items.map((m, i) => (
              <span key={i} className={i % 2 === row ? 'is-outline' : ''}>
                {m}
                <svg viewBox="0 0 32 32" width="28" height="28">
                  <path d="M16 2.5l2.6 10.9L29.5 16l-10.9 2.6L16 29.5l-2.6-10.9L2.5 16l10.9-2.6z" />
                </svg>
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function Platform() {
  return (
    <section id="platform" className="platform" aria-labelledby="platform-title">
      <div className="container">
        <header className="section-head reveal">
          <p className="eyebrow">How a job runs</p>
          <h2 id="platform-title" className="section-title split-words">
            Plan once. Check <em>every</em> week.
          </h2>
          <p className="section-lede">
            The drone and the robot share one plan and one map, so the roof and the basement end up in the same report.
          </p>
        </header>
        <ol className="loop" data-draw>
          <span className="loop__line" aria-hidden="true">
            <span />
          </span>
          {PLATFORM_STEPS.map((s, i) => (
            <li key={s.k} className="loop__step reveal">
              <span className="loop__n mono">{String(i + 1).padStart(2, '0')}</span>
              <h3>{s.k}</h3>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>
        <div className="split reveal">
          <div className="split__half split__half--air">
            <p className="mono split__k">From the air</p>
            <p>Site maps, levels, stockpile volumes, roof and façade condition, what changed this week.</p>
          </div>
          <div className="split__half split__half--ground">
            <p className="mono split__k">On the ground</p>
            <p>Dial readings, hot joints, leaks, indoor progress and spaces nobody wants to crawl into.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export function Industries() {
  return (
    <section id="industries" className="industries" aria-labelledby="industries-title">
      <div className="container">
        <header className="section-head section-head--row reveal">
          <h2 id="industries-title" className="section-title split-words">
            Made for sites that <em>don’t</em> sit still.
          </h2>
          <p className="section-lede">Places where things change every week and getting someone up there is slow, risky or both.</p>
        </header>
        <ul className="industries__list">
          {INDUSTRIES.map((x, i) => (
            <li key={x.name} className="reveal" tabIndex={0}>
              <span className="industries__n mono">{String(i + 1).padStart(2, '0')}</span>
              <span className="industries__name">{x.name}</span>
              <span className="industries__note">{x.note}</span>
              <svg className="industries__arrow" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function Contact() {
  return (
    <section id="get-plan" className="contact" aria-labelledby="contact-title">
      <div className="container contact__grid">
        <div className="contact__copy reveal">
          <p className="eyebrow eyebrow--gold">Next step</p>
          <h2 id="contact-title" className="contact__title split-words">
            Send us the site. <em>We’ll</em> plan the first flight.
          </h2>
          <p className="section-lede">
            Three quick steps. Tell us what you need, where the site is and how to reach you. We reply with a suggested
            route for the drone, the robot, or both.
          </p>
          <ul className="contact__ticks">
            <li>No hardware to buy up front</li>
            <li>Drone and robot planned together</li>
            <li>Your details are only used to reply</li>
          </ul>
        </div>
        <div className="contact__form reveal">
          <LeadForm variant="section" />
        </div>
      </div>
    </section>
  )
}

/** Phone-only bar that keeps the form one tap away once the hero form is off screen. */
export function MobileCta() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const hero = document.getElementById('lead')
    const bottom = document.getElementById('get-plan')
    if (!hero || !bottom) return
    const seen = { hero: true, bottom: false }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.target === hero) seen.hero = e.isIntersecting
        if (e.target === bottom) seen.bottom = e.isIntersecting
      })
      setShow(!seen.hero && !seen.bottom)
    })
    io.observe(hero)
    io.observe(bottom)
    return () => io.disconnect()
  }, [])
  return (
    <div className={`mobile-cta ${show ? 'is-shown' : ''}`} aria-hidden={!show}>
      <span>Mission plan for your site</span>
      <a href="#get-plan" className="btn btn--primary btn--sm" tabIndex={show ? 0 : -1}>
        Get started
      </a>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="footer">
      <p className="footer__word" aria-hidden="true">
        {'Northstar'.split('').map((ch, i) => (
          <span key={i} style={{ transitionDelay: `${i * 25}ms` }}>
            {ch}
          </span>
        ))}
      </p>
      <div className="container footer__inner">
        <a href="#top" className="brand" aria-label="Northstar home">
          <Logo size={22} />
          <span>Northstar</span>
        </a>
        <nav aria-label="Footer">
          {NAV.map((n) => (
            <a key={n.href} href={n.href}>
              {n.label}
            </a>
          ))}
          <a href="#get-plan">Get a plan</a>
        </nav>
        <p className="fineprint">
          Capabilities shown are proposed and subject to confirmation. 3D scenes and maps are illustrations, not real sites. © {new Date().getFullYear()} Northstar.
        </p>
      </div>
    </footer>
  )
}
