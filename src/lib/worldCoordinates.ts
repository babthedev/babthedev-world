// ============================================================
// WORLD COORDINATES — Flat XZ neighborhood layout
// Y is always 0 (ground). Characters spawn at Y = 1.
// Layout mirrors a real neighborhood: roads branch from hub.
//
//              [ESSAYS]
//                 |
//   [BIO] ---- [HUB] ---- [PROJECTS]
//                 |
//            [ORYZON *]
//
// ============================================================

export type DistrictName = '/' | '/bio' | '/projects' | '/essays' | '/404'

export interface DistrictCoord {
  path: DistrictName
  label: string
  // Where characters spawn when deep-linking directly to this route
  spawnPoint: [number, number, number]
  // Center of the invisible sensor box on the ground
  sensorPoint: [number, number, number]
  // Abdulrahman's dialogue when entering this district
  entryDialogue: string
  // Short fallback if already visited
  revisitDialogue: string
}

export const WORLD_COORDINATES: Record<DistrictName, DistrictCoord> = {
  '/': {
    path: '/',
    label: 'The Hub',
    spawnPoint: [0, 1, 0],
    sensorPoint: [0, 0, 0],
    entryDialogue: 'Welcome. This is where everything starts.',
    revisitDialogue: 'Back at the hub.',
  },
  '/bio': {
    path: '/bio',
    label: 'Welcome Terrace',
    spawnPoint: [-40, 1, 0],
    sensorPoint: [-40, 0, 0],
    entryDialogue: 'This is the terrace. Pull up a chair.',
    revisitDialogue: 'The terrace again.',
  },
  '/projects': {
    path: '/projects',
    label: 'Projects Exhibition',
    spawnPoint: [40, 1, 0],
    sensorPoint: [40, 0, 0],
    entryDialogue: 'The exhibition space. Each pedestal is a case study.',
    revisitDialogue: 'Back to the exhibition.',
  },
  '/essays': {
    path: '/essays',
    label: 'The Library',
    spawnPoint: [0, 1, -40],
    sensorPoint: [0, 0, -40],
    entryDialogue: 'The library. Quieter here.',
    revisitDialogue: 'The library. Still quiet.',
  },
  '/404': {
    path: '/404',
    label: 'Dead End',
    spawnPoint: [0, 1, 100],
    sensorPoint: [0, 0, 100],
    entryDialogue: "This isn't on the map.",
    revisitDialogue: 'Still not on the map.',
  },
}

// ─── STATIC PROP LOCATIONS ────────────────────────────────
// Used by InteractiveProps.tsx and Environment.tsx

export interface PropLocation {
  id: string
  position: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
  model: string           // filename in /public/kenney/
  interactive: boolean
  panelId?: string        // links to ReadingPanel content
  district: DistrictName
}

export const PROP_LOCATIONS: PropLocation[] = [
  // ── HUB ──────────────────────────────────────────────
  {
    id: 'hub-sign-north',
    position: [0, 0, -8],
    rotation: [0, 0, 0],
    model: 'sign-highway.glb',
    interactive: false,
    district: '/',
  },
  {
    id: 'hub-sign-west',
    position: [-8, 0, 0],
    rotation: [0, Math.PI / 2, 0],
    model: 'sign-highway.glb',
    interactive: false,
    district: '/',
  },
  {
    id: 'hub-sign-east',
    position: [8, 0, 0],
    rotation: [0, -Math.PI / 2, 0],
    model: 'sign-highway.glb',
    interactive: false,
    district: '/',
  },

  // ── BIO / CAFE TERRACE ────────────────────────────────
  {
    id: 'cafe-table-main',
    position: [-38, 0, -4],
    model: 'construction-barrier.glb',
    interactive: true,
    panelId: 'bio',
    district: '/bio',
  },
  {
    id: 'cafe-bench-joe',
    position: [-42, 0, 3],
    rotation: [0, Math.PI / 4, 0],
    model: 'construction-barrier.glb',
    interactive: false,
    district: '/bio',
  },
  {
    id: 'cafe-vending',
    position: [-36, 0, 6],
    model: 'construction-light.glb',
    interactive: false,
    district: '/bio',
  },

  // ── PROJECTS EXHIBITION ───────────────────────────────
  {
    id: 'project-pedestal-01',
    position: [36, 0, -4],
    model: 'construction-cone.glb',
    interactive: true,
    panelId: 'oryzon',
    district: '/projects',
  },
  {
    id: 'project-pedestal-02',
    position: [40, 0, -8],
    model: 'construction-cone.glb',
    interactive: true,
    panelId: 'roadwarden',
    district: '/projects',
  },
  {
    id: 'project-archive-terminal',
    position: [46, 0, 0],
    model: 'light-square.glb',
    interactive: true,
    panelId: 'archive',
    district: '/projects',
  },

  // ── ESSAYS / LIBRARY ──────────────────────────────────
  {
    id: 'essay-table-01',
    position: [-4, 0, -42],
    model: 'construction-barrier.glb',
    interactive: true,
    panelId: 'brutalist-web',
    district: '/essays',
  },
  {
    id: 'essay-table-02',
    position: [4, 0, -42],
    model: 'construction-barrier.glb',
    interactive: true,
    panelId: 'essay-02',
    district: '/essays',
  },
  {
    id: '404-flicker-lamp',
    position: [0, 0, 99],
    model: 'light-curved.glb',
    interactive: false,
    district: '/404',
  },
]

// ─── NPC LOCATIONS ────────────────────────────────────────

export interface NPCLocation {
  id: string
  name: string
  position: [number, number, number]
  rotation?: [number, number, number]
  seated: boolean
  district: DistrictName
  dialogueKey: string
  ambient?: boolean
  modelUrl?: string
}

export const NPC_LOCATIONS: NPCLocation[] = [
  {
    id: 'joe',
    name: 'Joe',
    position: [-42, 0, 3],
    rotation: [0, Math.PI / 3, 0],
    seated: true,
    district: '/bio',
    dialogueKey: 'joe',
    modelUrl: '/joe.vrm',
  },
  {
    id: 'library-sleeper',
    name: '',
    position: [4, 0, -44],
    rotation: [0, Math.PI, 0],
    seated: true,
    district: '/essays',
    dialogueKey: 'library-sleeper',
    modelUrl: '/joe.vrm',
  },
  {
    id: 'cafe-newspaper-reader',
    name: '',
    position: [-40, 0, -6],
    rotation: [0, -Math.PI / 4, 0],
    ambient: true,
    seated: true,
    district: '/bio',
    dialogueKey: '', // ambient — no dialogueKey means no interaction
    modelUrl: '/joe.vrm',
  },
]

// ─── ROAD SEGMENTS ────────────────────────────────────────
// Kenney road tiles placed at specific XZ positions.
// All roads are on Y = 0. Tile size = 8 units.

export interface RoadTile {
  model: string
  position: [number, number, number]
  rotation?: [number, number, number]
}

const TILE = 8 // Kenney road tile size

export const ROAD_TILES: RoadTile[] = [
  // Hub centre
  { model: 'road-crossing.glb', position: [0, 0, 0] },

  // ── WEST ARM → BIO (gentle S-curve, not a straight line) ──
  { model: 'road-straight.glb', position: [-TILE, 0, 0], rotation: [0, Math.PI / 2, 0] },
  { model: 'road-curve.glb',    position: [-TILE * 2, 0, 0], rotation: [0, Math.PI, 0] },
  { model: 'road-straight.glb', position: [-TILE * 2, 0, -TILE], rotation: [0, 0, 0] },
  { model: 'road-curve.glb',    position: [-TILE * 2, 0, -TILE * 2], rotation: [0, -Math.PI / 2, 0] },
  { model: 'road-straight.glb', position: [-TILE * 3, 0, -TILE * 2], rotation: [0, Math.PI / 2, 0] },
  { model: 'road-curve.glb',    position: [-TILE * 4, 0, -TILE * 2], rotation: [0, 0, 0] },
  { model: 'road-straight.glb', position: [-TILE * 4, 0, -TILE], rotation: [0, 0, 0] },
  { model: 'road-end.glb',      position: [-TILE * 4, 0, 0], rotation: [0, Math.PI / 2, 0] },

   // ── EAST ARM → PROJECTS (mirrored gentle curve) ──────────
   { model: 'road-straight.glb', position: [TILE, 0, 0], rotation: [0, Math.PI / 2, 0] },
   { model: 'road-curve.glb',    position: [TILE * 2, 0, 0], rotation: [0, -Math.PI / 2, 0] },
   { model: 'road-straight.glb', position: [TILE * 2, 0, TILE], rotation: [0, 0, 0] },
   { model: 'road-curve.glb',    position: [TILE * 2, 0, TILE * 2], rotation: [0, Math.PI, 0] },
   { model: 'road-straight.glb', position: [TILE * 3, 0, TILE * 2], rotation: [0, Math.PI / 2, 0] },
   { model: 'road-curve.glb',    position: [TILE * 4, 0, TILE * 2], rotation: [0, -Math.PI / 2, 0] },
   { model: 'road-straight.glb', position: [TILE * 4, 0, TILE], rotation: [0, 0, 0] },
   { model: 'road-end.glb',      position: [TILE * 4, 0, 0], rotation: [0, -Math.PI / 2, 0] },
 

   // ── NORTH ARM → ESSAYS (narrowing, slight weave per spec) ──
   { model: 'road-straight.glb', position: [0, 0, -TILE] },
   { model: 'road-curve.glb',    position: [0, 0, -TILE * 2], rotation: [0, Math.PI / 2, 0] },
   { model: 'road-straight.glb', position: [TILE, 0, -TILE * 2], rotation: [0, Math.PI / 2, 0] },
   { model: 'road-curve.glb',    position: [TILE * 2, 0, -TILE * 2], rotation: [0, -Math.PI, 0] },
   { model: 'road-straight.glb', position: [TILE * 2, 0, -TILE * 3] },
   { model: 'road-curve.glb',    position: [TILE * 2, 0, -TILE * 4], rotation: [0, -Math.PI / 2, 0] },
   { model: 'road-straight.glb', position: [TILE, 0, -TILE * 4], rotation: [0, Math.PI / 2, 0] },
   { model: 'road-end.glb',      position: [0, 0, -TILE * 4] },
 
  // ── SOUTH ARM → ORYZON (short, straight — deliberately
  //    blunt/industrial feel vs the organic residential curves) ──
  { model: 'road-straight.glb', position: [0, 0, TILE] },
  { model: 'road-straight.glb', position: [0, 0, TILE * 2] },
  { model: 'road-end.glb',      position: [0, 0, TILE * 3] },
]

// ─── BUILDING PLACEMENT ───────────────────────────────────

export interface BuildingPlacement {
  model: string
  position: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
}

export const BUILDINGS: BuildingPlacement[] = [
  // Hub surrounds
  { model: 'building-i.glb', position: [12, 0, -12],
    rotation: [0, Math.PI / 2, 0] },
  { model: 'building-i.glb', position: [-12, 0, -12],
    rotation: [0, 0, 0] },
  { model: 'building-a.glb',      position: [12, 0, 12] },
  { model: 'building-a.glb',      position: [-12, 0, 12],
    rotation: [0, Math.PI, 0] },

  // Bio / Cafe district
  { model: 'building-b.glb',       position: [-38, 0, -10] },
  { model: 'building-c.glb',      position: [-46, 0, -6],
    rotation: [0, Math.PI / 2, 0] },

  // Projects district
  { model: 'building-j.glb', position: [46, 0, -10] },
  { model: 'building-d.glb',      position: [50, 0, 6],
    rotation: [0, -Math.PI / 2, 0] },

  // Essays / Library district
  { model: 'building-k.glb', position: [-10, 0, -46],
    rotation: [0, Math.PI / 2, 0] },
  { model: 'building-k.glb', position: [10, 0, -46],
    rotation: [0, -Math.PI / 2, 0] },
]


// ─── ORYZON CONSTRUCTION ZONE ──────────────────────────────
// South arm of the hub, dead-ends at a barrier. Not enterable.

export const ORYZON_GATE_POSITION: [number, number, number] = [0, 0, 24]

export const ORYZON_PROPS: PropLocation[] = [
  {
    id: 'oryzon-fence',
    position: [0, 0, 22],
    model: 'construction-barrier.glb',
    interactive: false,
    district: '/',
  },
  {
    id: 'oryzon-billboard',
    position: [0, 0, 20],
    rotation: [0, Math.PI, 0],
    model: 'sign-highway.glb',
    interactive: false,
    district: '/',
  },
  {
    id: 'oryzon-bollard-1',
    position: [-2, 0, 21],
    model: 'construction-cone.glb',
    interactive: false,
    district: '/',
  },
  {
    id: 'oryzon-bollard-2',
    position: [2, 0, 21],
    model: 'construction-cone.glb',
    interactive: false,
    district: '/',
  },
  {
    id: 'oryzon-cone-1',
    position: [-1, 0, 19],
    model: 'construction-cone.glb',
    interactive: false,
    district: '/',
  },
  {
    id: 'oryzon-cone-2',
    position: [1.5, 0, 18],
    model: 'construction-cone.glb',
    interactive: false,
    district: '/',
  },
]

// ─── EXPANDED PROP DENSITY ──────────────────────────────────
// Additional props filling out the district prop library gap.
// Appended to your existing PROP_LOCATIONS array — merge these in.

export const ADDITIONAL_PROPS: PropLocation[] = [
  // Hub
  { id: 'hub-lamp-1', position: [6, 0, -3], model: 'light-curved.glb', interactive: false, district: '/' },
  { id: 'hub-lamp-2', position: [-6, 0, -3], model: 'light-curved.glb', interactive: false, district: '/' },
  { id: 'hub-lamp-3', position: [6, 0, 3], model: 'light-curved.glb', interactive: false, district: '/' },
  { id: 'hub-lamp-4', position: [-6, 0, 3], model: 'light-curved.glb', interactive: false, district: '/' },
  { id: 'hub-bin', position: [3, 0, 5], model: 'construction-barrier.glb', interactive: false, district: '/' },

  // Bio / Cafe
  { id: 'cafe-mailbox', position: [-44, 0, -2], model: 'construction-barrier.glb', interactive: false, district: '/bio' },
  { id: 'cafe-bicycle', position: [-40, 0, 8], model: 'construction-barrier.glb', interactive: false, district: '/bio' },
  { id: 'cafe-pole', position: [-34, 0, -8], model: 'light-curved.glb', interactive: false, district: '/bio' },
  { id: 'cafe-cone', position: [-42, 0, -6], model: 'construction-cone.glb', interactive: false, district: '/bio' },
  { id: 'cafe-bin', position: [-36, 0, -3], model: 'construction-barrier.glb', interactive: false, district: '/bio' },
  { id: 'cafe-lamp-1', position: [-44, 0, 4], model: 'light-curved.glb', interactive: false, district: '/bio' },

  // Projects
  { id: 'proj-pole-1', position: [42, 0, 10], model: 'light-curved.glb', interactive: false, district: '/projects' },
  { id: 'proj-pole-2', position: [50, 0, -10], model: 'light-curved.glb', interactive: false, district: '/projects' },
  { id: 'proj-lamp-1', position: [38, 0, -2], model: 'light-curved.glb', interactive: false, district: '/projects' },
  { id: 'proj-lamp-2', position: [44, 0, 8], model: 'light-curved.glb', interactive: false, district: '/projects' },
  { id: 'proj-bollard-1', position: [36, 0, 4], model: 'construction-cone.glb', interactive: false, district: '/projects' },

  // Essays
  { id: 'essay-lamp-1', position: [-6, 0, -40], model: 'light-curved.glb', interactive: false, district: '/essays' },
  { id: 'essay-lamp-2', position: [6, 0, -48], model: 'light-curved.glb', interactive: false, district: '/essays' },
  { id: 'essay-bin', position: [8, 0, -38], model: 'construction-barrier.glb', interactive: false, district: '/essays' },
]

// ─── 404 / DEAD END ZONE ─────────────────────────────────────
// Isolated pocket, only reachable via invalid deep link routing,
// not connected to the main road network.

export const DEAD_END_COORD: DistrictCoord = {
  path: '/404' as DistrictName,
  label: 'Dead End',
  spawnPoint: [0, 1, 100],
  sensorPoint: [0, 0, 100],
  entryDialogue: "This isn't on the map.",
  revisitDialogue: "Still not on the map.",
}

export const DEAD_END_PROPS: PropLocation[] = [
  { id: '404-fence-1', position: [-4, 0, 96], model: 'construction-barrier.glb', interactive: false, district: '/404' as DistrictName },
  { id: '404-fence-2', position: [4, 0, 96], model: 'construction-barrier.glb', interactive: false, district: '/404' as DistrictName },
  { id: '404-lamp', position: [0, 0, 98], model: 'light-curved.glb', interactive: false, district: '/404' as DistrictName },
]