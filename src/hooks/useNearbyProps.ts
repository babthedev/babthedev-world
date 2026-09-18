import { useRef, useCallback } from 'react'
import { Vector3 } from 'three'
import { PROP_LOCATIONS, PropLocation } from '@/lib/worldCoordinates'
import { INTERACTION_RADIUS } from '@/lib/constants'
import { mapToSphere } from '@/lib/surfacePlacement'

interface UseNearbyPropsReturn {
  findNearestProp: (
    visitorPos: [number, number, number]
  ) => PropLocation | null
}

interface SphereInteractiveProp extends PropLocation {
  spherePosition: [number, number, number]
}

// Pre-compute 3D sphere positions for all interactive props
const SPHERE_INTERACTIVE_PROPS: SphereInteractiveProp[] = mapToSphere(
  PROP_LOCATIONS.filter((p) => p.interactive).map((p) => ({
    ...p,
    rotation: p.rotation ?? [0, 0, 0],
  }))
).map((p) => ({
  ...p,
  spherePosition: p.position,
}))

const _visitorVec = new Vector3()
const _propVec = new Vector3()

// Pure distance-check hook using 3D Euclidean distance on the sphere surface
export function useNearbyProps(): UseNearbyPropsReturn {
  const interactiveProps = useRef(SPHERE_INTERACTIVE_PROPS)

  const findNearestProp = useCallback(
    (visitorPos: [number, number, number]): PropLocation | null => {
      _visitorVec.set(visitorPos[0], visitorPos[1], visitorPos[2])

      let nearest: PropLocation | null = null
      let nearestDist = INTERACTION_RADIUS

      for (const prop of interactiveProps.current) {
        _propVec.set(
          prop.spherePosition[0],
          prop.spherePosition[1],
          prop.spherePosition[2]
        )
        const dist = _visitorVec.distanceTo(_propVec)
        if (dist < nearestDist) {
          nearestDist = dist
          nearest = prop
        }
      }

      return nearest
    },
    []
  )

  return { findNearestProp }
}