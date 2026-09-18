'use client'

import { useEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { Mesh, MeshToonMaterial, Texture, Quaternion, Euler } from 'three'
import { RigidBody } from '@react-three/rapier'
import {
  ROAD_TILES,
  BUILDINGS,
  PROP_LOCATIONS,
  NPC_LOCATIONS,
} from '@/lib/worldCoordinates'
import { mapToSphere, flatToSphere } from '@/lib/surfacePlacement'
import NPCCharacter from './NPCCharacter'
import FlickerLight from './FlickerLight'
import DistrictGateways from './DistrictGateways'
import InWorldSignage from './InWorldSignage'
import RoadMarkings from './RoadMarkings'

interface EnvironmentProps {
  gradientMap: Texture
}

// ── Pre-compute sphere-projected light positions ────────────
const SPHERE_404_LIGHT_POS = flatToSphere(0, 99, 0).position
const SPHERE_CAFE_LANTERN_POS = flatToSphere(-42, 3, 2.5).position

// ── Pre-compute sphere-projected positions at module level ──
// This avoids recalculating every render.
const SPHERE_ROADS = mapToSphere(ROAD_TILES.map(t => ({
  ...t,
  rotation: t.rotation ?? [0, 0, 0] as [number, number, number],
})))

const SPHERE_BUILDINGS = mapToSphere(BUILDINGS.map(b => ({
  ...b,
  rotation: b.rotation ?? [0, 0, 0] as [number, number, number],
})))

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
    if (isLamp) {
      return new MeshToonMaterial({
        color: '#FFFFFF',
        emissive: '#FFF6E0',
        emissiveIntensity: 0.9,
        gradientMap,
      })
    }
    return new MeshToonMaterial({ color, gradientMap })
  }, [color, gradientMap, isLamp])

  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof Mesh) {
        child.material = material
        child.castShadow = castShadow
        child.receiveShadow = receiveShadow
      }
    })
  }, [scene, material, castShadow, receiveShadow])

  return (
    <primitive
      object={scene.clone()}
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

      {/* ── ROADS ────────────────────────────────────
          Non-colliding — visitor walks over these freely,
          they're just visual ground dressing.
          Now projected onto the sphere surface.
      ──────────────────────────────────────────────── */}
      {SPHERE_ROADS.map((tile, i) => (
        <KenneyAsset
          key={`road-${i}`}
          model={tile.model}
          position={tile.position}
          rotation={tile.rotation}
          gradientMap={gradientMap}
          color="#1A1A1A"
          receiveShadow
        />
      ))}

      {/* ── BUILDINGS ────────────────────────────────
          Fixed RigidBody wrapper with a simple box collider
          approximation so characters can't walk through walls.
          Q132: Scale jitter (0.9-1.2x) for varied architectural silhouettes.
      ──────────────────────────────────────────────── */}
      {SPHERE_BUILDINGS.map((building, i) => {
        const buildingScale = building.scale ?? (0.9 + ((i * 13) % 7) * 0.05)
        return (
          <RigidBody
            key={`building-${i}`}
            type="fixed"
            colliders="cuboid"
            position={building.position}
            rotation={building.rotation}
          >
            <KenneyAsset
              model={building.model}
              position={[0, 0, 0]}
              scale={buildingScale}
              gradientMap={gradientMap}
              color="#141414"
            />
          </RigidBody>
        )
      })}

      {/* ── PROPS ────────────────────────────────────
          Small/medium props: no collider (per spec — papers,
          cups, small items pass through). Interactive props
          get a name tag so InteractiveProps.tsx can raycast them.
          Projected onto sphere surface.
      ──────────────────────────────────────────────── */}
      {SPHERE_PROPS.map((prop) => (
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

      {/* ── Q133: CONFORMAL ROAD MARKINGS ────────────── */}
      <RoadMarkings />

      {/* ── Q87: IN-WORLD SDF SIGNAGE ─────────────────── */}
      <InWorldSignage />

      {/* ── Q135: OVERHEAD DISTRICT GATEWAYS ─────────── */}
      <DistrictGateways gradientMap={gradientMap} />
    </group>
  )
}

// Preload core road/building assets so first paint isn't blank
useGLTF.preload('/kenney/road-crossing.glb')
useGLTF.preload('/kenney/road-straight.glb')
useGLTF.preload('/kenney/road-end.glb')
useGLTF.preload('/joe.vrm')