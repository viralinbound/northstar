import type { Theme } from '../lib/theme'

/** Per-theme colours for the flight scene: dusk for dark mode, clear daylight for light mode. */
export type ScenePalette = {
  fog: string
  exposure: number
  hemi: [string, string, number]
  sun: [string, number]
  fill: number
  sky: { zenith: string; mid: string; horizon: string; ground: string }
  stars: boolean
  terrain: { low: string; mid: string; high: string; sun: string; ambient: number }
  accent: string
  building: string
  frame: string
  slab: string
  pad: string
  facility: string
  station: string
  points: { color: string; additive: boolean }
  shadow: number
}

export const PALETTES: Record<Theme, ScenePalette> = {
  dark: {
    fog: '#0a1124',
    exposure: 1.25,
    hemi: ['#a9b4ff', '#22182e', 1.1],
    sun: ['#ffcf9a', 1.7],
    fill: 0.9,
    sky: { zenith: '#04061a', mid: '#141640', horizon: '#e0785f', ground: '#0a1124' },
    stars: true,
    terrain: { low: '#131b26', mid: '#212b36', high: '#4d4f54', sun: '#ffc78c', ambient: 0.35 },
    accent: '#3be3f6',
    building: '#1a2230',
    frame: '#8a7a5a',
    slab: '#141b26',
    pad: '#131a26',
    facility: '#1b222d',
    station: '#1d2430',
    points: { color: '#7af0ff', additive: true },
    shadow: 0.5,
  },
  light: {
    fog: '#d8e2ee',
    exposure: 1.0,
    hemi: ['#e6efff', '#8c8172', 1.35],
    sun: ['#fff4e2', 2.4],
    fill: 0.7,
    sky: { zenith: '#6f9fe6', mid: '#b3cdf2', horizon: '#ece2f6', ground: '#d8e2ee' },
    stars: false,
    terrain: { low: '#a8a89c', mid: '#bdb9ab', high: '#dcd6ca', sun: '#fff1dc', ambient: 0.55 },
    accent: '#0b7cff',
    building: '#c3c8cf',
    frame: '#7c5cff',
    slab: '#b9b8b2',
    pad: '#5d6573',
    facility: '#bdbcb6',
    station: '#3a4250',
    points: { color: '#0b7cff', additive: false },
    shadow: 0.22,
  },
}
