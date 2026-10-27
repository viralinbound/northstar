import { useId, useRef, useState } from 'react'
import { EMPTY_LEAD, isEmail, leadStore, sendLead, track, useLead, type Lead } from '../lib/lead'

const SERVICES = ['Aerial mapping', 'Surveys & volumes', 'Roof & asset inspection', 'Progress tracking', '3D model', 'Robot patrol']
const SITE_TYPES = ['Construction', 'Energy & utilities', 'Mining & quarry', 'Infrastructure', 'Oil & gas', 'Agriculture', 'Telecom', 'Facilities', 'Other']
const SIZES = ['Under 5 ha', '5 to 50 ha', '50 to 200 ha', 'Over 200 ha', 'Not sure']
const FREQ = ['One-off', 'Monthly', 'Weekly', 'Not sure yet']
const WHEN = ['As soon as possible', 'Within a month', '1 to 3 months', 'Just looking']

const STEPS = ['The job', 'The site', 'Your details']

type Errors = Partial<Record<keyof Lead, string>>

function validate(step: number, l: Lead): Errors {
  const e: Errors = {}
  if (step === 0) {
    if (!l.services.length) e.services = 'Pick at least one'
    if (!l.siteType) e.siteType = 'Choose the type of site'
  }
  if (step === 1) {
    if (!l.location.trim()) e.location = 'Where is the site?'
    if (!l.timeline) e.timeline = 'When do you need it?'
  }
  if (step === 2) {
    if (l.name.trim().length < 2) e.name = 'Your name, please'
    if (!isEmail(l.email)) e.email = 'A valid email so we can reply'
    if (l.phone && !/^[+()\d\s-]{7,}$/.test(l.phone)) e.phone = 'That number looks off'
    if (!l.consent) e.consent = 'Tick to let us contact you'
  }
  return e
}

/** Three short steps instead of one long form. Both copies on the page share the same answers. */
export function LeadForm({ variant = 'hero' }: { variant?: 'hero' | 'section' }) {
  const { lead, step, status } = useLead()
  const [errors, setErrors] = useState<Errors>({})
  const started = useRef(false)
  const uid = useId()
  const f = (name: string) => `${uid}-${name}`

  const set = (patch: Partial<Lead>) => {
    if (!started.current) {
      started.current = true
      track('lead_form_start', { form: variant })
    }
    leadStore.update(patch)
    setErrors((e) => {
      const next = { ...e }
      Object.keys(patch).forEach((k) => delete next[k as keyof Lead])
      return next
    })
  }

  const next = async () => {
    const e = validate(step, lead)
    setErrors(e)
    if (Object.keys(e).length) return
    if (step < 2) {
      leadStore.set({ step: step + 1 })
      track('lead_form_step', { step: step + 2, form: variant })
      return
    }
    leadStore.set({ status: 'sending' })
    try {
      const how = await sendLead(lead)
      leadStore.set({ status: how })
    } catch {
      leadStore.set({ status: 'error' })
    }
  }

  if (status === 'sent' || status === 'mailto') {
    const first = lead.name.trim().split(' ')[0]
    return (
      <div className={`lead lead--${variant} lead--done`} role="status">
        <div className="lead__tick" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="28" height="28">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </div>
        <h3>{status === 'sent' ? `Thanks${first ? `, ${first}` : ''}. Your site details are in.` : 'Almost done: hit send in your email app.'}</h3>
        <p>
          {status === 'sent'
            ? 'We’ll look at the site and reply with a suggested route for the drone, the robot, or both.'
            : 'We opened an email with your answers filled in. Send it and we’ll reply with a suggested route.'}
        </p>
        <button
          type="button"
          className="lead__link"
          onClick={() => {
            leadStore.set({ lead: EMPTY_LEAD, step: 0, status: 'idle' })
            started.current = false
          }}
        >
          Send details for another site
        </button>
      </div>
    )
  }

  return (
    <form
      className={`lead lead--${variant}`}
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        next()
      }}
      aria-labelledby={f('title')}
    >
      <div className="lead__top">
        <p id={f('title')} className="lead__title">
          {variant === 'hero' ? 'Get a mission plan for your site' : 'Tell us about the site'}
        </p>
        <p className="lead__steps mono" aria-live="polite">
          Step {step + 1} of 3 · {STEPS[step]}
        </p>
        <span className="lead__bar" aria-hidden="true">
          <span style={{ transform: `scaleX(${(step + 1) / 3})` }} />
        </span>
      </div>

      {step === 0 && (
        <div className="lead__body" key="s0">
          <fieldset className="lead__field">
            <legend>What do you need?</legend>
            <div className="lead__chips">
              {SERVICES.map((s) => {
                const on = lead.services.includes(s)
                return (
                  <label key={s} className={`lead__chip ${on ? 'is-on' : ''}`}>
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => set({ services: on ? lead.services.filter((x) => x !== s) : [...lead.services, s] })}
                    />
                    {s}
                  </label>
                )
              })}
            </div>
            {errors.services && <p className="lead__err">{errors.services}</p>}
          </fieldset>
          <label className="lead__field">
            <span>Type of site</span>
            <select value={lead.siteType} onChange={(e) => set({ siteType: e.target.value })} aria-invalid={!!errors.siteType}>
              <option value="">Choose one</option>
              {SITE_TYPES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            {errors.siteType && <p className="lead__err">{errors.siteType}</p>}
          </label>
        </div>
      )}

      {step === 1 && (
        <div className="lead__body" key="s1">
          <label className="lead__field">
            <span>Site location</span>
            <input
              type="text"
              autoComplete="address-level2"
              placeholder="City or region"
              value={lead.location}
              onChange={(e) => set({ location: e.target.value })}
              aria-invalid={!!errors.location}
            />
            {errors.location && <p className="lead__err">{errors.location}</p>}
          </label>
          <div className="lead__row">
            <label className="lead__field">
              <span>Roughly how big?</span>
              <select value={lead.siteSize} onChange={(e) => set({ siteSize: e.target.value })}>
                <option value="">Choose</option>
                {SIZES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="lead__field">
              <span>How often?</span>
              <select value={lead.frequency} onChange={(e) => set({ frequency: e.target.value })}>
                <option value="">Choose</option>
                {FREQ.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
          <fieldset className="lead__field">
            <legend>When do you need it?</legend>
            <div className="lead__chips">
              {WHEN.map((s) => (
                <label key={s} className={`lead__chip ${lead.timeline === s ? 'is-on' : ''}`}>
                  <input type="radio" name={f('when')} checked={lead.timeline === s} onChange={() => set({ timeline: s })} />
                  {s}
                </label>
              ))}
            </div>
            {errors.timeline && <p className="lead__err">{errors.timeline}</p>}
          </fieldset>
        </div>
      )}

      {step === 2 && (
        <div className="lead__body" key="s2">
          <div className="lead__row">
            <label className="lead__field">
              <span>Full name</span>
              <input type="text" autoComplete="name" value={lead.name} onChange={(e) => set({ name: e.target.value })} aria-invalid={!!errors.name} />
              {errors.name && <p className="lead__err">{errors.name}</p>}
            </label>
            <label className="lead__field">
              <span>Company</span>
              <input type="text" autoComplete="organization" value={lead.company} onChange={(e) => set({ company: e.target.value })} />
            </label>
          </div>
          <div className="lead__row">
            <label className="lead__field">
              <span>Work email</span>
              <input type="email" autoComplete="email" inputMode="email" value={lead.email} onChange={(e) => set({ email: e.target.value })} aria-invalid={!!errors.email} />
              {errors.email && <p className="lead__err">{errors.email}</p>}
            </label>
            <label className="lead__field">
              <span>
                Phone <em>(optional)</em>
              </span>
              <input type="tel" autoComplete="tel" inputMode="tel" value={lead.phone} onChange={(e) => set({ phone: e.target.value })} aria-invalid={!!errors.phone} />
              {errors.phone && <p className="lead__err">{errors.phone}</p>}
            </label>
          </div>
          <label className="lead__field">
            <span>
              Anything else? <em>(optional)</em>
            </span>
            <textarea rows={2} value={lead.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Access, deadlines, what you want to find out" />
          </label>
          <label className="lead__consent">
            <input type="checkbox" checked={lead.consent} onChange={(e) => set({ consent: e.target.checked })} aria-invalid={!!errors.consent} />
            <span>Northstar can contact me about this site. We only use your details to reply.</span>
          </label>
          {errors.consent && <p className="lead__err">{errors.consent}</p>}
        </div>
      )}

      {status === 'error' && <p className="lead__err lead__err--block">Something went wrong sending that. Please try again.</p>}

      <div className="lead__actions">
        {step > 0 && (
          <button type="button" className="btn btn--ghost lead__back" onClick={() => leadStore.set({ step: step - 1 })}>
            Back
          </button>
        )}
        <button type="submit" className="btn btn--primary lead__next" disabled={status === 'sending'}>
          {step < 2 ? 'Next' : status === 'sending' ? 'Sending…' : 'Send my site details'}
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </form>
  )
}
