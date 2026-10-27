import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { hasWebGL, useReducedMotion } from './lib/env'
import { FlightSection } from './sections/FlightSection'
import { StaticFlight } from './sections/StaticFlight'
import { Robotics } from './sections/Robotics'
import { Aircraft } from './sections/Aircraft'
import { Planner } from './sections/Planner'
import { DataLayers } from './sections/DataLayers'
import { Missions } from './sections/Missions'
import { Hero } from './sections/Hero'
import { MissionControl } from './sections/MissionControl'
import { captureAttribution } from './lib/lead'
import { Cursor } from './sections/Cursor'
import { bindSurface, scramble } from './lib/fx'
import { Contact, Footer, Industries, Marquee, MobileCta, Nav, Platform } from './sections/Sections'

gsap.registerPlugin(ScrollTrigger)
captureAttribution()

/** Wrap each word (keeping inline elements like <em>) so headings can rise in word by word. */
function splitWords(el: HTMLElement) {
  if (el.dataset.split) return
  el.dataset.split = '1'
  const walk = (node: Node) => {
    ;[...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const parts = (child.textContent ?? '').split(/(\s+)/)
        const frag = document.createDocumentFragment()
        parts.forEach((part) => {
          if (!part) return
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(part))
            return
          }
          const outer = document.createElement('span')
          outer.className = 'w'
          const inner = document.createElement('span')
          inner.textContent = part
          outer.appendChild(inner)
          frag.appendChild(outer)
        })
        child.replaceWith(frag)
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        walk(child)
      }
    })
  }
  walk(el)
}

export default function App() {
  const reduced = useReducedMotion()
  // `?static` forces the fallback layout (useful for QA of the reduced-motion path)
  const immersive = !reduced && hasWebGL() && !new URLSearchParams(window.location.search).has('static')

  useEffect(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const els = gsap.utils.toArray<HTMLElement>('.reveal')
      gsap.set(els, { autoAlpha: 0, y: 28 })
      ScrollTrigger.batch(els, {
        start: 'top 88%',
        once: true,
        onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08 }),
      })

      gsap.utils.toArray<HTMLElement>('.split-words').forEach((h) => {
        splitWords(h)
        gsap.from(h.querySelectorAll('.w > span'), {
          yPercent: 110,
          rotate: 4,
          duration: 1,
          ease: 'power4.out',
          stagger: 0.045,
          scrollTrigger: { trigger: h, start: 'top 85%', once: true },
        })
      })

      // eyebrows decode like a HUD readout as they arrive
      gsap.utils.toArray<HTMLElement>('main .eyebrow:not(.eyebrow--chip)').forEach((el) => {
        ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => scramble(el) })
      })

      // page progress bar
      gsap.to('.progress-bar > span', {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: { trigger: document.documentElement, start: 'top top', end: 'bottom bottom', scrub: 0.3 },
      })

      // each process step lights up as the drawn line reaches it
      gsap.utils.toArray<HTMLElement>('.loop__step').forEach((step) => {
        ScrollTrigger.create({
          trigger: step,
          start: 'top 72%',
          onEnter: () => step.classList.add('is-lit'),
          onLeaveBack: () => step.classList.remove('is-lit'),
        })
      })

      // hero copy eases up and fades as the page scrolls away (the form stays put and usable)
      gsap.to('.hero__copy', {
        y: -60,
        autoAlpha: 0.15,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.4 },
      })

      // gentle depth on the mission drawings and the footer word
      gsap.utils.toArray<HTMLElement>('.mission-art, .footer__word').forEach((el) => {
        gsap.fromTo(el, { y: 24 }, { y: -24, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } })
      })

      const line = document.querySelector<HTMLElement>('.loop__line > span')
      if (line) {
        gsap.fromTo(
          line,
          { scaleX: 0 },
          { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.loop', start: 'top 80%', end: 'bottom 55%', scrub: 0.6 } },
        )
      }

      // marquee leans with scroll speed
      const marquee = document.querySelector<HTMLElement>('.marquee')
      let skew = 0
      const st = ScrollTrigger.create({
        onUpdate: (self) => {
          skew = gsap.utils.clamp(-8, 8, self.getVelocity() / -300)
        },
      })
      const ease = () => {
        if (marquee) {
          const cur = parseFloat(marquee.style.getPropertyValue('--skew') || '0')
          const next = cur + (skew - cur) * 0.12
          // only touch the style while it is actually moving
          if (Math.abs(next - cur) > 0.005) marquee.style.setProperty('--skew', next.toFixed(3))
        }
        skew *= 0.9
      }
      gsap.ticker.add(ease)
      return () => {
        st.kill()
        gsap.ticker.remove(ease)
      }
    })

    // magnetic primary buttons, card spotlights and tilt on precise pointers
    mm.add('(prefers-reduced-motion: no-preference) and (pointer: fine)', () => {
      const surfaces = gsap.utils
        .toArray<HTMLElement>('.fx-surface, .planner__panel, .split__half, .scenarios__panel, .layers__info')
        .map((el) => bindSurface(el, el.classList.contains('mission-card')))
      const btns = gsap.utils.toArray<HTMLElement>('.magnetic')
      const offs = btns.map((b) => {
        const xTo = gsap.quickTo(b, 'x', { duration: 0.5, ease: 'power3' })
        const yTo = gsap.quickTo(b, 'y', { duration: 0.5, ease: 'power3' })
        const move = (e: PointerEvent) => {
          const r = b.getBoundingClientRect()
          xTo((e.clientX - (r.left + r.width / 2)) * 0.3)
          yTo((e.clientY - (r.top + r.height / 2)) * 0.4)
        }
        const leave = () => {
          xTo(0)
          yTo(0)
        }
        b.addEventListener('pointermove', move)
        b.addEventListener('pointerleave', leave)
        return () => {
          b.removeEventListener('pointermove', move)
          b.removeEventListener('pointerleave', leave)
        }
      })
      return () => {
        offs.forEach((off) => off())
        surfaces.forEach((off) => off())
      }
    })

    // fonts and lazy 3D can shift layout after first paint
    const refresh = () => ScrollTrigger.refresh()
    document.fonts?.ready.then(refresh)
    window.addEventListener('load', refresh)
    return () => {
      mm.revert()
      window.removeEventListener('load', refresh)
    }
  }, [immersive])

  return (
    <>
      <Cursor />
      <div className="ambient" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="grain" aria-hidden="true" />
      <div className="progress-bar" aria-hidden="true">
        <span />
      </div>
      <a className="skip" href="#lead">
        Skip to the enquiry form
      </a>
      <Nav />
      <main id="top">
        <Hero />
        <MissionControl />
        {immersive ? <FlightSection /> : <StaticFlight />}
        <Robotics />
        <Marquee />
        <Aircraft />
        <Missions />
        <Planner />
        <DataLayers />
        <Platform />
        <Industries />
        <Contact />
      </main>
      <Footer />
      <MobileCta />
    </>
  )
}
