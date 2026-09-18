import { Vector3, Quaternion } from 'three'

/**
 * Standard planet radius (in world units).
 * Diameter is 50m (circumference ~157m).
 */
export const PLANET_RADIUS = 25

/**
 * Converts polar/spherical angles into Cartesian coordinates on the planet surface.
 * @param theta Azimuth angle in radians [0, 2*PI) around the Y axis.
 * @param phi Polar inclination in radians [0, PI] from +Y (North pole = 0, Equator = PI/2, South pole = PI).
 * @param radius Radius of the sphere (defaults to PLANET_RADIUS).
 */
export function polarToCartesian(
  theta: number,
  phi: number,
  radius: number = PLANET_RADIUS
): Vector3 {
  const sinPhi = Math.sin(phi)
  const x = radius * sinPhi * Math.cos(theta)
  const y = radius * Math.cos(phi)
  const z = radius * sinPhi * Math.sin(theta)
  return new Vector3(x, y, z)
}

/**
 * Converts a 3D Cartesian position into polar spherical coordinates (theta, phi, radius).
 * @param pos Position vector.
 */
export function cartesianToPolar(pos: Vector3): {
  theta: number
  phi: number
  radius: number
} {
  const radius = pos.length()
  if (radius === 0) {
    return { theta: 0, phi: 0, radius: 0 }
  }

  // Clamped for float precision safety
  const clampedYRatio = Math.min(1, Math.max(-1, pos.y / radius))
  const phi = Math.acos(clampedYRatio)

  let theta = Math.atan2(pos.z, pos.x)
  if (theta < 0) {
    theta += Math.PI * 2
  }

  return { theta, phi, radius }
}

/**
 * Computes the normalized surface normal vector at any position on the sphere.
 * (Directly points outward from the origin [0,0,0]).
 */
export function getSurfaceNormal(pos: Vector3): Vector3 {
  const norm = pos.clone().normalize()
  // Guard against origin
  if (norm.lengthSq() === 0) {
    return new Vector3(0, 1, 0)
  }
  return norm
}

/**
 * Derives orthogonal forward and right tangent vectors aligned to the sphere's surface.
 * Useful for mapping camera directions and coordinate axes on the ground.
 */
export function getTangentBasis(normal: Vector3): {
  forward: Vector3
  right: Vector3
} {
  const upRef = Math.abs(normal.y) > 0.99 ? new Vector3(0, 0, 1) : new Vector3(0, 1, 0)
  const right = new Vector3().crossVectors(upRef, normal).normalize()
  const forward = new Vector3().crossVectors(normal, right).normalize()
  return { forward, right }
}

/**
 * Projects an arbitrary 3D vector onto the tangent plane perpendicular to the surface normal.
 * (Removes the radial/vertical component).
 */
export function projectOntoTangentPlane(vector: Vector3, normal: Vector3): Vector3 {
  const radialComponent = normal.clone().multiplyScalar(vector.dot(normal))
  return vector.clone().sub(radialComponent)
}

/**
 * Computes a Quaternion that aligns an object's local Y-up axis with the sphere's surface normal,
 * followed by a local heading rotation (yaw) around that normal.
 * @param pos Position on the sphere surface.
 * @param yaw Local heading angle in radians around the surface normal.
 */
export function alignToNormalQuaternion(pos: Vector3, yaw: number = 0): Quaternion {
  const normal = getSurfaceNormal(pos)
  const qAlign = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), normal)

  if (yaw !== 0) {
    const qYaw = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), yaw)
    qAlign.multiply(qYaw)
  }

  return qAlign
}

/**
 * Calculates the great-circle surface distance along the sphere arc between two points.
 * @param posA First position on or near the sphere surface.
 * @param posB Second position on or near the sphere surface.
 * @param radius Planet radius.
 */
export function surfaceDistance(
  posA: Vector3,
  posB: Vector3,
  radius: number = PLANET_RADIUS
): number {
  const normA = posA.clone().normalize()
  const normB = posB.clone().normalize()
  const angle = normA.angleTo(normB)
  return angle * radius
}

/**
 * Interpolates smoothly along the surface arc of the sphere between posA and posB.
 * @param posA Starting position.
 * @param posB Target position.
 * @param t Progress between 0 and 1.
 * @param radius Desired radius of the interpolated point.
 */
export function slerpOnSphere(
  posA: Vector3,
  posB: Vector3,
  t: number,
  radius: number = PLANET_RADIUS
): Vector3 {
  const normA = posA.clone().normalize()
  const normB = posB.clone().normalize()

  const qA = new Quaternion()
  const qB = new Quaternion().setFromUnitVectors(normA, normB)
  qA.slerp(qB, t)

  const resultNorm = normA.clone().applyQuaternion(qA)
  return resultNorm.multiplyScalar(radius)
}
