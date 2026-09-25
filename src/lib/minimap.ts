import { Vector3 } from 'three'
import { PLANET_RADIUS } from './constants'

/**
 * Minimap projection. The world is a small sphere, so a flat top-down map would
 * lie about distances. Instead the map is azimuthal-equidistant, centred on the
 * visitor: a point `d` metres away along the surface lands `d` metres from the
 * centre, in the direction you would walk to reach it. "Up" on the map is the
 * heading the camera looks along, so what is ahead of you on screen is ahead of
 * you on the map.
 */

const _dir = new Vector3()
const _right = new Vector3()

export interface MapPoint {
  /** Metres to the right of the heading, on the map plane */
  x: number
  /** Metres ahead of the heading, on the map plane */
  y: number
  /** Surface distance from the centre, in metres */
  dist: number
}

/**
 * Projects unit direction `q` onto the map centred at unit direction `p` with
 * `heading` (a unit tangent at p) pointing up. Writes into `out` and returns it.
 */
export function projectToMap(p: Vector3, heading: Vector3, q: Vector3, out: MapPoint): MapPoint {
  const cos = Math.min(1, Math.max(-1, p.dot(q)))
  const theta = Math.acos(cos)
  _dir.copy(q).addScaledVector(p, -cos)
  const len = _dir.length()
  if (len < 1e-7) {
    out.x = 0
    out.y = 0
    out.dist = theta * PLANET_RADIUS
    return out
  }
  _dir.multiplyScalar(1 / len)
  // right = heading × up, the same handedness the camera and controls use
  _right.crossVectors(heading, p)
  const d = theta * PLANET_RADIUS
  out.x = d * _dir.dot(_right)
  out.y = d * _dir.dot(heading)
  out.dist = d
  return out
}

/** Angle (radians, clockwise from map-up) of tangent `dir` on a map whose up is `heading`, at p. */
export function angleOnMap(p: Vector3, heading: Vector3, dir: Vector3): number {
  _right.crossVectors(heading, p)
  return Math.atan2(dir.dot(_right), dir.dot(heading))
}
