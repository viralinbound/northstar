import { CHAPTERS } from '../lib/flight'
import { AERIAL_CAPS, CHAPTER_COPY } from './content'
import { CapIcon } from './Icons'
import { Photo } from './Photo'

/** Same story as the flight sequence, laid out as ordinary sections. Used for reduced motion or no WebGL. */
export function StaticFlight() {
  return (
    <section id="flight" className="static-flight" aria-label="Mission replay">
      <div className="container static-flight__hero">
        <div>
          <p className="eyebrow">Mission replay</p>
          <h2 className="section-title">
            One flight, <em>start to finish.</em>
          </h2>
          <p className="section-lede">
            The drone lifts off, maps the site, inspects it, builds the 3D model and hands over to the robot.
          </p>
        </div>
        <Photo name="hero-dark" className="static-art" />
      </div>
      <div className="container static-flight__chapters">
        {CHAPTERS.slice(1).map((c) => {
          const copy = CHAPTER_COPY[c.id]
          const caps = AERIAL_CAPS.filter((x) => x.chapter === c.id)
          return (
            <article key={c.id} className="static-chapter">
              <p className="eyebrow">{copy.eyebrow}</p>
              <h2 className="flight__title">{copy.title}</h2>
              {copy.body && <p className="flight__body">{copy.body}</p>}
              {caps.length > 0 && (
                <ul className="flight__cards">
                  {caps.map((cap) => (
                    <li key={cap.id} className="cap-card">
                      <CapIcon id={cap.id} />
                      <div>
                        <h3>{cap.title}</h3>
                        <p>{cap.body}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
