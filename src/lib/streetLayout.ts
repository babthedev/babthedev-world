// ============================================================
// STREET LAYOUT — deterministic, sphere-native town generator
//
// Builds the dense Messenger-style neighbourhood that wraps the
// planet: streets, curbs, road paint, building frontages, utility
// poles + overhead wires and sidewalk clutter.
//
// Network (flat azimuthal coordinates, see surfacePlacement.ts):
//   - 4 meridian streets from the Hub (north pole) to each district
//   - an equatorial ring road linking Projects → Essays → Bio
//   - a south alley from the ring down to the Dead End (south pole)
//
// Everything is computed once at module load from a seeded RNG so
// the town is identical on every visit.
// ============================================================

import { Matrix4, Quaternion, Vector3 } from 'three'
import { PLANET_RADIUS } from './constants'
import { flatToSphere } from './surfacePlacement'
import {
  WORLD_COORDINATES,
  PROP_LOCATIONS,
  ADDITIONAL_PROPS,
  ORYZON_PROPS,
  NPC_LOCATIONS,
  ORYZON_GATE_POSITION,
} from './worldCoordinates'

const R = PLANET_RADIUS

// --- STREET DIMENSIONS (metres) ---
export const ROAD_HALF_WIDTH = 3
export const SIDEWALK_WIDTH = 2.2
export const CURB_HEIGHT = 0.14
export const CURB_WIDTH = 0.28
const FRONTAGE = ROAD_HALF_WIDTH + SIDEWALK_WIDTH

// ── SEEDED RNG ──────────────────────────────────────────
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(20260924)
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)]

// ── SPHERE HELPERS ──────────────────────────────────────
export function flatToUnit(x: number, z: number): Vector3 {
  return new Vector3(...flatToSphere(x, z).position).normalize()
}

/** Great-circle distance in metres between two unit vectors. */
function arcDist(a: Vector3, b: Vector3): number {
  return Math.acos(Math.min(1, Math.max(-1, a.dot(b)))) * R
}

/** Unit vector reached by walking `offset` metres from p along tangent dir. */
function walk(p: Vector3, dir: Vector3, offset: number): Vector3 {
  const a = offset / R
  return p.clone().multiplyScalar(Math.cos(a)).addScaledVector(dir, Math.sin(a)).normalize()
}

/** World-space point at unit direction p, `h` metres above the surface. */
export function lift(p: Vector3, h: number): Vector3 {
  return p.clone().multiplyScalar(R + h)
}

/** Orientation: local +Y = surface normal, local +Z = `front` (tangent). */
function basisQuat(up: Vector3, front: Vector3): Quaternion {
  const z = front.clone().addScaledVector(up, -front.dot(up)).normalize()
  const x = new Vector3().crossVectors(up, z).normalize()
  return new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(x, up, z))
}

// ── STREETS ─────────────────────────────────────────────
export interface StreetSample {
  p: Vector3 // unit direction on sphere
  t: Vector3 // tangent (direction of travel)
  s: Vector3 // side vector (t × p) — points to the street's right
  arc: number // metres from street start
}

export interface Street {
  id: string
  samples: StreetSample[]
  length: number
  closed: boolean
  poleSide: 1 | -1
}

function buildStreet(
  id: string,
  flatPts: [number, number][],
  closed = false,
  poleSide: 1 | -1 = 1,
  step = 1
): Street {
  // 1. Densify the flat polyline and map to the sphere
  const dense: Vector3[] = []
  for (let i = 0; i < flatPts.length - 1; i++) {
    const [ax, az] = flatPts[i]
    const [bx, bz] = flatPts[i + 1]
    const n = Math.max(2, Math.ceil(Math.hypot(bx - ax, bz - az) / 0.2))
    for (let k = 0; k < n; k++) {
      const f = k / n
      dense.push(flatToUnit(ax + (bx - ax) * f, az + (bz - az) * f))
    }
  }
  const last = flatPts[flatPts.length - 1]
  dense.push(flatToUnit(last[0], last[1]))

  // 2. Resample at uniform arc length
  const pts: Vector3[] = [dense[0]]
  let acc = 0
  for (let i = 1; i < dense.length; i++) {
    acc += arcDist(dense[i - 1], dense[i])
    if (acc >= step) {
      pts.push(dense[i])
      acc = 0
    }
  }
  if (!closed && acc > step * 0.3) pts.push(dense[dense.length - 1])

  // 3. Tangent frames
  const samples: StreetSample[] = []
  let arc = 0
  for (let i = 0; i < pts.length; i++) {
    const prev = pts[closed ? (i - 1 + pts.length) % pts.length : Math.max(0, i - 1)]
    const next = pts[closed ? (i + 1) % pts.length : Math.min(pts.length - 1, i + 1)]
    const p = pts[i]
    const t = next.clone().sub(prev)
    t.addScaledVector(p, -t.dot(p)).normalize()
    const s = new Vector3().crossVectors(t, p).normalize()
    if (i > 0) arc += arcDist(pts[i - 1], p)
    samples.push({ p, t, s, arc })
  }
  return { id, samples, length: arc, closed, poleSide }
}

const RING_R = 40
const ringPts: [number, number][] = []
for (let i = 0; i <= 96; i++) {
  const a = (i / 96) * Math.PI * 2
  ringPts.push([Math.cos(a) * RING_R, Math.sin(a) * RING_R])
}

export const STREETS: Street[] = [
  buildStreet('east', [[0, 0], [RING_R, 0]], false, 1),
  buildStreet('north', [[0, 0], [0, -RING_R]], false, -1),
  buildStreet('west', [[0, 0], [-RING_R, 0]], false, 1),
  buildStreet('oryzon', [[0, 0], [0, ORYZON_GATE_POSITION[2] + 1]], false, -1),
  buildStreet('ring', ringPts, true, 1),
  buildStreet('alley', [[0, RING_R], [0, 76]], false, 1),
]

/** Metres from p to the nearest street centreline (optionally skipping one). */
export function distToStreets(p: Vector3, skip?: string): number {
  let best = Infinity
  for (const st of STREETS) {
    if (st.id === skip) continue
    for (const smp of st.samples) {
      const d = arcDist(p, smp.p)
      if (d < best) best = d
    }
  }
  return best
}

// ── PLAZAS (open squares at each district) ───────────────
export interface Plaza {
  center: Vector3
  radius: number
}

const flat = (c: [number, number, number]) => flatToUnit(c[0], c[2])

export const PLAZAS: Plaza[] = [
  { center: flat(WORLD_COORDINATES['/'].sensorPoint), radius: 10 },
  { center: flat(WORLD_COORDINATES['/projects'].sensorPoint), radius: 10 },
  { center: flat(WORLD_COORDINATES['/essays'].sensorPoint), radius: 10 },
  { center: flat(WORLD_COORDINATES['/bio'].sensorPoint), radius: 10 },
  { center: flat(WORLD_COORDINATES['/404'].sensorPoint), radius: 7 },
  { center: flat(ORYZON_GATE_POSITION), radius: 5 },
]

function inPlaza(p: Vector3, margin = 0): boolean {
  return PLAZAS.some((pl) => arcDist(p, pl.center) < pl.radius + margin)
}

// Content props, NPCs, gateways and easter eggs that must stay clear
const PROTECTED: { p: Vector3; r: number }[] = [
  ...[...PROP_LOCATIONS, ...ADDITIONAL_PROPS, ...ORYZON_PROPS, ...NPC_LOCATIONS].map((o) => ({
    p: flat(o.position),
    r: 1.8,
  })),
  ...([
    [0, -22], [-22, 0], [0, 60], // district gateways
    [-6, -50], [-43, -4], // easter eggs
    [-4, -42], [4, -42], [38, -6], [42, 6], [46, 0], // physical content props
    [-34, -8], [-42, -5], [-40, 6],
  ] as [number, number][]).map(([x, z]) => ({ p: flatToUnit(x, z), r: 2.2 })),
]

function nearProtected(p: Vector3, radius: number): boolean {
  return PROTECTED.some((o) => arcDist(p, o.p) < o.r + radius)
}

// ── BUILDINGS ───────────────────────────────────────────
// Footprints measured from the Kenney GLB bounding boxes (unit scale).
// [width (x), height (y), depth (z)]
const MODEL_SIZE: Record<string, [number, number, number]> = {
  'building-a.glb': [0.884, 1.293, 0.94],
  'building-b.glb': [0.97, 1.293, 0.94],
  'building-c.glb': [0.884, 0.893, 1.09],
  'building-d.glb': [0.84, 1.293, 0.9],
  'building-e.glb': [1.64, 0.893, 1.008],
  'building-f.glb': [0.84, 1.693, 1.03],
  'building-g.glb': [0.97, 1.693, 0.922],
  'building-h.glb': [0.884, 1.293, 1.008],
  'building-i.glb': [1.24, 1.68, 1.302],
  'building-j.glb': [2.084, 1.693, 1.34],
  'building-k.glb': [2.084, 1.47, 0.942],
  'building-l.glb': [1.37, 2.27, 1.402],
  'building-m.glb': [1.24, 3.15, 1.242],
  'building-n.glb': [2.32, 2.48, 1.82],
  'building-skyscraper-a.glb': [1.36, 2.88, 1.36],
  'building-skyscraper-c.glb': [1.28, 4.08, 1.388],
  'building-skyscraper-e.glb': [1.295, 4.08, 1.242],
  'low-detail-building-a.glb': [0.5, 2, 0.5],
  'low-detail-building-c.glb': [0.5, 2.25, 0.5],
  'low-detail-building-f.glb': [0.5, 2, 0.5],
  'low-detail-building-h.glb': [0.5, 2.1, 0.5],
  'low-detail-building-l.glb': [0.5, 1.85, 0.5],
  'low-detail-building-wide-a.glb': [1, 1.1, 0.5],
  'low-detail-building-wide-b.glb': [1, 1.15, 0.5],
}

const FRONTAGE_MODELS = [
  'building-a.glb', 'building-b.glb', 'building-c.glb', 'building-d.glb',
  'building-e.glb', 'building-f.glb', 'building-g.glb', 'building-h.glb',
  'building-i.glb', 'building-k.glb', 'building-l.glb',
  'building-a.glb', 'building-d.glb', 'building-g.glb', 'building-h.glb',
] as const
const TALL_MODELS = [
  'building-m.glb', 'building-n.glb', 'building-j.glb',
  'building-skyscraper-a.glb', 'building-skyscraper-c.glb', 'building-skyscraper-e.glb',
] as const
const BACKDROP_MODELS = [
  'low-detail-building-a.glb', 'low-detail-building-c.glb', 'low-detail-building-f.glb',
  'low-detail-building-h.glb', 'low-detail-building-l.glb',
  'low-detail-building-wide-a.glb', 'low-detail-building-wide-b.glb',
] as const

export const BUILDING_MODELS = Object.keys(MODEL_SIZE)

export interface BuildingInstance {
  model: string
  p: Vector3 // unit direction of footprint centre
  front: Vector3 // tangent the facade faces
  side: Vector3 // tangent along the facade
  quaternion: Quaternion
  scale: number
  size: [number, number, number] // scaled w, h, d
  position: Vector3 // world-space base position
}

export const BUILDINGS: BuildingInstance[] = []

/** 2D oriented-rectangle overlap test in the tangent plane at a.p */
function footprintsOverlap(
  a: { p: Vector3; front: Vector3; side: Vector3; size: [number, number, number] },
  b: { p: Vector3; front: Vector3; side: Vector3; size: [number, number, number] },
  pad: number
): boolean {
  if (arcDist(a.p, b.p) > (Math.hypot(a.size[0], a.size[2]) + Math.hypot(b.size[0], b.size[2])) / 2 + pad) {
    return false
  }
  const d = b.p.clone().sub(a.p).multiplyScalar(R)
  const rect = (o: typeof a) => ({
    ax: [o.side, o.front] as const,
    ext: [o.size[0] / 2 + pad / 2, o.size[2] / 2 + pad / 2] as const,
  })
  const ra = rect(a)
  const rb = rect(b)
  for (const axis of [...ra.ax, ...rb.ax]) {
    const projA = ra.ext[0] * Math.abs(ra.ax[0].dot(axis)) + ra.ext[1] * Math.abs(ra.ax[1].dot(axis))
    const projB = rb.ext[0] * Math.abs(rb.ax[0].dot(axis)) + rb.ext[1] * Math.abs(rb.ax[1].dot(axis))
    if (Math.abs(d.dot(axis)) > projA + projB) return false
  }
  return true
}

function tryPlaceBuilding(
  model: string,
  scale: number,
  p: Vector3,
  front: Vector3,
  ownStreet: string | null,
  clearance: number
): BuildingInstance | null {
  const base = MODEL_SIZE[model]
  const size: [number, number, number] = [base[0] * scale, base[1] * scale, base[2] * scale]
  const circ = Math.hypot(size[0], size[2]) / 2
  const side = new Vector3().crossVectors(p, front).normalize()

  // Street clearance: own street measured to the facade, others to the footprint corner
  if (ownStreet) {
    if (distToStreets(p, ownStreet) < FRONTAGE + circ) return null
  } else if (distToStreets(p) < clearance + circ) {
    return null
  }
  if (inPlaza(p, circ)) return null
  if (nearProtected(p, circ)) return null

  const candidate = { p, front, side, size }
  for (const b of BUILDINGS) {
    if (footprintsOverlap(candidate, b, 0.15)) return null
  }

  const inst: BuildingInstance = {
    model,
    p,
    front,
    side,
    size,
    scale,
    quaternion: basisQuat(p, front),
    position: lift(p, -0.05),
  }
  BUILDINGS.push(inst)
  return inst
}

// 1. Street frontages — facades line both sides of every street
for (const st of STREETS) {
  for (const sideSign of [1, -1] as const) {
    let s = rand() * 2
    while (s < st.length - 1) {
      const tall = rand() < 0.16
      const model = tall ? pick(TALL_MODELS) : pick(FRONTAGE_MODELS)
      const scale = tall ? 5.6 + rand() * 0.8 : 6.6 + rand() * 1.2
      const [bw, , bd] = MODEL_SIZE[model]
      const w = bw * scale
      const d = bd * scale

      const idx = Math.min(st.samples.length - 1, Math.round(s + w / 2))
      const smp = st.samples[idx]
      const outward = smp.s.clone().multiplyScalar(sideSign)
      const setback = rand() * 0.6
      const p = walk(smp.p, outward, FRONTAGE + d / 2 + setback)
      const front = outward.clone().negate()
      // Re-project front onto the new tangent plane
      front.addScaledVector(p, -front.dot(p)).normalize()

      const placed = tryPlaceBuilding(model, scale, p, front, st.id, 0)
      s += placed ? w + 0.1 + rand() * 0.9 : 1.5
    }
  }
}

// 2. Backfill — fill block interiors so every horizon has a skyline
{
  const N = 420
  const golden = Math.PI * (3 - Math.sqrt(5))
  const order = Array.from({ length: N }, (_, i) => i).sort(() => rand() - 0.5)
  for (const i of order) {
    const y = 1 - (i / (N - 1)) * 2
    const r = Math.sqrt(1 - y * y)
    const th = golden * i
    const p = new Vector3(Math.cos(th) * r, y, Math.sin(th) * r)
    const ref = Math.abs(p.y) > 0.9 ? new Vector3(1, 0, 0) : new Vector3(0, 1, 0)
    const front = ref.addScaledVector(p, -ref.dot(p)).normalize()
    front.applyAxisAngle(p, rand() * Math.PI * 2)
    const backdrop = rand() < 0.5
    const model = backdrop ? pick(BACKDROP_MODELS) : pick([...FRONTAGE_MODELS, ...TALL_MODELS])
    const scale = backdrop ? 10 + rand() * 3 : 6.5 + rand()
    tryPlaceBuilding(model, scale, p, front, null, FRONTAGE + 0.6)
  }
}

// ── STREET FURNITURE ─────────────────────────────────────
export interface PropInstance {
  kind: PropKind
  position: Vector3
  quaternion: Quaternion
  scale: Vector3
}

export type PropKind =
  | 'pole'
  | 'crossarm'
  | 'transformer'
  | 'lampArm'
  | 'lampHead'
  | 'posterBand'
  | 'vending'
  | 'vendingPanel'
  | 'acUnit'
  | 'planter'
  | 'plant'
  | 'bin'
  | 'crate'
  | 'railPost'
  | 'railBar'
  | 'mirrorPole'
  | 'mirror'
  | 'wallPoster'
  | 'bollard'

export const PROPS: PropInstance[] = []
export const WIRE_SEGMENTS: [number, number, number][] = []

function addProp(kind: PropKind, p: Vector3, front: Vector3, h: number, scale: [number, number, number], localOffset?: Vector3) {
  const q = basisQuat(p, front)
  const pos = lift(p, h)
  if (localOffset) pos.add(localOffset.clone().applyQuaternion(q))
  PROPS.push({ kind, position: pos, quaternion: q, scale: new Vector3(...scale) })
}

/** Catenary-ish wire between two world points, sagging toward the planet. */
function addWire(a: Vector3, b: Vector3, sag: number) {
  const SEG = 10
  let prev = a.clone()
  for (let i = 1; i <= SEG; i++) {
    const f = i / SEG
    const pt = a.clone().lerp(b, f)
    const down = pt.clone().normalize().multiplyScalar(-sag * 4 * f * (1 - f))
    pt.add(down)
    WIRE_SEGMENTS.push([prev.x, prev.y, prev.z], [pt.x, pt.y, pt.z])
    prev = pt
  }
}

const POLE_HEIGHT = 7.6
const POLE_SPACING = 13

function clearOfBuildings(p: Vector3, r: number) {
  return !BUILDINGS.some((b) => arcDist(p, b.p) < Math.min(b.size[0], b.size[2]) / 2 + r)
}

for (const st of STREETS) {
  // ── Utility poles + wires ──
  const side = st.poleSide
  const poleOffset = ROAD_HALF_WIDTH + 0.7
  let prevPole: { tops: Vector3[] } | null = null
  for (let s = 4; s < st.length - 2; s += POLE_SPACING) {
    const smp = st.samples[Math.round(s)]
    const outward = smp.s.clone().multiplyScalar(side)
    const p = walk(smp.p, outward, poleOffset)
    if (inPlaza(p, 0.5) || distToStreets(p, st.id) < ROAD_HALF_WIDTH + 0.5) {
      prevPole = null
      continue
    }
    const front = smp.t.clone()
    addProp('pole', p, front, POLE_HEIGHT / 2, [0.14, POLE_HEIGHT, 0.14])
    addProp('crossarm', p, front, POLE_HEIGHT - 0.5, [1.8, 0.12, 0.12])
    addProp('posterBand', p, front, 1.7, [0.32, 0.5, 0.32])
    if (rand() < 0.45) {
      addProp('transformer', p, front, POLE_HEIGHT - 2.2, [0.32, 0.8, 0.32], new Vector3(0, 0, 0.3))
    }
    // Street lamp arm reaching over the road
    const toRoad = outward.clone().negate()
    const armFront = toRoad.clone().addScaledVector(p, -toRoad.dot(p)).normalize()
    addProp('lampArm', p, armFront, 5.4, [0.07, 0.07, 1.4], new Vector3(0, 0, 0.7))
    addProp('lampHead', p, armFront, 5.3, [0.26, 0.12, 0.5], new Vector3(0, 0, 1.4))

    // Crossarm endpoints (world space) for wires
    const q = basisQuat(p, front)
    const tops = [-0.8, 0, 0.8].map((x, i) =>
      lift(p, POLE_HEIGHT - 0.44 - (i === 1 ? 0.25 : 0)).add(new Vector3(x, 0, 0).applyQuaternion(q))
    )
    if (prevPole) {
      tops.forEach((t, i) => addWire(prevPole!.tops[i], t, 0.35 + i * 0.05))
    }
    // Service drop wire across the street to the facade opposite
    if (rand() < 0.6) {
      const across = walk(smp.p, outward.clone().negate(), FRONTAGE + 0.2)
      addWire(tops[1], lift(across, 5 + rand() * 1.5), 0.4)
    }
    prevPole = { tops }
  }
  // Close the ring's wire loop
  if (st.closed) prevPole = null

  // ── Guard rails on the side opposite the poles ──
  for (let s = 6; s < st.length - 6; s += 9) {
    if (rand() > 0.35) continue
    const smp = st.samples[Math.round(s)]
    const outward = smp.s.clone().multiplyScalar(-side)
    const p = walk(smp.p, outward, ROAD_HALF_WIDTH + 0.45)
    if (inPlaza(p, 1) || distToStreets(p, st.id) < FRONTAGE) continue
    const front = smp.t.clone()
    const len = 4
    for (const off of [-len / 2, 0, len / 2]) {
      const pp = walk(p, front, off)
      addProp('railPost', pp, front, 0.45, [0.07, 0.9, 0.07])
    }
    addProp('railBar', p, front, 0.88, [0.06, 0.06, len])
    addProp('railBar', p, front, 0.5, [0.05, 0.05, len])
  }
}

// ── Facade clutter: vending machines, AC units, planters, bins, crates, posters ──
for (const b of BUILDINGS) {
  const facadeDist = distToStreets(b.p)
  // Only buildings that actually front a street get clutter
  if (facadeDist > FRONTAGE + b.size[2] / 2 + 1.2) continue

  const frontEdge = walk(b.p, b.front, b.size[2] / 2) // on the facade line
  const r = rand()
  const along = (rand() - 0.5) * Math.max(0, b.size[0] - 1.6)
  const base = walk(frontEdge, b.side, along)
  const face = b.front.clone().addScaledVector(base, -b.front.dot(base)).normalize()

  if (r < 0.14) {
    const p = walk(base, face, 0.4)
    if (clearOfBuildings(p, 0.2)) {
      addProp('vending', p, face, 0.9, [1.0, 1.8, 0.7])
      addProp('vendingPanel', p, face, 1.1, [0.78, 1.0, 0.04], new Vector3(0, 0, 0.36))
      if (rand() < 0.6) addProp('bin', walk(p, b.side, 0.9), face, 0.35, [0.28, 0.7, 0.28])
    }
  } else if (r < 0.34) {
    const p = walk(base, face, 0.25)
    addProp('planter', p, face, 0.22, [1.3, 0.44, 0.45])
    addProp('plant', p, face, 0.75, [0.55, 0.65, 0.3])
  } else if (r < 0.5) {
    const p = walk(base, face, 0.22)
    addProp('acUnit', p, face, 0.32 + (rand() < 0.4 ? 2.6 : 0), [0.85, 0.62, 0.38])
  } else if (r < 0.62) {
    const p = walk(base, face, 0.4)
    const n = 1 + Math.floor(rand() * 3)
    for (let i = 0; i < n; i++) {
      const sz = 0.45 + rand() * 0.25
      const off = new Vector3((rand() - 0.5) * 0.3, 0, (rand() - 0.5) * 0.2)
      addProp('crate', p, face.clone().applyAxisAngle(p, (rand() - 0.5) * 0.5), sz / 2 + i * 0.5, [sz, sz, sz], off)
    }
  } else if (r < 0.72) {
    addProp('bin', walk(base, face, 0.35), face, 0.4, [0.3, 0.8, 0.3])
  }

  // Paper posters stuck on the facade (ref: taped notices)
  if (rand() < 0.4) {
    const n = 1 + Math.floor(rand() * 3)
    for (let i = 0; i < n; i++) {
      const pp = walk(frontEdge, b.side, (rand() - 0.5) * (b.size[0] - 1))
      const fc = b.front.clone().addScaledVector(pp, -b.front.dot(pp)).normalize()
      const q = basisQuat(pp, fc)
      q.multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), (rand() - 0.5) * 0.35))
      PROPS.push({
        kind: 'wallPoster',
        position: lift(pp, 1.4 + rand() * 1.4).addScaledVector(fc, 0.04),
        quaternion: q,
        scale: new Vector3(0.45 + rand() * 0.2, 0.6 + rand() * 0.25, 1),
      })
    }
  }
}

// ── Convex traffic mirrors + bollards where streets meet plazas ──
for (const pl of PLAZAS.slice(0, 4)) {
  for (const st of STREETS) {
    for (const smp of st.samples) {
      const d = arcDist(smp.p, pl.center)
      if (Math.abs(d - pl.radius) > 0.5) continue
      for (const sign of [1, -1]) {
        const p = walk(smp.p, smp.s.clone().multiplyScalar(sign), ROAD_HALF_WIDTH + 0.4)
        addProp('bollard', p, smp.t, 0.45, [0.12, 0.9, 0.12])
      }
      if (rand() < 0.5) {
        const p = walk(smp.p, smp.s, ROAD_HALF_WIDTH + 1.2)
        const toRoad = smp.s.clone().negate()
        addProp('mirrorPole', p, toRoad, 1.5, [0.07, 3.0, 0.07])
        addProp('mirror', p, toRoad, 3.0, [0.55, 0.55, 0.12], new Vector3(0, 0, 0.12))
      }
      break
    }
  }
}

// ── ROAD SURFACE STRIPS ─────────────────────────────────
// Each strip is a run of consecutive samples with inner/outer
// lateral offsets. Runs break at intersections and plazas.
export interface StripRun {
  points: { inner: Vector3; outer: Vector3 }[]
}

function buildRuns(
  st: Street,
  inner: number,
  outer: number,
  h: number,
  keep: (smp: StreetSample, p: Vector3) => boolean,
  topH = h
): StripRun[] {
  const runs: StripRun[] = []
  let cur: StripRun | null = null
  const n = st.samples.length + (st.closed ? 1 : 0)
  for (let i = 0; i < n; i++) {
    const smp = st.samples[i % st.samples.length]
    const mid = walk(smp.p, smp.s, (inner + outer) / 2)
    if (!keep(smp, mid)) {
      cur = null
      continue
    }
    if (!cur) {
      cur = { points: [] }
      runs.push(cur)
    }
    cur.points.push({
      inner: lift(walk(smp.p, smp.s, inner), h),
      outer: lift(walk(smp.p, smp.s, outer), topH),
    })
  }
  return runs.filter((r) => r.points.length > 1)
}

export const ASPHALT_RUNS: StripRun[] = []
export const LINE_RUNS: StripRun[] = []
export const CURB_TOP_RUNS: StripRun[] = []
export const CURB_FACE_RUNS: StripRun[] = []

STREETS.forEach((st, i) => {
  const h = 0.03 + i * 0.002
  ASPHALT_RUNS.push(...buildRuns(st, -ROAD_HALF_WIDTH, ROAD_HALF_WIDTH, h, () => true))

  const clearOfJunctions = (margin: number) => (_: StreetSample, p: Vector3) =>
    !inPlaza(p, 0) && distToStreets(p, st.id) > ROAD_HALF_WIDTH + margin

  for (const sign of [1, -1]) {
    const edge = sign * ROAD_HALF_WIDTH
    const lineIn = sign * (ROAD_HALF_WIDTH - 0.55)
    const lineOut = sign * (ROAD_HALF_WIDTH - 0.4)
    LINE_RUNS.push(...buildRuns(st, lineIn, lineOut, 0.05, clearOfJunctions(0.8)))
    const cIn = edge
    const cOut = sign * (ROAD_HALF_WIDTH + CURB_WIDTH)
    CURB_TOP_RUNS.push(...buildRuns(st, cIn, cOut, CURB_HEIGHT, clearOfJunctions(0.6)))
    CURB_FACE_RUNS.push(...buildRuns(st, cIn, cIn, 0.02, clearOfJunctions(0.6), CURB_HEIGHT))
  }
})

// Zebra crossings where streets enter district plazas
export const CROSSWALK_QUADS: Vector3[][] = []
for (const pl of PLAZAS.slice(0, 4)) {
  for (const st of STREETS) {
    for (const smp of st.samples) {
      if (Math.abs(arcDist(smp.p, pl.center) - (pl.radius + 1.6)) > 0.5) continue
      const away = smp.p.clone().sub(pl.center)
      const dir = smp.t.clone().multiplyScalar(Math.sign(away.dot(smp.t)) || 1)
      for (let k = -2; k <= 2; k++) {
        const c = walk(smp.p, smp.s, k * 1.1)
        const corners = [
          [-0.3, -1.1], [0.3, -1.1], [0.3, 1.1], [-0.3, 1.1],
        ].map(([a, b]) => lift(walk(walk(c, smp.s, a), dir, b), 0.055))
        CROSSWALK_QUADS.push(corners)
      }
      break
    }
  }
}

if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
  console.info(
    `[streetLayout] ${STREETS.length} streets, ${BUILDINGS.length} buildings, ${PROPS.length} props, ${WIRE_SEGMENTS.length / 2} wire segs`
  )
}
