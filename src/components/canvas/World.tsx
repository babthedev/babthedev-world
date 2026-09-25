'use client'

import { useMemo } from 'react'
import { DataTexture, RedFormat } from 'three'
import { Physics, RigidBody, BallCollider } from '@react-three/rapier'
import VisitorController from './VisitorController'
import AbdulrahmanController from './AbdulrahmanController'
import TriggerZones from './TriggerZones'
import Environment from './Environment'
import StreetKit from './StreetKit'
import OryzonGate from './OryzonGate'
import RadialGravityField from './RadialGravityField'
import {
  GRAVITY,
  TOON_GRADIENT_STEPS,
  GROUND_COLOR,
  PLANET_RADIUS,
  SPHERE_SEGMENTS,
} from '@/lib/constants'
import InteractiveProps from './InteractiveProps'
import { useWorldStore } from '@/store/useWorldStore'


export default function World() {
  const debugMode = useWorldStore((s) => s.debugMode)
  // ── 4-STEP GRAYSCALE GRADIENT ─────────────────────────
  // This DataTexture is what converts MeshToonMaterial from
  // smooth shading into hard cel-shading steps.
  // Steps: near-black → dark grey → mid grey → near-white
  // Passed to every MeshToonMaterial in the scene.
  const gradientMap = useMemo(() => {
    const texture = new DataTexture(
      TOON_GRADIENT_STEPS,
      TOON_GRADIENT_STEPS.length,
      1,
      RedFormat
    )
    texture.needsUpdate = true
    return texture
  }, [])

  return (
    <Physics
      timeStep="vary"
      gravity={[0, GRAVITY, 0]}
      debug={debugMode}
    >
      {/* ── RADIAL GRAVITY FIELD ──────────────────────
          Replaces the linear [0, -30, 0] gravity with
          a per-body force pulling toward the sphere
          center at [0, 0, 0]. Works on every dynamic
          rigid body each physics tick.
      ──────────────────────────────────────────────── */}
      <RadialGravityField />

      {/* ── SPHERICAL PLANET ──────────────────────────
          50m diameter sphere (R=25) centered at origin.
          Characters walk on the outside surface.
          BallCollider matches the sphere geometry exactly.
      ──────────────────────────────────────────────── */}
      <OryzonGate />
      {/* colliders={false}: RigidBody otherwise auto-generates a CUBOID from the
          child mesh's bounding box, turning the planet into a 50m cube whose flat
          faces poke out of the sphere (characters stood on invisible planes
          metres above the street). Only the BallCollider below should exist. */}
      <RigidBody type="fixed" name="ground" colliders={false}>
        <mesh receiveShadow>
          <sphereGeometry args={[PLANET_RADIUS, SPHERE_SEGMENTS, SPHERE_SEGMENTS]} />
          <meshToonMaterial color={GROUND_COLOR} gradientMap={gradientMap} />
        </mesh>
        {/* Physics collider matching the visual sphere */}
        <BallCollider args={[PLANET_RADIUS]} />
      </RigidBody>

      {/* ── CHARACTERS ──────────────────────────────── */}
      <VisitorController />
      <AbdulrahmanController />

      {/* ── ROUTING ZONES ───────────────────────────── */}
      <TriggerZones />

      {/* ── ENVIRONMENT ─────────────────────────────── 
          Roads, buildings, props, NPCs.
          Receives gradientMap so all assets share the same
          toon shading step texture.
      ──────────────────────────────────────────────── */}
      <Environment gradientMap={gradientMap} />
      <StreetKit gradientMap={gradientMap} />
      <InteractiveProps />
    </Physics>
  )
}
