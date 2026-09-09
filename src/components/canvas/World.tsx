'use client'

import { useMemo } from 'react'
import { DataTexture, RedFormat } from 'three'
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier'
import VisitorController from './VisitorController'
import AbdulrahmanController from './AbdulrahmanController'
import TriggerZones from './TriggerZones'
import Environment from './Environment'
import OryzonGate from './OryzonGate'
import {
  GRAVITY,
  GROUND_SIZE,
  TOON_GRADIENT_STEPS,
  GROUND_COLOR,
} from '@/lib/constants'
import InteractiveProps from './InteractiveProps'





export default function World() {
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
      // Uncomment to see collider wireframes in dev:
      // debug
    >
      {/* ── GROUND PLANE ────────────────────────────
          Flat, massive plane at Y = 0.
          Characters spawn at Y = 1 (above this).
          CuboidCollider is a thin box so physics works correctly
          — a raw plane mesh has no physics volume.
      ──────────────────────────────────────────────── */}
      <OryzonGate />
      <RigidBody type="fixed" name="ground">
       

          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
          <planeGeometry args={[GROUND_SIZE, GROUND_SIZE]} />
          <meshToonMaterial color={GROUND_COLOR} gradientMap={gradientMap} />
        </mesh>
        {/* Thin physics box just below visual plane */}
        <CuboidCollider
          args={[GROUND_SIZE / 2, 0.05, GROUND_SIZE / 2]}
          position={[0, -0.05, 0]}
        />
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
      {/* // Add inside <Physics>, alongside <TriggerZones /> and <Environment />: */}
      <InteractiveProps />
    </Physics>
  )
}
