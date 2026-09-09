'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { InstancedMesh, Object3D, MeshToonMaterial } from 'three'
import { INK_COLOR } from '@/lib/constants'

const CRANE_COUNT = 5
const FLIGHT_HEIGHT = 40
const FLIGHT_SPEED = 0.6
const SINE_AMPLITUDE = 3

const _dummy = new Object3D()

export default function PaperCranes() {
  const meshRef = useRef<InstancedMesh>(null)

  // Each crane gets a random phase offset and starting X so they
  // don't all move in a single visible line
  const cranes = useMemo(
    () =>
      Array.from({ length: CRANE_COUNT }, (_, i) => ({
        phaseOffset: Math.random() * Math.PI * 2,
        zOffset: (Math.random() - 0.5) * 60,
        startX: -150 - i * 40,
      })),
    []
  )

  const material = useMemo(
    () => new MeshToonMaterial({ color: INK_COLOR }),
    []
  )

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.getElapsedTime()

    cranes.forEach((crane, i) => {
      // Loop across X, wrapping back off-screen once past the far edge
      const x =
        ((crane.startX + t * FLIGHT_SPEED * 10) % 300) - 150
      const y =
        FLIGHT_HEIGHT +
        Math.sin(t * 0.3 + crane.phaseOffset) * SINE_AMPLITUDE
      const z = crane.zOffset

      _dummy.position.set(x, y, z)
      _dummy.rotation.y = Math.PI / 2
      // Simple wing-flap suggestion via Z-scale pulse rather than
      // a separate rig — cheap, reads fine at this distance
      _dummy.scale.set(
        1,
        1,
        0.6 + Math.abs(Math.sin(t * 6 + crane.phaseOffset)) * 0.4
      )
      _dummy.updateMatrix()
      meshRef.current!.setMatrixAt(i, _dummy.matrix)
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
      {/* Simple flattened diamond — reads as a paper crane silhouette
          at flight altitude without needing actual bird geometry */}
      <coneGeometry args={[1, 2, 4]} />
    </instancedMesh>
  )
}