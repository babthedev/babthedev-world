'use client'

import { useLayoutEffect, useMemo, useRef } from 'react'
import { useGLTF, Line } from '@react-three/drei'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  DodecahedronGeometry,
  DoubleSide,
  Euler,
  Float32BufferAttribute,
  IcosahedronGeometry,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshToonMaterial,
  PlaneGeometry,
  Quaternion,
  SphereGeometry,
  Texture,
  Vector3,
} from 'three'
import {
  ASPHALT_RUNS,
  BUILDINGS,
  BUILDING_MODELS,
  CROSSWALK_QUADS,
  CURB_FACE_RUNS,
  CURB_TOP_RUNS,
  LINE_RUNS,
  PLAZAS,
  PROPS,
  PropKind,
  SIGNS,
  SIGN_VARIANTS,
  StripRun,
  TREE_CANOPY,
  TREE_TRUNKS,
  TUFTS,
  WIRE_SEGMENTS,
  lift,
} from '@/lib/streetLayout'
import { signTexture } from '@/lib/glyphs'
import { INK_COLOR, PLANET_RADIUS } from '@/lib/constants'
import { paint } from '@/lib/paint'

// ── TONAL PALETTE ──────────────────────────────────────
// Everything is greyscale; the Monochrome pass guarantees the
// final frame is too. Values are chosen so neighbouring surfaces
// separate clearly once flattened to luminance.
const TONE = {
  asphalt: '#77756F',
  line: '#F6F5F0',
  curb: '#D2D0C8',
  plaza: '#BDBBB3',
}

const PROP_STYLE: Record<PropKind, { color: string; geo: 'box' | 'cyl' | 'disc' | 'plane' | 'blob' }> = {
  pole: { color: '#8E8D88', geo: 'cyl' },
  crossarm: { color: '#5E5D5A', geo: 'box' },
  transformer: { color: '#A4A39E', geo: 'cyl' },
  lampArm: { color: '#6B6A67', geo: 'box' },
  lampHead: { color: '#F4F3EE', geo: 'box' },
  posterBand: { color: '#F2F1EC', geo: 'cyl' },
  vending: { color: '#E4E3DE', geo: 'box' },
  vendingPanel: { color: '#3F3E3C', geo: 'box' },
  acUnit: { color: '#D9D8D2', geo: 'box' },
  planter: { color: '#9E9C96', geo: 'box' },
  plant: { color: '#4C4B48', geo: 'blob' },
  bin: { color: '#807F7B', geo: 'cyl' },
  crate: { color: '#BCB8AE', geo: 'box' },
  railPost: { color: '#D4D3CE', geo: 'cyl' },
  railBar: { color: '#D4D3CE', geo: 'box' },
  mirrorPole: { color: '#E2E1DC', geo: 'cyl' },
  mirror: { color: '#F8F8F5', geo: 'disc' },
  wallPoster: { color: '#F7F6F2', geo: 'plane' },
  bollard: { color: '#3C3B39', geo: 'cyl' },
}

const GEOMETRIES = {
  box: new BoxGeometry(1, 1, 1),
  cyl: new CylinderGeometry(0.5, 0.5, 1, 10),
  disc: new CylinderGeometry(0.5, 0.5, 1, 20).rotateX(Math.PI / 2),
  plane: new PlaneGeometry(1, 1),
  blob: new DodecahedronGeometry(0.5, 0),
}

// ── STRIP GEOMETRY ─────────────────────────────────────
function stripGeometry(runs: StripRun[]): BufferGeometry {
  const pos: number[] = []
  const push = (v: Vector3) => pos.push(v.x, v.y, v.z)
  const e1 = new Vector3()
  const e2 = new Vector3()
  const n = new Vector3()
  for (const run of runs) {
    for (let i = 0; i < run.points.length - 1; i++) {
      const a = run.points[i]
      const b = run.points[i + 1]
      // Keep every quad facing away from the planet
      e1.subVectors(a.outer, a.inner)
      e2.subVectors(b.inner, a.inner)
      n.crossVectors(e1, e2)
      const flip = n.dot(a.inner) < 0
      const [p0, p1] = flip ? [a.outer, a.inner] : [a.inner, a.outer]
      const [p2, p3] = flip ? [b.outer, b.inner] : [b.inner, b.outer]
      push(p0); push(p1); push(p2)
      push(p1); push(p3); push(p2)
    }
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.computeVertexNormals()
  return g
}

function quadGeometry(quads: Vector3[][]): BufferGeometry {
  const pos: number[] = []
  for (const [a, b, c, d] of quads) {
    for (const v of [a, b, c, a, c, d]) pos.push(v.x, v.y, v.z)
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.computeVertexNormals()
  return g
}

// ── INSTANCING HELPER ──────────────────────────────────
function Instances({
  geometry,
  material,
  matrices,
  name,
  castShadow = true,
}: {
  geometry: BufferGeometry
  material: MeshToonMaterial
  matrices: Matrix4[]
  name?: string
  castShadow?: boolean
}) {
  const ref = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m))
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
    mesh.computeBoundingBox()
  }, [matrices])
  if (matrices.length === 0) return null
  return (
    <instancedMesh
      ref={ref}
      name={name}
      args={[geometry, material, matrices.length]}
      castShadow={castShadow}
      receiveShadow
      frustumCulled={false}
    />
  )
}

// ── BUILDINGS ──────────────────────────────────────────
function Buildings({ gradientMap }: { gradientMap: Texture }) {
  const gltfs = useGLTF(BUILDING_MODELS.map((m) => `/kenney/${m}`))

  const groups = useMemo(() => {
    let colormap: Texture | null = null
    const geoByModel = new Map<string, BufferGeometry>()
    BUILDING_MODELS.forEach((model, i) => {
      gltfs[i].scene.traverse((child) => {
        if (child instanceof Mesh && !geoByModel.has(model)) {
          geoByModel.set(model, child.geometry)
          colormap ??= (child.material as MeshToonMaterial).map ?? null
        }
      })
    })
    // Painted layer: brush strokes in the shade, dashed hatching on the walls
    const material = paint(new MeshToonMaterial({ map: colormap, color: '#D0D0CB', gradientMap }), { shadow: 0.42, hatch: 0.3 })
    return BUILDING_MODELS.map((model) => ({
      model,
      geometry: geoByModel.get(model)!,
      material,
      matrices: BUILDINGS.filter((b) => b.model === model).map((b) =>
        new Matrix4().compose(b.position, b.quaternion, new Vector3(b.scale, b.scale, b.scale))
      ),
    }))
  }, [gltfs, gradientMap])

  return (
    <group name="buildings">
      {groups.map((g) => (
        <Instances key={g.model} name={`building-${g.model}`} castShadow={false} {...g} />
      ))}
    </group>
  )
}

function BuildingColliders() {
  const colliders = useMemo(
    () =>
      BUILDINGS.map((b) => {
        const center = lift(b.p, b.size[1] / 2)
        const e = new Euler().setFromQuaternion(b.quaternion)
        return {
          position: [center.x, center.y, center.z] as [number, number, number],
          rotation: [e.x, e.y, e.z] as [number, number, number],
          args: [b.size[0] / 2, b.size[1] / 2, b.size[2] / 2] as [number, number, number],
        }
      }),
    []
  )
  // Tree trunks block the way too (canopies are far overhead)
  const trunks = useMemo(
    () =>
      TREE_TRUNKS.map((t) => {
        const e = new Euler().setFromQuaternion(t.quaternion)
        return {
          position: [t.position.x, t.position.y, t.position.z] as [number, number, number],
          rotation: [e.x, e.y, e.z] as [number, number, number],
          args: [0.26, t.scale.y / 2, 0.26] as [number, number, number],
        }
      }),
    []
  )
  return (
    <RigidBody type="fixed" colliders={false} name="building-colliders">
      {colliders.map((c, i) => (
        <CuboidCollider key={i} {...c} />
      ))}
      {trunks.map((c, i) => (
        <CuboidCollider key={`trunk-${i}`} {...c} />
      ))}
    </RigidBody>
  )
}

// ── STREET FURNITURE ───────────────────────────────────
function StreetProps({ gradientMap }: { gradientMap: Texture }) {
  const groups = useMemo(() => {
    const byKind = new Map<PropKind, Matrix4[]>()
    for (const p of PROPS) {
      if (!byKind.has(p.kind)) byKind.set(p.kind, [])
      byKind.get(p.kind)!.push(new Matrix4().compose(p.position, p.quaternion, p.scale))
    }
    return [...byKind.entries()].map(([kind, matrices]) => {
      const style = PROP_STYLE[kind]
      const material = paint(
        new MeshToonMaterial({
          color: style.color,
          gradientMap,
          side: style.geo === 'plane' ? DoubleSide : undefined,
        }),
        { shadow: 0.3 }
      )
      return { kind, geometry: GEOMETRIES[style.geo], material, matrices }
    })
  }, [gradientMap])

  return (
    <group name="street-props">
      {groups.map((g) => (
        <Instances key={g.kind} castShadow={false} {...g} />
      ))}
    </group>
  )
}

// ── ROAD SURFACES ──────────────────────────────────────
function RoadSurfaces({ gradientMap }: { gradientMap: Texture }) {
  const { asphalt, lines, curbTop, curbFace, crosswalks, materials } = useMemo(() => {
    const mat = (color: string, extra: Partial<MeshToonMaterial> = {}) =>
      Object.assign(new MeshToonMaterial({ color, gradientMap }), extra)
    return {
      asphalt: stripGeometry(ASPHALT_RUNS),
      lines: stripGeometry(LINE_RUNS),
      curbTop: stripGeometry(CURB_TOP_RUNS),
      curbFace: stripGeometry(CURB_FACE_RUNS),
      crosswalks: quadGeometry(CROSSWALK_QUADS),
      materials: {
        asphalt: paint(mat(TONE.asphalt, { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }), { shadow: 0.4, blotch: 0.24 }),
        line: mat(TONE.line, { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
        curb: paint(mat(TONE.curb, { side: DoubleSide }), { shadow: 0.3 }),
        plaza: paint(mat(TONE.plaza, { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }), { shadow: 0.4, blotch: 0.2 }),
      },
    }
  }, [gradientMap])

  const plazaCaps = useMemo(
    () =>
      PLAZAS.map((pl) => ({
        geometry: new SphereGeometry(PLANET_RADIUS + 0.035, 48, 6, 0, Math.PI * 2, 0, pl.radius / PLANET_RADIUS),
        quaternion: new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), pl.center),
      })),
    []
  )

  return (
    <group name="road-surfaces">
      <mesh geometry={asphalt} material={materials.asphalt} receiveShadow />
      {plazaCaps.map((c, i) => (
        <mesh key={i} geometry={c.geometry} quaternion={c.quaternion} material={materials.plaza} receiveShadow />
      ))}
      <mesh geometry={lines} material={materials.line} receiveShadow />
      <mesh geometry={crosswalks} material={materials.line} receiveShadow />
      <mesh geometry={curbTop} material={materials.curb} receiveShadow />
      <mesh geometry={curbFace} material={materials.curb} receiveShadow />
    </group>
  )
}

// ── TREES & GRASS (P5) ─────────────────────────────────
// Canopies are clusters of low-poly blobs: the outline pass inks the creases
// between them, which is what makes a clump read as leaves.
const CANOPY_GEO = new IcosahedronGeometry(1, 1)

// A tuft: five thin blades fanned out and leaning away from the centre
function makeTuftGeometry() {
  const pos: number[] = []
  const blades = 5
  for (let i = 0; i < blades; i++) {
    const a = (i / blades) * Math.PI * 2 + 0.4
    const lean = 0.13 + (i % 3) * 0.05
    const h = 0.4 + (i % 2) * 0.14
    const px = -Math.sin(a) * 0.035
    const pz = Math.cos(a) * 0.035
    const bx = Math.cos(a) * 0.03
    const bz = Math.sin(a) * 0.03
    pos.push(bx - px, 0, bz - pz, bx + px, 0, bz + pz, Math.cos(a) * lean, h, Math.sin(a) * lean)
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.computeVertexNormals()
  return g
}
const TUFT_GEO = makeTuftGeometry()

function Foliage({ gradientMap }: { gradientMap: Texture }) {
  const parts = useMemo(() => {
    const toMatrices = (list: { position: Vector3; quaternion: Quaternion; scale: Vector3 }[]) =>
      list.map((p) => new Matrix4().compose(p.position, p.quaternion, p.scale))
    const mat = (color: string, opts: Parameters<typeof paint>[1], side?: typeof DoubleSide) =>
      paint(new MeshToonMaterial({ color, gradientMap, side }), opts)
    return {
      trunk: { geometry: GEOMETRIES.cyl, material: mat('#4A4844', { shadow: 0.3 }), matrices: toMatrices(TREE_TRUNKS) },
      canopy: { geometry: CANOPY_GEO, material: mat('#74736E', { shadow: 0.46, speckle: 0.3 }), matrices: toMatrices(TREE_CANOPY) },
      tufts: { geometry: TUFT_GEO, material: mat('#5C5A55', { shadow: 0.3 }, DoubleSide), matrices: toMatrices(TUFTS) },
    }
  }, [gradientMap])

  return (
    <group name="foliage">
      <Instances {...parts.trunk} />
      <Instances {...parts.canopy} />
      <Instances castShadow={false} {...parts.tufts} />
    </group>
  )
}

// ── GLYPH SIGNS (P5) ───────────────────────────────────
const SIGN_GEO = new PlaneGeometry(1, 1)

function Signs({ gradientMap }: { gradientMap: Texture }) {
  const groups = useMemo(
    () =>
      SIGN_VARIANTS.map((spec, variant) => {
        const map = signTexture(variant, spec)
        const material = paint(
          new MeshToonMaterial({
            map,
            color: map ? '#FFFFFF' : spec.dark ? '#151515' : '#F3F2ED',
            gradientMap,
            side: DoubleSide,
            polygonOffset: true,
            polygonOffsetFactor: -2,
            polygonOffsetUnits: -2,
          }),
          { shadow: 0.2 }
        )
        const matrices = SIGNS.filter((s) => s.variant === variant).map((s) =>
          new Matrix4().compose(s.position, s.quaternion, s.scale)
        )
        return { variant, geometry: SIGN_GEO, material, matrices }
      }),
    [gradientMap]
  )
  return (
    <group name="signs">
      {groups.map((g) => (
        <Instances key={g.variant} castShadow={false} {...g} />
      ))}
    </group>
  )
}

// ── OVERHEAD WIRES ─────────────────────────────────────
function Wires() {
  if (WIRE_SEGMENTS.length === 0) return null
  return <Line points={WIRE_SEGMENTS} segments color={INK_COLOR} lineWidth={1.4} />
}

export default function StreetKit({ gradientMap }: { gradientMap: Texture }) {
  return (
    <group name="street-kit">
      <RoadSurfaces gradientMap={gradientMap} />
      <Buildings gradientMap={gradientMap} />
      <BuildingColliders />
      <StreetProps gradientMap={gradientMap} />
      <Foliage gradientMap={gradientMap} />
      <Signs gradientMap={gradientMap} />
      <Wires />
    </group>
  )
}

BUILDING_MODELS.forEach((m) => useGLTF.preload(`/kenney/${m}`))
