import { useRef, useCallback } from 'react'
import { Vector3 } from 'three'
import { PROP_LOCATIONS, PropLocation } from '@/lib/worldCoordinates'
import { INTERACTION_RADIUS } from '@/lib/constants'

interface UseNearbyPropsReturn {
  findNearestProp: (
    visitorPos: [number, number, number]
  ) => PropLocation | null
}

const _visitorVec = new Vector3()
const _propVec = new Vector3()

// Pure distance-check hook — no React state, called directly
// inside useFrame loops to avoid re-render thrashing.
export function useNearbyProps(): UseNearbyPropsReturn {
  const interactiveProps = useRef(
    PROP_LOCATIONS.filter((p) => p.interactive)
  )

  const findNearestProp = useCallback(
    (visitorPos: [number, number, number]): PropLocation | null => {
      _visitorVec.set(visitorPos[0], 0, visitorPos[2])

      let nearest: PropLocation | null = null
      let nearestDist = INTERACTION_RADIUS

      for (const prop of interactiveProps.current) {
        _propVec.set(prop.position[0], 0, prop.position[2])
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