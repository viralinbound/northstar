// All copy lives here so it can be reviewed in one place.
// Capabilities are presented as proposed until confirmed as Northstar services.

export const CONTACT_EMAIL = 'hello@northstar.example' // TODO: replace with the real Northstar inbox

export const HERO = {
  eyebrow: 'Drones + ground robots for site inspection',
  title: ['Fly the site.', 'Walk the plant.', 'Know what changed.'],
  body: 'Northstar runs survey drones and a four-legged inspection robot on one mission plan, then turns what they capture into maps, 3D models and a short list of things to fix.',
}

export const AERIAL_CAPS = [
  {
    id: 'mapping',
    chapter: 'survey',
    title: 'Aerial mapping',
    body: 'Hundreds of overlapping photos stitched into one sharp, measurable map of the site.',
  },
  {
    id: 'surveying',
    chapter: 'survey',
    title: 'Surveying',
    body: 'Ground levels, contours and stockpile volumes, flown the same way every time.',
  },
  {
    id: 'inspection',
    chapter: 'inspect',
    title: 'Inspections',
    body: 'Roofs, towers and façades checked up close, in daylight and thermal, with nobody on a ladder.',
  },
  {
    id: 'progress',
    chapter: 'inspect',
    title: 'Progress monitoring',
    body: 'Fly the same route every week and compare it side by side against the programme.',
  },
  {
    id: 'reconstruction',
    chapter: 'reconstruct',
    title: '3D reconstruction',
    body: 'Point clouds and meshes of the whole site that you can measure and cut through.',
  },
  {
    id: 'insights',
    chapter: 'reconstruct',
    title: 'AI-assisted insights',
    body: 'Cracks, rust, missing panels and changed ground get flagged first, so reviewers start there.',
  },
] as const

export const CHAPTER_COPY: Record<string, { eyebrow: string; title: string; body?: string }> = {
  takeoff: {
    eyebrow: '01 / Lift-off',
    title: 'Checks first. Then up.',
    body: 'Battery, GPS lock, wind and airspace are checked before the props spin. The pilot signs off with one tap.',
  },
  transit: {
    eyebrow: '02 / Transit',
    title: 'It flies the route you drew.',
    body: 'Height follows the ground, the camera fires on schedule, and it heads home with battery to spare.',
  },
  survey: { eyebrow: '03 / Survey', title: 'One pass. One map.' },
  inspect: { eyebrow: '04 / Inspect', title: 'Get close without climbing.' },
  reconstruct: { eyebrow: '05 / Reconstruct', title: 'A model you can measure.' },
  handoff: {
    eyebrow: '06 / Handoff',
    title: 'Then the robot takes it inside.',
    body: 'Under roofs, between pipes and down stairwells, the ground unit carries the same sensors on foot.',
  },
}

export const ROBOT_CONFIG = [
  ['Body', 'Four legs. Handles stairs, grating and loose ground.'],
  ['Senses', 'Spinning LiDAR, depth cameras, optional thermal head.'],
  ['Moves', 'Walks a saved patrol route, then goes back to its dock.'],
  ['Carries', 'A sensor rail for gauge cameras, microphones or gas sniffers.'],
  ['Shares', 'Same mission plans and same data as the drones.'],
] as const

export const ROBOT_SCENARIOS = [
  {
    id: 'substation',
    label: 'Substations',
    title: 'The same round, every shift',
    body: 'It walks the yard, reads the dials, takes a thermal shot of every joint and only calls someone when a number moves.',
  },
  {
    id: 'plant',
    label: 'Plants & refineries',
    title: 'Where the drone can’t fit',
    body: 'Under pipe racks, between skids, inside the compressor hall. Same sensors, carried on foot.',
  },
  {
    id: 'construction',
    label: 'Construction',
    title: 'Inside progress, floor by floor',
    body: 'The drone maps the shell from above. The robot scans each floor so the interior lines up with the model too.',
  },
  {
    id: 'tunnels',
    label: 'Tunnels & utilities',
    title: 'No GPS, no problem',
    body: 'It maps as it walks, so it can patrol tunnels and service corridors and report leaks, cracks and blockages.',
  },
] as const

export const DRONE_PARTS = [
  { id: 'gimbal', label: 'Camera gimbal', body: 'A stabilised camera that stays level in wind, so every photo lines up with the next.' },
  { id: 'arms', label: 'Arms & motors', body: 'Four motors on folding arms. Fold it up and it fits in a site truck.' },
  { id: 'props', label: 'Propellers', body: 'Quick-release blades you swap by hand. No tools, no fuss.' },
  { id: 'brain', label: 'Flight computer', body: 'Runs the mission, watches the battery and decides when it’s time to come home.' },
  { id: 'battery', label: 'Battery', body: 'Slides out the back. Swap it at the pad and keep flying.' },
  { id: 'legs', label: 'Landing gear', body: 'Tall enough to keep the camera clear of gravel, mud and grass.' },
] as const

export const PLATFORM_STEPS = [
  { k: 'Plan', body: 'Draw the boundary once. Drone and robot routes come out of the same plan.' },
  { k: 'Capture', body: 'Photos, LiDAR and thermal from the air and the ground, all tagged to the same site grid.' },
  { k: 'Check', body: 'Models flag what looks wrong. Every flag links back to the photo it came from.' },
  { k: 'Fix', body: 'Findings go into a report or a work order, and next week’s route checks they were fixed.' },
] as const

export const INDUSTRIES = [
  { name: 'Construction', note: 'Weekly progress, volumes and as-built checks.' },
  { name: 'Energy & utilities', note: 'Lines, towers, substations and solar farms.' },
  { name: 'Mining & quarries', note: 'Stockpiles, pit walls and haul roads.' },
  { name: 'Infrastructure', note: 'Bridges, embankments and road corridors.' },
  { name: 'Oil & gas', note: 'Tanks, flare stacks and pipe racks.' },
  { name: 'Agriculture', note: 'Field maps, drainage and crop health.' },
  { name: 'Telecom', note: 'Mast audits and antenna line-of-sight.' },
  { name: 'Facilities', note: 'Roofs, façades and plant rooms.' },
] as const

export const MARQUEE = [
  'Aerial mapping',
  'Stockpile volumes',
  'Roof inspection',
  'Thermal surveys',
  'Progress tracking',
  'Point clouds',
  'Gauge reading',
  'Confined spaces',
]

export const MISSIONS = [
  {
    id: 'roof',
    who: 'Drone',
    kit: 'Thermal camera',
    title: 'The roof nobody wants to climb',
    body: 'One slow pass in thermal shows where water is sitting under the membrane. Nobody needs a harness.',
  },
  {
    id: 'stockpile',
    who: 'Drone',
    kit: 'Mapping camera',
    title: 'Monday stockpile count',
    body: 'Fly the yard before the trucks roll in. Same route every week, so this week’s volume compares with last week’s.',
  },
  {
    id: 'substation',
    who: 'Robot',
    kit: 'Thermal + gauge camera',
    title: 'Night round at the substation',
    body: 'The robot walks the yard while the site is quiet and flags the one joint that ran hotter than last night.',
  },
  {
    id: 'tunnel',
    who: 'Robot',
    kit: 'LiDAR',
    title: 'Tunnel walk, no GPS',
    body: 'It builds the map as it goes, so it can patrol a service tunnel and come back with every crack located.',
  },
  {
    id: 'mast',
    who: 'Drone',
    kit: 'Zoom camera',
    title: 'Every bolt on the mast',
    body: 'An orbit at a safe distance, a close-up of every fixing, and nobody leaves the ground.',
  },
] as const

/**
 * Real photographs (Unsplash Licence: free for commercial use, credit appreciated).
 * Files live in /public/photos as `<name>.webp` plus a 760px `<name>-sm.webp`.
 */
export const PHOTOS = {
  'hero-dark': { by: 'insung yoon', page: 'https://unsplash.com/photos/a-drone-flies-against-a-sunsets-backdrop-BBoyDY4vzOs', alt: 'A small drone silhouetted against a sunset over water' },
  'site-crane': { by: 'Centar MURID', page: 'https://unsplash.com/photos/an-aerial-view-of-a-building-under-construction-TBzjhks3G48', alt: 'Aerial view of a building site with a tower crane' },
  'site-top': { by: 'Centar MURID', page: 'https://unsplash.com/photos/an-aerial-view-of-a-construction-site-oLaSjZgtHks', alt: 'Top-down aerial view of a construction site' },
  'substation-dusk': { by: 'American Public Power Association', page: 'https://unsplash.com/photos/gray-metal-power-station-u719UbWj0us', alt: 'Electrical substation silhouetted at dusk' },
  'substation-day': { by: 'American Public Power Association', page: 'https://unsplash.com/photos/electrical-transformer-in-power-substation-VuR4oHZ3ucc', alt: 'Transformer in an electrical substation' },
  roof: { by: 'Alex Reynolds', page: 'https://unsplash.com/photos/aerial-view-of-a-modern-office-building-complex-rHvi-_-0jUU', alt: 'Aerial view of large warehouse roofs' },
  stockpile: { by: 'Colin Miller', page: 'https://unsplash.com/photos/map-zVTXvkZyxCY', alt: 'Aerial view of an aggregate yard with stockpiles' },
  mast: { by: 'Tony Stoddard', page: 'https://unsplash.com/photos/gray-metal-tower-with-accessories-DgZxBnZeQo8', alt: 'Telecom mast with antenna dishes' },
  tunnel: { by: 'Bradley Andrews', page: 'https://unsplash.com/photos/a-long-unfinished-concrete-tunnel-with-pipes-and-wires-rNXxhKcFWGo', alt: 'Long service tunnel lined with pipes' },
  'tunnel-works': { by: 'Ricardo Gomez Angel', page: 'https://unsplash.com/photos/construction-truck-inside-dark-tunnel-F2iCP_knaj8', alt: 'Truck inside a tunnel under construction' },
  plant: { by: 'iSawRed', page: 'https://unsplash.com/photos/a-close-up-of-a-machine-pCZsRKT-_Ns', alt: 'Pipework inside a plant engine room' },
  engineers: { by: 'alan boyce', page: 'https://unsplash.com/photos/two-construction-workers-review-plans-on-a-tablet-gyrKtgqMChY', alt: 'Two site workers reviewing plans on a tablet' },
} as const

export type PhotoName = keyof typeof PHOTOS

export const MISSION_PHOTO: Record<string, PhotoName> = {
  roof: 'roof',
  stockpile: 'stockpile',
  substation: 'substation-dusk',
  tunnel: 'tunnel',
  mast: 'mast',
}

export const SCENARIO_PHOTO: Record<string, PhotoName> = {
  substation: 'substation-day',
  plant: 'plant',
  construction: 'engineers',
  tunnels: 'tunnel-works',
}

export const INDUSTRY_PHOTO: Record<string, PhotoName> = {
  Construction: 'site-crane',
  'Energy & utilities': 'substation-day',
  'Mining & quarries': 'stockpile',
  Infrastructure: 'tunnel-works',
  'Oil & gas': 'plant',
  Telecom: 'mast',
  Facilities: 'roof',
}
