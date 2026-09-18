'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  InstancedMesh,
  Matrix4,
  Vector3,
  Quaternion,
  Euler,
  DoubleSide,
  MeshBasicMaterial,
} from 'three'
import { PLANET_RADIUS } from '@/lib/constants'
import { getSurfaceNormal, projectOntoTangentPlane } from '@/lib/sphereMath'
import { useWorldStore } from '@/store/useWorldStore'

const FLECK_COUNT = 36
const RESPAWN_DISTANCE = 22.0

interface FleckState {
  pos: Vector3
  vel: Vector3
  rot: Quaternion
  rotSpeed: Vector3
  scale: [number, number]
}

const _dummyMatrix = new Matrix4()
const _scaleVec = new Vector3()
const _tempNormal = new Vector3()
const _tangentWind = new Vector3()
const _globalWind = new Vector3(1.2, 0.2, 0.8) // General prevailing wind
const _eulerDelta = new Euler()
const _qDelta = new Quaternion()

export default function PaperFlecks() {
  const meshRef = useRef<InstancedMesh>(null)
  const playerPos = useWorldStore((s) => s.position)

  // Initialize particles in a spherical shell around the player's initial position
  const flecks = useMemo<FleckState[]>(() => {
    return Array.from({ length: FLECK_COUNT }, () => {
      // Random direction around upper hemisphere / near surface
      const u = Math.random() * 2 - 1
      const theta = Math.random() * Math.PI * 2
      const r = Math.sqrt(Math.max(0, 1 - u * u))
      const dir = new Vector3(r * Math.cos(theta), Math.abs(u) * 0.8 + 0.2, r * Math.sin(theta)).normalize()

      // Altitude 0.5m to 2.8m above sphere surface
      const altitude = PLANET_RADIUS + 0.5 + Math.random() * 2.3
      const pos = dir.multiplyScalar(altitude)

      // Random tumbling speeds
      const rotSpeed = new Vector3(
        (Math.random() - 0.5) * 2.5,
        (Math.random() - 0.5) * 3.0,
        (Math.random() - 0.5) * 2.0
      )

      // Slight scale jitter
      const w = 0.14 + Math.random() * 0.08
      const h = 0.10 + Math.random() * 0.06

      return {
        pos,
        vel: new Vector3(),
        rot: new Quaternion().random(),
        rotSpeed,
        scale: [w, h],
      }
    })
  }, [])

  const material = useMemo(
    () =>
      new MeshBasicMaterial({
        color: '#FAF8F3', // Cream / sketchbook parchment
        side: DoubleSide,
        depthWrite: true,
      }),
    []
  )

  useFrame((state, delta) => {
    if (!meshRef.current) return
    const t = state.clock.getElapsedTime()
    const pVec = new Vector3(playerPos[0], playerPos[1], playerPos[2])

    flecks.forEach((fleck, i) => {
      // 1. Surface normal at particle position
      _tempNormal.copy(getSurfaceNormal(fleck.pos))

      // 2. Tangent wind vector curved along spherical surface
      _tangentWind.copy(projectOntoTangentPlane(_globalWind, _tempNormal))
      _tangentWind.normalize().multiplyScalar(1.2) // 1.2 m/s wind speed

      // 3. Gentle sinusoidal flutter / turbulence
      const flutterX = Math.sin(t * 2.4 + i) * 0.35
      const flutterY = Math.cos(t * 1.8 + i * 1.5) * 0.25
      fleck.vel.copy(_tangentWind).add(new Vector3(flutterX, flutterY, flutterX * 0.5))

      // 4. Update position
      fleck.pos.addScaledVector(fleck.vel, delta)

      // 5. Constrain altitude to hover 0.4m - 2.8m above sphere surface
      const currentDist = fleck.pos.length()
      const targetAltitude = PLANET_RADIUS + 0.6 + (Math.sin(t * 0.5 + i) * 0.5 + 0.5) * 1.8
      fleck.pos.normalize().multiplyScalar(currentDist * 0.96 + targetAltitude * 0.04)

      // 6. Recycle if too far from player
      if (fleck.pos.distanceTo(pVec) > RESPAWN_DISTANCE) {
        // Spawn upwind relative to player
        const playerNormal = getSurfaceNormal(pVec)
        const upwindTangent = projectOntoTangentPlane(_globalWind, playerNormal).normalize().negate()
        const spawnDir = pVec.clone().normalize()
        const spawnDist = PLANET_RADIUS + 0.5 + Math.random() * 2.2
        fleck.pos.copy(spawnDir.multiplyScalar(spawnDist))
        fleck.pos.addScaledVector(upwindTangent, 14 + Math.random() * 6)
      }

      // 7. Update tumbling rotation
      _eulerDelta.set(
        fleck.rotSpeed.x * delta,
        fleck.rotSpeed.y * delta,
        fleck.rotSpeed.z * delta
      )
      _qDelta.setFromEuler(_eulerDelta)
      fleck.rot.multiply(_qDelta)

      // 8. Compose transformation matrix
      _scaleVec.set(fleck.scale[0], fleck.scale[1], 1.0)
      _dummyMatrix.compose(fleck.pos, fleck.rot, _scaleVec)
      meshRef.current!.setMatrixAt(i, _dummyMatrix)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, FLECK_COUNT]}
      material={material}
      castShadow={false}
      receiveShadow={false}
    >
      <planeGeometry args={[1, 1]} />
    </instancedMesh>
  )
}
