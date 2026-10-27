import { useSyncExternalStore } from 'react'
import { CONTACT_EMAIL } from '../sections/content'

/** Everything the lead form collects. Shared by the hero form and the bottom form. */
export type Lead = {
  services: string[]
  siteType: string
  location: string
  siteSize: string
  frequency: string
  timeline: string
  name: string
  email: string
  phone: string
  company: string
  notes: string
  consent: boolean
}

export const EMPTY_LEAD: Lead = {
  services: [],
  siteType: '',
  location: '',
  siteSize: '',
  frequency: '',
  timeline: '',
  name: '',
  email: '',
  phone: '',
  company: '',
  notes: '',
  consent: false,
}

type State = { lead: Lead; step: number; status: 'idle' | 'sending' | 'sent' | 'mailto' | 'error' }

let state: State = { lead: EMPTY_LEAD, step: 0, status: 'idle' }
const listeners = new Set<() => void>()

export const leadStore = {
  get: () => state,
  set(patch: Partial<State>) {
    state = { ...state, ...patch }
    listeners.forEach((l) => l())
  },
  update(patch: Partial<Lead>) {
    leadStore.set({ lead: { ...state.lead, ...patch } })
  },
  subscribe(cb: () => void) {
    listeners.add(cb)
    return () => listeners.delete(cb)
  },
}

export const useLead = () => useSyncExternalStore(leadStore.subscribe, leadStore.get, leadStore.get)

// ── ad attribution ──────────────────────────────────────────────
const ATTR_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'msclkid', 'li_fat_id']
const ATTR_STORE = 'ns-attribution'

/** Keep the ad parameters from the landing URL for the whole visit (they vanish on in-page navigation). */
export function captureAttribution() {
  try {
    const params = new URLSearchParams(window.location.search)
    const found: Record<string, string> = {}
    ATTR_KEYS.forEach((k) => {
      const v = params.get(k)
      if (v) found[k] = v
    })
    if (Object.keys(found).length) {
      found.landing_page = window.location.href
      found.referrer = document.referrer
      sessionStorage.setItem(ATTR_STORE, JSON.stringify(found))
    }
  } catch {
    /* storage blocked: attribution simply isn't attached */
  }
}

function attribution(): Record<string, string> {
  try {
    return JSON.parse(sessionStorage.getItem(ATTR_STORE) || '{}')
  } catch {
    return {}
  }
}

type Win = Window & {
  dataLayer?: unknown[]
  gtag?: (...args: unknown[]) => void
  fbq?: (...args: unknown[]) => void
}

/** Fire conversion events for whichever ad tags the page has (GTM, Google Ads/GA4, Meta). */
export function track(event: 'lead_form_start' | 'lead_form_step' | 'generate_lead', data: Record<string, unknown> = {}) {
  const w = window as Win
  w.dataLayer?.push({ event, ...data })
  w.gtag?.('event', event, data)
  if (event === 'generate_lead') w.fbq?.('track', 'Lead')
}

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())

/**
 * Send the lead. With VITE_LEAD_ENDPOINT set (Formspree, a Google Apps Script, a CRM webhook…)
 * it POSTs JSON. Without one, it opens the visitor's email app pre-filled so no lead is lost.
 */
export async function sendLead(lead: Lead): Promise<'sent' | 'mailto'> {
  const payload = {
    ...lead,
    services: lead.services.join(', '),
    submitted_at: new Date().toISOString(),
    page: window.location.origin + window.location.pathname,
    ...attribution(),
  }
  track('generate_lead', { services: payload.services, site_type: lead.siteType })

  const endpoint = import.meta.env.VITE_LEAD_ENDPOINT
  if (endpoint) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(`Lead endpoint returned ${res.status}`)
    return 'sent'
  }

  const body = Object.entries(payload)
    .filter(([, v]) => v !== '' && v !== false)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')
  window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Site enquiry: ${lead.company || lead.name}`)}&body=${encodeURIComponent(body)}`
  return 'mailto'
}
