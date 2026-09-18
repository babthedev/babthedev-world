'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  Group,
  Mesh,
  CatmullRomCurve3,
  TubeGeometry,
  Vector3,
  MeshBasicMaterial,
  DoubleSide,
} from 'three'
import { useAudioManager } from '@/hooks/useAudioManager'
import { PLANET_RADIUS } from '@/lib/constants'

// Street canyon altitude: 1.2m to 2.2m above planet ground
const CANYON_RADIUS = PLANET_RADIUS + 1.6

interface RibbonConfig {
  offsetAngle: number
  radiusOffset: number
  speedMult: number
  lengthMult: number
  color: string
}

const RIBBONS: RibbonConfig[] = [
  { offsetAngle: 0.0, radiusOffset: 0.0, speedMult: 1.0, lengthMult: 1.0, color: '#1A1A1A' },
  { offsetAngle: 0.12, radiusOffset: 0.4, speedMult: 1.15, lengthMult: 0.85, color: '#2B2B2B' },
  { offsetAngle: -0.09, radiusOffset: -0.3, speedMult: 0.92, lengthMult: 1.1, color: '#111111' },
  { offsetAngle: 0.22, radiusOffset: 0.2, speedMult: 1.08, lengthMult: 0.75, color: '#333333' },
  { offsetAngle: -0.18, radiusOffset: 0.5, speedMult: 1.22, lengthMult: 0.9, color: '#222222' },
]

export default function WindStreaks() {
  const groupRef = useRef<Group>(null)
  const { playWindWhisper } = useAudioManager()

  // Track gust timing: sweeps every 22-28 seconds
  const timerRef = useRef(14.0) // Start closer to first gust for initial experience
  const gustActiveRef = useRef(false)
  const gustProgressRef = useRef(0)

  // Pre-compute 3D spline curve looping through the street canyon
  // (From Projects side [X > 0] across The Hub [Y > 0] through Library / Terrace [Z < 0])
  const canyonCurve = useMemo(() => {
    const r = CANYON_RADIUS
    const rawWaypoints = [
      new Vector3(r * 0.75, r * 0.45, -r * 0.4),
      new Vector3(r * 0.4, r * 0.82, -r * 0.35),
      new Vector3(0, r * 0.96, -r * 0.15),
      new Vector3(-r * 0.45, r * 0.8, 0.1),
      new Vector3(-r * 0.78, r * 0.48, 0.25),
      new Vector3(-r * 0.65, r * 0.2, 0.6),
    ]

    // Normalize each waypoint strictly to CANYON_RADIUS
    const normalizedWaypoints = rawWaypoints.map((p) =>
      p.clone().normalize().multiplyScalar(r)
    )

    return new CatmullRomCurve3(normalizedWaypoints, false, 'catmullrom', 0.5)
  }, [])

  // Create tube geometries for each wind streak ribbon
  const ribbonMeshes = useMemo(() => {
    return RIBBONS.map((ribbon) => {
      // Create a short sample curve along the canyon path
      const samplePoints: Vector3[] = []
      const segments = 24
      const segLength = 0.18 * ribbon.lengthMult

      for (let i = 0; i <= segments; i++) {
        const u = (i / segments) * segLength
        const pt = canyonCurve.getPoint(u)
        // Add subtle radial and lateral jitter
        pt.add(pt.clone().normalize().multiplyScalar(ribbon.radiusOffset))
        samplePoints.push(pt)
      }

      const curve = new CatmullRomCurve3(samplePoints)
      const geometry = new TubeGeometry(curve, 20, 0.04, 5, false)

      const material = new MeshBasicMaterial({
        color: ribbon.color,
        transparent: true,
        opacity: 0,
        side: DoubleSide,
        depthWrite: false,
      })

      return { geometry, material, ribbon }
    })
  }, [canyonCurve])

  const meshRefs = useRef<(Mesh | null)[]>([])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1)
    timerRef.current += dt

    // Periodic gust trigger every 24 seconds
    if (!gustActiveRef.current && timerRef.current >= 24.0) {
      gustActiveRef.current = true
      gustProgressRef.current = 0
      timerRef.current = 0
      playWindWhisper()
    }

    if (gustActiveRef.current) {
      // Gust traverses over 4.5 seconds
      gustProgressRef.current += dt / 4.5
      const p = gustProgressRef.current

      // Fade envelope: 0 -> 0.75 -> 0
      let opacity = 0
      if (p < 0.2) {
        opacity = (p / 0.2) * 0.75
      } else if (p < 0.7) {
        opacity = 0.75
      } else if (p < 1.0) {
        opacity = ((1.0 - p) / 0.3) * 0.75
      }

      ribbonMeshes.forEach(({ material, ribbon }, idx) => {
        const mesh = meshRefs.current[idx]
        if (!mesh) return

        material.opacity = opacity

        // Slide the streak forward along the canyon curve
        // Progress offsets ribbon along the curve u: [0, 0.82]
        const ribbonU = Math.min(
          0.82,
          Math.max(0, (p * ribbon.speedMult * 0.85) + ribbon.offsetAngle)
        )
        const pos = canyonCurve.getPoint(ribbonU)
        const tangent = canyonCurve.getTangent(ribbonU)

        mesh.position.copy(pos)
        mesh.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), tangent)
      })

      if (p >= 1.0) {
        gustActiveRef.current = false
        gustProgressRef.current = 0
        ribbonMeshes.forEach(({ material }) => {
          material.opacity = 0
        })
      }
    }
  })

  return (
    <group ref={groupRef} name="wind-streaks">
      {ribbonMeshes.map(({ geometry, material }, idx) => (
        <mesh
          key={idx}
          ref={(el) => {
            meshRefs.current[idx] = el
          }}
          geometry={geometry}
          material={material}
          renderOrder={15}
        />
      ))}
    </group>
  )
}
