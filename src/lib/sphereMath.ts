import { Vector3, Quaternion, Matrix4 } from 'three'

/**
 * Standard planet radius (in world units).
 * Diameter is 50m (circumference ~157m).
 */
export const PLANET_RADIUS = 25

/**
 * Reference axis for the global tangent frame (see getTangentBasis).
 * Polar 0.8 rad, azimuth 45°: ~20m from the Hub, mid-block between the
 * east and Oryzon streets. Its antipode lies in the southern backfill.
 */
const FRAME_POLE = new Vector3(Math.sin(0.8) * Math.SQRT1_2, Math.cos(0.8), Math.sin(0.8) * Math.SQRT1_2)
const FRAME_POLE_FALLBACK = new Vector3(0, 1, 0)

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
  // Every tangent frame on a sphere has a singular point (hairy-ball
  // theorem). The old frame used world +Y, whose singularity sat exactly
  // on the Hub at the north pole, so camera and controls snapped there.
  // FRAME_POLE parks both singular points inside unwalkable building
  // blocks (between the east and Oryzon streets, and its antipode).
  const upRef = Math.abs(normal.dot(FRAME_POLE)) > 0.999 ? FRAME_POLE_FALLBACK : FRAME_POLE
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

const _fx = new Vector3()
const _tc = new Vector3()
const _fz = new Vector3()
const _fm = new Matrix4()

/**
 * Makes `facing` a unit vector lying in the tangent plane at `normal` (in place).
 * Re-projecting a fixed world vector onto successive tangent planes carries it
 * along a great circle exactly (the vector stays along the direction of travel),
 * which is why facing is stored as a vector rather than as an angle: an angle
 * is only meaningful relative to a reference frame, and every frame on a sphere
 * rotates against a straight path.
 */
export function settleFacing(normal: Vector3, facing: Vector3): Vector3 {
  facing.addScaledVector(normal, -facing.dot(normal))
  if (facing.lengthSq() < 1e-8) facing.copy(getTangentBasis(normal).forward)
  return facing.normalize()
}

/**
 * Rotates `current` about `normal` toward `target` by at most `maxRad`
 * (in place, shortest way round). Both should already be tangent to the surface.
 */
export function turnToward(current: Vector3, target: Vector3, normal: Vector3, maxRad: number): Vector3 {
  const angle = Math.atan2(normal.dot(_tc.crossVectors(current, target)), current.dot(target))
  return current.applyAxisAngle(normal, Math.sign(angle) * Math.min(Math.abs(angle), maxRad))
}

/**
 * Orients an object so local +Y is the surface normal and local +Z points along
 * `facing` (re-projected onto the tangent plane first). Uses the same
 * y × z convention as the street generator's basis, so a character's model and
 * its movement direction can never disagree.
 */
export function orientFromFacing(normal: Vector3, facing: Vector3, out: Quaternion): Quaternion {
  _fz.copy(facing)
  settleFacing(normal, _fz)
  _fx.crossVectors(normal, _fz)
  _fm.makeBasis(_fx, normal, _fz)
  return out.setFromRotationMatrix(_fm)
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
