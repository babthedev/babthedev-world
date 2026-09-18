'use client'

import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  InstancedMesh,
  Matrix4,
  Vector3,
  MeshToonMaterial,
} from 'three'
import { PLANET_RADIUS, INK_COLOR } from '@/lib/constants'
import { useWorldStore } from '@/store/useWorldStore'

const CRANE_COUNT = 6

// Reusable scratch vectors & matrices to eliminate per-frame allocations
const _pos = new Vector3()
const _forward = new Vector3()
const _up = new Vector3()
const _right = new Vector3()
const _matrix = new Matrix4()

interface OrbitConfig {
  radius: number
  speed: number
  phaseOffset: number
  inclination: number // tilt relative to equatorial plane
  nodeLongitude: number // rotation of orbital plane around Y
  flapSpeed: number
  altitudeSineFreq: number
  altitudeSineAmp: number
}

export default function PaperCranes() {
  const meshRef = useRef<InstancedMesh>(null)
  const craneFlyoverTrigger = useWorldStore((s) => s.craneFlyoverTrigger)
  const flyoverStartTime = useRef<number>(-999)

  useEffect(() => {
    if (craneFlyoverTrigger > 0) {
      flyoverStartTime.current = -1 // flag to capture next frame time
    }
  }, [craneFlyoverTrigger])

  // Configure distinct inclined orbital paths around the sphere
  const orbits = useMemo<OrbitConfig[]>(
    () => [
      {
        radius: PLANET_RADIUS + 11.0,
        speed: 0.18,
        phaseOffset: 0.0,
        inclination: 0.25,
        nodeLongitude: 0.3,
        flapSpeed: 7.5,
        altitudeSineFreq: 0.7,
        altitudeSineAmp: 0.8,
      },
      {
        radius: PLANET_RADIUS + 13.5,
        speed: 0.14,
        phaseOffset: 1.8,
        inclination: -0.4,
        nodeLongitude: 1.6,
        flapSpeed: 8.2,
        altitudeSineFreq: 0.5,
        altitudeSineAmp: 1.2,
      },
      {
        radius: PLANET_RADIUS + 10.5,
        speed: 0.21,
        phaseOffset: 3.4,
        inclination: 0.65,
        nodeLongitude: 2.8,
        flapSpeed: 9.0,
        altitudeSineFreq: 0.9,
        altitudeSineAmp: 0.6,
      },
      {
        radius: PLANET_RADIUS + 14.0,
        speed: 0.16,
        phaseOffset: 4.6,
        inclination: -0.55,
        nodeLongitude: 4.2,
        flapSpeed: 7.8,
        altitudeSineFreq: 0.6,
        altitudeSineAmp: 1.0,
      },
      {
        radius: PLANET_RADIUS + 12.0,
        speed: 0.23,
        phaseOffset: 5.5,
        inclination: 0.15,
        nodeLongitude: 5.3,
        flapSpeed: 8.6,
        altitudeSineFreq: 0.8,
        altitudeSineAmp: 0.7,
      },
      {
        radius: PLANET_RADIUS + 15.0,
        speed: 0.12,
        phaseOffset: 2.3,
        inclination: -0.7,
        nodeLongitude: 0.9,
        flapSpeed: 7.0,
        altitudeSineFreq: 0.4,
        altitudeSineAmp: 1.4,
      },
    ],
    []
  )

  const material = useMemo(
    () =>
      new MeshToonMaterial({
        color: INK_COLOR,
      }),
    []
  )

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.getElapsedTime()

    if (flyoverStartTime.current === -1) {
      flyoverStartTime.current = t
    }

    // Q80: Low flock flyover swoop calculation (lasts 8 seconds)
    let swoopDip = 0
    const flyoverElapsed = t - flyoverStartTime.current
    if (flyoverElapsed >= 0 && flyoverElapsed < 8.0) {
      // Smooth sine bell curve peaking at ~8.5m dip towards surface
      swoopDip = Math.sin((flyoverElapsed / 8.0) * Math.PI) * 8.5
    }

    orbits.forEach((orbit, i) => {
      const speedMultiplier = swoopDip > 0 ? 1.6 : 1.0
      const angle = orbit.phaseOffset + t * (orbit.speed * speedMultiplier)
      const currentRadius = Math.max(
        PLANET_RADIUS + 2.8,
        orbit.radius -
          swoopDip +
          Math.sin(t * orbit.altitudeSineFreq + orbit.phaseOffset) *
            orbit.altitudeSineAmp
      )

      // 1. Position in the flat orbital plane (XZ)
      const xOrb = currentRadius * Math.cos(angle)
      const zOrb = currentRadius * Math.sin(angle)

      // 2. Velocity tangent in orbital plane
      const dxOrb = -Math.sin(angle)
      const dzOrb = Math.cos(angle)

      // 3. Rotate by inclination around X, then nodeLongitude around Y
      const cosInc = Math.cos(orbit.inclination)
      const sinInc = Math.sin(orbit.inclination)
      const cosNode = Math.cos(orbit.nodeLongitude)
      const sinNode = Math.sin(orbit.nodeLongitude)

      // Apply inclination (rotation around X)
      const yInc = -zOrb * sinInc
      const zInc = zOrb * cosInc
      const xInc = xOrb

      const dyInc = -dzOrb * sinInc
      const dzInc = dzOrb * cosInc
      const dxInc = dxOrb

      // Apply node longitude (rotation around Y)
      _pos.set(
        xInc * cosNode + zInc * sinNode,
        yInc,
        -xInc * sinNode + zInc * cosNode
      )

      _forward
        .set(
          dxInc * cosNode + dzInc * sinNode,
          dyInc,
          -dxInc * sinNode + dzInc * cosNode
        )
        .normalize()

      // 4. Normal points outward from sphere center
      _up.copy(_pos).normalize()

      // 5. Right vector (wings span across tangent plane)
      _right.crossVectors(_forward, _up).normalize()
      // Re-orthogonalize up vector
      _up.crossVectors(_right, _forward).normalize()

      // 6. Wing flap pulsation on lateral span
      const flapScale =
        0.65 + Math.abs(Math.sin(t * orbit.flapSpeed + orbit.phaseOffset)) * 0.45

      // Cone geometry: height along Y (forward), base in XZ (wings = X, dorsal ridge = Z)
      // Map columns: Col 0 = right * flapScale, Col 1 = forward, Col 2 = up
      _matrix.set(
        _right.x * flapScale, _forward.x * 1.2, _up.x, _pos.x,
        _right.y * flapScale, _forward.y * 1.2, _up.y, _pos.y,
        _right.z * flapScale, _forward.z * 1.2, _up.z, _pos.z,
        0, 0, 0, 1
      )

      meshRef.current!.setMatrixAt(i, _matrix)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, CRANE_COUNT]}
      material={material}
      castShadow={false}
      receiveShadow={false}
    >
      {/* Flattened 4-sided cone reading as folded paper crane silhouette */}
      <coneGeometry args={[0.9, 1.8, 4]} />
    </instancedMesh>
  )
}