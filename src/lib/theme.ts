import { useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark'

const KEY = 'ns-theme'
const META = { light: '#f5f4f0', dark: '#0a0f1a' }
const listeners = new Set<() => void>()

function stored(): Theme | null {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : null
  } catch {
    return null
  }
}

const read = (): Theme => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark')

/** Apply a theme. `persist` is false when following the OS setting rather than a user choice. */
export function setTheme(theme: Theme, persist = true) {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', META[theme])
  if (persist) {
    try {
      localStorage.setItem(KEY, theme)
    } catch {
      /* storage unavailable: the choice lasts for this page view */
    }
  }
  listeners.forEach((l) => l())
}

// Follow the OS setting until the visitor picks a theme themselves.
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
    if (!stored()) setTheme(e.matches ? 'light' : 'dark', false)
  })
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export const useTheme = () => useSyncExternalStore(subscribe, read, () => 'dark' as Theme)
