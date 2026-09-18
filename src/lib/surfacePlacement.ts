import { Vector3, Euler, Quaternion } from 'three'
import { PLANET_RADIUS } from './constants'
import { polarToCartesian, getSurfaceNormal, getTangentBasis } from './sphereMath'

/**
 * Maps a flat-world XZ position onto the sphere surface.
 *
 * The mapping treats the original flat coordinates as an azimuthal equidistant
 * projection: the distance from the origin in XZ becomes an arc length on the
 * sphere, and the angle in XZ becomes the azimuth.
 *
 * Returns the Cartesian position on (or above) the sphere surface plus
 * a Euler rotation that aligns the object's Y-up to the surface normal
 * with the original yaw preserved.
 *
 * @param flatX Original flat-world X coordinate.
 * @param flatZ Original flat-world Z coordinate.
 * @param flatY Height above the surface (default 0 = on surface).
 * @param yaw   Original Y rotation in radians (default 0).
 */
export function flatToSphere(
  flatX: number,
  flatZ: number,
  flatY: number = 0,
  yaw: number = 0
): {
  position: [number, number, number]
  rotation: [number, number, number]
  quaternion: Quaternion
} {
  // Distance from origin in flat XZ space
  const flatDist = Math.sqrt(flatX * flatX + flatZ * flatZ)

  // Azimuth angle from flat coordinates (atan2 gives angle in XZ plane)
  const azimuth = Math.atan2(flatZ, flatX)

  // Convert flat distance to arc angle on the sphere:
  // arc length = flatDist, so angle = arcLength / radius
  const arcAngle = flatDist / PLANET_RADIUS

  // Clamp to hemisphere (don't wrap past south pole)
  const phi = Math.min(arcAngle, Math.PI)

  // Convert to spherical: theta is azimuth, phi is inclination from north pole
  const surfacePos = polarToCartesian(azimuth, phi, PLANET_RADIUS)

  // If there's a height offset (e.g. for objects slightly above surface),
  // push outward along the surface normal
  if (flatY > 0) {
    const normal = getSurfaceNormal(surfacePos)
    surfacePos.add(normal.multiplyScalar(flatY))
  }

  // Compute rotation: align object Y-up to surface normal,
  // then apply the original yaw around the normal
  const normal = getSurfaceNormal(surfacePos)
  const upRef = new Vector3(0, 1, 0)
  const qAlign = new Quaternion().setFromUnitVectors(upRef, normal)

  // Apply yaw around the surface normal
  if (yaw !== 0) {
    const qYaw = new Quaternion().setFromAxisAngle(normal, yaw)
    qAlign.premultiply(qYaw)
  }

  // Convert quaternion to Euler for the position/rotation tuple format
  const euler = new Euler().setFromQuaternion(qAlign)

  return {
    position: [surfacePos.x, surfacePos.y, surfacePos.z],
    rotation: [euler.x, euler.y, euler.z],
    quaternion: qAlign,
  }
}

/**
 * Helper to map an array of flat-world positioned objects onto the sphere.
 * Works with any object type that has `position` and optional `rotation`.
 */
export function mapToSphere<
  T extends {
    position: [number, number, number]
    rotation?: [number, number, number]
  }
>(items: T[]): T[] {
  return items.map((item) => {
    const yaw = item.rotation?.[1] ?? 0
    const { position, rotation } = flatToSphere(
      item.position[0],
      item.position[2],
      item.position[1], // Y becomes height above surface
      yaw
    )
    return {
      ...item,
      position,
      rotation,
    }
  })
}

/**
 * Maps a single spawn point (flat XZ, Y=height) onto the sphere surface.
 * Adds capsule height above the surface so characters don't clip into the ground.
 */
export function mapSpawnToSphere(
  flatSpawn: [number, number, number],
  heightAboveSurface: number = 1
): [number, number, number] {
  const { position } = flatToSphere(
    flatSpawn[0],
    flatSpawn[2],
    heightAboveSurface
  )
  return position
}
