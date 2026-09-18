'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { PointLight, Vector3 } from 'three'
import { getSurfaceNormal } from '@/lib/sphereMath'

const FLICKER_MAX_HZ = 2.5 // safely under the 3Hz photosensitivity limit
const BASE_INTENSITY = 1.2
const FLICKER_VARIANCE = 0.4

export default function FlickerLight({
  position,
}: {
  position: [number, number, number]
}) {
  const lightRef = useRef<PointLight>(null)
  const phase = useRef(Math.random() * Math.PI * 2)

  // Offset point light 2.5m outward along the sphere surface normal
  const lightPos = useMemo(() => {
    const pos = new Vector3(...position)
    const normal = getSurfaceNormal(pos)
    return pos.add(normal.multiplyScalar(2.5)).toArray()
  }, [position])

  useFrame((state, delta) => {
    if (!lightRef.current) return
    phase.current += delta * FLICKER_MAX_HZ * Math.PI * 2

    // Layered sine waves at different frequencies reads as
    // "unstable bulb" rather than a clean, mechanical pulse
    const flicker =
      Math.sin(phase.current) * 0.6 +
      Math.sin(phase.current * 2.3) * 0.4

    lightRef.current.intensity =
      BASE_INTENSITY + flicker * FLICKER_VARIANCE
  })

  return (
    <pointLight
      ref={lightRef}
      position={lightPos}
      color="#F5F5F0"
      intensity={BASE_INTENSITY}
      distance={12}
      decay={2}
    />
  )
}