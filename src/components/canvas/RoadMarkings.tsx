'use client'

import { useMemo } from 'react'
import { MeshBasicMaterial, Quaternion } from 'three'
import { flatToSphere } from '@/lib/surfacePlacement'

/**
 * Conformal spherical road markings hovering at R + 0.015m with polygonOffset (Q133).
 * Renders dashed center-lines along the four cardinal avenue roads branching from the Hub.
 */
export default function RoadMarkings() {
  const dashes = useMemo(() => {
    const list: Array<{
      position: [number, number, number]
      quaternion: Quaternion
    }> = []

    // Spacing: every 4 units from radius 6 to 42 along North, South, East, West
    const distances = [6, 10, 14, 18, 22, 26, 30, 34, 38, 42]

    // North (Z negative)
    for (const d of distances) {
      list.push(flatToSphere(0, -d, 0.02))
    }
    // South (Z positive)
    for (const d of distances) {
      list.push(flatToSphere(0, d, 0.02))
    }
    // West (X negative)
    for (const d of distances) {
      list.push(flatToSphere(-d, 0, 0.02))
    }
    // East (X positive)
    for (const d of distances) {
      list.push(flatToSphere(d, 0, 0.02))
    }

    return list
  }, [])

  // Material with polygonOffset to guarantee zero z-fighting on curved ground
  const markingMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        color: '#D4D2C9',
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      }),
    []
  )

  return (
    <group>
      {dashes.map((dash, i) => (
        <mesh
          key={`dash-${i}`}
          position={dash.position}
          quaternion={dash.quaternion}
          material={markingMaterial}
        >
          <planeGeometry args={[0.3, 1.6]} />
        </mesh>
      ))}
    </group>
  )
}
