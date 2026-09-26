'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ConeGeometry, BoxGeometry, Euler, MeshToonMaterial, Texture, InstancedMesh } from 'three'
import { InstancedRigidBodies, RapierRigidBody, type InstancedRigidBodyProps } from '@react-three/rapier'
import { flatToSphere } from '@/lib/surfacePlacement'
import { PLANET_RADIUS } from '@/lib/constants'
import { paint } from '@/lib/paint'
import { useAudioManager } from '@/hooks/useAudioManager'

/**
 * Traffic cones and stacked crates scattered around the district plazas. They are
 * real physics bodies, light enough to shove, knock over and scatter, which is the
 * kind of small reaction that makes a place feel solid rather than painted on.
 *
 * Each kind is one instanced mesh, so a few dozen props cost two draw calls. The
 * radial gravity field already pulls every dynamic body toward the planet, so
 * nothing here needs to know about the sphere except where it starts.
 */

// The physics step follows the frame time, and the first frames after loading are long
// ones, so a falling prop can tunnel clean through the planet's collider. Continuous
// collision detection stops most of it; this is the net for the rest, the same one
// the visitor has: anything found inside the planet is put back on the surface.
const SAFETY_DEPTH = 0.15
const SAFETY_LIFT = 0.4

const CONE_H = 0.56
const CONE_R = 0.17
const CRATE = 0.5

// Flat-map coordinates (x, z) of each plaza centre; props go around it, off the streets
const PLAZAS_XZ: [number, number][] = [
  [0, 0],
  [40, 0],
  [-40, 0],
  [0, -40],
]

interface Placement {
  x: number
  z: number
  yaw: number
}

// A slalom of cones and a small pyramid of crates in two opposite corners of every plaza
function buildPlacements() {
  const cones: Placement[] = []
  const crates: (Placement & { lift: number })[] = []
  for (const [px, pz] of PLAZAS_XZ) {
    // Corners of the plaza square, away from the four street mouths (which run along the axes)
    for (const sign of [1, -1]) {
      const cx = px + sign * 5.2
      const cz = pz + sign * 5.2
      for (let i = 0; i < 4; i++) cones.push({ x: cx + sign * i * 0.9, z: cz - sign * i * 0.35, yaw: i * 0.7 })
    }
    const bx = px - 5.6
    const bz = pz + 5.4
    crates.push({ x: bx, z: bz, yaw: 0.15, lift: 0 })
    crates.push({ x: bx + 0.62, z: bz + 0.05, yaw: -0.1, lift: 0 })
    crates.push({ x: bx + 0.31, z: bz + 0.02, yaw: 0.05, lift: CRATE }) // on top of the two below
  }
  return { cones, crates }
}

function toInstances(list: (Placement & { lift?: number })[], halfHeight: number, prefix: string): InstancedRigidBodyProps[] {
  return list.map((p, i) => {
    // spawn a hair above the surface and let gravity seat it
    const { position, quaternion } = flatToSphere(p.x, p.z, halfHeight + (p.lift ?? 0) + 0.02, p.yaw)
    const rotation = new Euler().setFromQuaternion(quaternion)
    return { key: `${prefix}-${i}`, position, rotation: [rotation.x, rotation.y, rotation.z] }
  })
}

export default function KnockableProps({ gradientMap }: { gradientMap: Texture }) {
  const { playKnock } = useAudioManager()
  const coneBodies = useRef<RapierRigidBody[]>(null)
  const crateBodies = useRef<RapierRigidBody[]>(null)
  const coneMesh = useRef<InstancedMesh>(null)
  const crateMesh = useRef<InstancedMesh>(null)

  const { cones, crates } = useMemo(() => buildPlacements(), [])
  const coneInstances = useMemo(() => toInstances(cones, CONE_H / 2, 'cone'), [cones])
  const crateInstances = useMemo(() => toInstances(crates, CRATE / 2, 'crate'), [crates])

  const coneGeo = useMemo(() => new ConeGeometry(CONE_R, CONE_H, 14), [])
  const crateGeo = useMemo(() => new BoxGeometry(CRATE, CRATE, CRATE), [])
  const coneMat = useMemo(() => paint(new MeshToonMaterial({ color: '#F1F0EB', gradientMap }), { shadow: 0.3 }), [gradientMap])
  const crateMat = useMemo(() => paint(new MeshToonMaterial({ color: '#BCB8AE', gradientMap }), { shadow: 0.3 }), [gradientMap])

  useFrame(() => {
    for (const list of [coneBodies.current, crateBodies.current]) {
      if (!list) continue
      for (const body of list) {
        const t = body.translation()
        const r = Math.hypot(t.x, t.y, t.z)
        if (r < PLANET_RADIUS - SAFETY_DEPTH && r > 0.001) {
          const k = (PLANET_RADIUS + SAFETY_LIFT) / r
          body.setTranslation({ x: t.x * k, y: t.y * k, z: t.z * k }, true)
          body.setLinvel({ x: 0, y: 0, z: 0 }, true)
          body.setAngvel({ x: 0, y: 0, z: 0 }, true)
        }
      }
    }
  })

  // Dev-only: lets a test read where every prop is, to prove they can be pushed
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return
    const w = window as unknown as Record<string, unknown>
    w.__KNOCKABLES__ = () =>
      [...(coneBodies.current ?? []), ...(crateBodies.current ?? [])].map((b) => {
        const t = b.translation()
        return [t.x, t.y, t.z]
      })
    return () => {
      delete w.__KNOCKABLES__
    }
  }, [])

  // One knock per contact that is hard enough to hear, and only when the visitor did it
  const lastKnock = useRef(0)
  const onKnock = (name: string | undefined, force: number) => {
    if (name !== 'visitor' || force < 0.4) return
    const now = performance.now()
    if (now - lastKnock.current < 140) return
    lastKnock.current = now
    playKnock(Math.min(1, force / 4))
  }

  return (
    <>
      <InstancedRigidBodies
        ref={coneBodies}
        instances={coneInstances}
        colliders="hull"
        mass={0.35}
        friction={0.9}
        restitution={0.25}
        ccd
        linearDamping={0.5}
        angularDamping={0.7}
        onContactForce={(p) => onKnock(p.other.rigidBodyObject?.name, p.totalForceMagnitude)}
      >
        <instancedMesh ref={coneMesh} args={[coneGeo, coneMat, coneInstances.length]} castShadow receiveShadow frustumCulled={false} />
      </InstancedRigidBodies>

      <InstancedRigidBodies
        ref={crateBodies}
        instances={crateInstances}
        colliders="cuboid"
        mass={0.9}
        friction={0.95}
        restitution={0.1}
        ccd
        linearDamping={0.6}
        angularDamping={0.8}
        onContactForce={(p) => onKnock(p.other.rigidBodyObject?.name, p.totalForceMagnitude)}
      >
        <instancedMesh ref={crateMesh} args={[crateGeo, crateMat, crateInstances.length]} castShadow receiveShadow frustumCulled={false} />
      </InstancedRigidBodies>
    </>
  )
}
