'use client'

import { useEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { Mesh, MeshToonMaterial, Texture } from 'three'
import {
  PROP_LOCATIONS,
  NPC_LOCATIONS,
} from '@/lib/worldCoordinates'
import { mapToSphere, flatToSphere } from '@/lib/surfacePlacement'
import NPCCharacter from './NPCCharacter'
import FlickerLight from './FlickerLight'
import DistrictGateways from './DistrictGateways'
import InWorldSignage from './InWorldSignage'
import PhysicalProps from './PhysicalProps'
import WindStreaks from './WindStreaks'
import EasterEggs from './EasterEggs'
import { FEATURE_FLAGS } from '@/lib/featureFlags'

interface EnvironmentProps {
  gradientMap: Texture
}

// ── Pre-compute sphere-projected light positions ────────────
const SPHERE_404_LIGHT_POS = flatToSphere(0, 99, 0).position
const SPHERE_CAFE_LANTERN_POS = flatToSphere(-42, 3, 2.5).position

// ── Pre-compute sphere-projected positions at module level ──
// This avoids recalculating every render.

const SPHERE_PROPS = mapToSphere(PROP_LOCATIONS.map(p => ({
  ...p,
  rotation: p.rotation ?? [0, 0, 0] as [number, number, number],
})))

const SPHERE_NPCS = mapToSphere(NPC_LOCATIONS.map(n => ({
  ...n,
  rotation: n.rotation ?? [0, 0, 0] as [number, number, number],
})))

// ── GENERIC KENNEY ASSET LOADER ─────────────────────────
// Loads any GLB from /public/kenney/, strips its material,
// applies shared toon shading. Used for roads, buildings, props.

function KenneyAsset({
  model,
  position,
  rotation = [0, 0, 0],
  scale = 1,
  gradientMap,
  color = '#141414',
  castShadow = true,
  receiveShadow = true,
}: {
  model: string
  position: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
  gradientMap: Texture
  color?: string
  castShadow?: boolean
  receiveShadow?: boolean
}) {
  const { scene } = useGLTF(`/kenney/${model}`)
  const isLamp = model.includes('light') || model.includes('lamp')
  const material = useMemo(() => {
    // Keep Kenney's shared colour-map texture — windows, doors and trim
    // live in it. The Monochrome pass flattens it to greyscale.
    let map: Texture | null = null
    scene.traverse((child) => {
      if (!map && child instanceof Mesh) map = (child.material as MeshToonMaterial).map ?? null
    })
    if (isLamp) {
      return new MeshToonMaterial({
        map,
        emissive: '#FFF6E0',
        emissiveIntensity: 0.4,
        gradientMap,
      })
    }
    return map ? new MeshToonMaterial({ map, gradientMap }) : new MeshToonMaterial({ color, gradientMap })
  }, [scene, color, gradientMap, isLamp])

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((child) => {
      if (child instanceof Mesh) {
        child.material = material
        child.castShadow = castShadow
        child.receiveShadow = receiveShadow
      }
    })
    return clone
  }, [scene, material, castShadow, receiveShadow])

  return (
    <primitive
      object={clonedScene}
      position={position}
      rotation={rotation}
      scale={scale}
    />
  )
}

export default function Environment({ gradientMap }: EnvironmentProps) {
  return (
    <group>
      {/* ── 404 ZONE FLICKERING LIGHT ─────────────────── */}
      <FlickerLight position={SPHERE_404_LIGHT_POS} />

      {/* ── Q131: JOE'S CAFE WARM LANTERN (2nd Strategic Point Light) ── */}
      <pointLight
        position={SPHERE_CAFE_LANTERN_POS}
        color="#FFE8C0"
        intensity={1.0}
        distance={10}
        decay={2}
      />

      {/* ── PROPS ────────────────────────────────────
          Small/medium props: no collider (per spec — papers,
          cups, small items pass through). Interactive props
          get a name tag so InteractiveProps.tsx can raycast them.
          Projected onto sphere surface.
      ──────────────────────────────────────────────── */}
      {SPHERE_PROPS.filter((prop) => prop.render !== false).map((prop) => (
        <group
          key={prop.id}
          name={prop.interactive ? `interactive-${prop.id}` : prop.id}
          userData={{ panelId: prop.panelId, interactive: prop.interactive }}
        >
          <KenneyAsset
            model={prop.model}
            position={prop.position}
            rotation={prop.rotation}
            scale={prop.scale ?? 1}
            gradientMap={gradientMap}
            color={prop.interactive ? '#A3A3A3' : '#141414'}
          />
        </group>
      ))}

      {/* ── NPCS ─────────────────────────────────────── */}
      {SPHERE_NPCS.map((npc) => (
        <NPCCharacter key={npc.id} npc={npc} gradientMap={gradientMap} />
      ))}

      {/* ── Q87: IN-WORLD SDF SIGNAGE ─────────────────── */}
      <InWorldSignage />

      {/* ── Q135: OVERHEAD DISTRICT GATEWAYS ─────────── */}
      <DistrictGateways gradientMap={gradientMap} />

      {/* ── Q112-Q115: PHYSICAL 3D CONTENT PROPS ────── */}
      <PhysicalProps gradientMap={gradientMap} />

      {/* ── Q103: ENVIRONMENTAL WIND STREAKS ─────────── */}
      {FEATURE_FLAGS.AMBIENT_PAPER && <WindStreaks />}

      {/* ── Q105: ENVIRONMENTAL EASTER EGGS ───────────── */}
      <EasterEggs gradientMap={gradientMap} />
    </group>
  )
}

// Preload Joe VRM asset
useGLTF.preload('/joe.vrm')