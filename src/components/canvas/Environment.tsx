'use client'

import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { Mesh, MeshToonMaterial, Texture } from 'three'
import {
  PROP_LOCATIONS,
  ADDITIONAL_PROPS,
  DEAD_END_PROPS,
  ORYZON_PROPS,
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
import { paint } from '@/lib/paint'

interface EnvironmentProps {
  gradientMap: Texture
}

// ── Pre-compute sphere-projected light positions ────────────
const SPHERE_404_LIGHT_POS = flatToSphere(0, 99, 0).position
const SPHERE_CAFE_LANTERN_POS = flatToSphere(-42, 3, 2.5).position

// ── Pre-compute sphere-projected positions at module level ──
// This avoids recalculating every render.

// PROP_LOCATIONS carries the 8 content-panel anchors (render:false where
// PhysicalProps.tsx already draws the real mesh — see worldCoordinates.ts);
// the other three arrays are pure decoration with no PhysicalProps twin
// and must stay in the render list.
const ALL_PROPS = [
  ...PROP_LOCATIONS,
  ...ADDITIONAL_PROPS,
  ...DEAD_END_PROPS,
  ...ORYZON_PROPS,
]

const SPHERE_PROPS = mapToSphere(ALL_PROPS.map(p => ({
  ...p,
  rotation: p.rotation ?? [0, 0, 0] as [number, number, number],
})))

const SPHERE_NPCS = mapToSphere(NPC_LOCATIONS.map(n => ({
  ...n,
  rotation: n.rotation ?? [0, 0, 0] as [number, number, number],
})))

// The Kenney props are modelled at toy scale (a cone is 9cm tall). These factors
// bring them to plausible real sizes until authored props replace them
// (docs/ASSET_SPEC.md §2).
const PROP_SCALE: Record<string, number> = {
  'construction-cone.glb': 6.5, //   0.09m → 0.6m
  'construction-barrier.glb': 8.5, // 0.12m → 1.0m tall, 1.9m long
  'construction-light.glb': 6.5, //   0.23m → 1.5m
  'light-curved.glb': 7.5, //         0.67m → 5.0m streetlamp
  'light-square.glb': 7.5, //         0.60m → 4.5m
  'sign-highway.glb': 5, //           0.71m → 3.5m tall, 5m wide
}

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
      return paint(new MeshToonMaterial({
        map,
        emissive: '#FFF6E0',
        emissiveIntensity: 0.4,
        gradientMap,
      }), { shadow: 0.3 })
    }
    return paint(
      map ? new MeshToonMaterial({ map, gradientMap }) : new MeshToonMaterial({ color, gradientMap }),
      { shadow: 0.35 }
    )
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
            scale={(prop.scale ?? 1) * (PROP_SCALE[prop.model] ?? 1)}
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

// The NPCs share the visitor model until they have their own (see lib/characterModels),
// and the visitor already preloads it, so there is nothing extra to fetch here.