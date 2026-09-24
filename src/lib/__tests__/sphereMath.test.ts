import { Vector3 } from 'three'
import {
  PLANET_RADIUS,
  polarToCartesian,
  cartesianToPolar,
  getSurfaceNormal,
  getTangentBasis,
  projectOntoTangentPlane,
  alignToNormalQuaternion,
  surfaceDistance,
  slerpOnSphere,
} from '../sphereMath'

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`)
  }
}

function assertApprox(a: number, b: number, eps = 1e-4, message = '') {
  if (Math.abs(a - b) > eps) {
    throw new Error(
      `Assertion failed: expected ${a} to approximate ${b} (diff: ${Math.abs(
        a - b
      )} > ${eps}) ${message}`
    )
  }
}

function assertVectorApprox(vA: Vector3, vB: Vector3, eps = 1e-4, message = '') {
  assertApprox(vA.x, vB.x, eps, `${message} [X]`)
  assertApprox(vA.y, vB.y, eps, `${message} [Y]`)
  assertApprox(vA.z, vB.z, eps, `${message} [Z]`)
}

export function runSphereMathTests() {
  console.log('--- Running sphereMath test suite ---')

  // 1. polarToCartesian key coordinates
  {
    // North pole (phi = 0)
    const north = polarToCartesian(0, 0)
    assertVectorApprox(north, new Vector3(0, PLANET_RADIUS, 0), 1e-4, 'North pole')

    // South pole (phi = PI)
    const south = polarToCartesian(0, Math.PI)
    assertVectorApprox(south, new Vector3(0, -PLANET_RADIUS, 0), 1e-4, 'South pole')

    // Equator at +X (theta = 0, phi = PI/2)
    const eqX = polarToCartesian(0, Math.PI / 2)
    assertVectorApprox(eqX, new Vector3(PLANET_RADIUS, 0, 0), 1e-4, 'Equator +X')

    // Equator at +Z (theta = PI/2, phi = PI/2)
    const eqZ = polarToCartesian(Math.PI / 2, Math.PI / 2)
    assertVectorApprox(eqZ, new Vector3(0, 0, PLANET_RADIUS), 1e-4, 'Equator +Z')

    // Equator at -X (theta = PI, phi = PI/2)
    const eqNegX = polarToCartesian(Math.PI, Math.PI / 2)
    assertVectorApprox(eqNegX, new Vector3(-PLANET_RADIUS, 0, 0), 1e-4, 'Equator -X')
  }

  // 2. cartesianToPolar round-trip
  {
    const originalTheta = 1.25
    const originalPhi = 0.78
    const pos = polarToCartesian(originalTheta, originalPhi, PLANET_RADIUS)
    const polar = cartesianToPolar(pos)

    assertApprox(polar.theta, originalTheta, 1e-4, 'Round-trip theta')
    assertApprox(polar.phi, originalPhi, 1e-4, 'Round-trip phi')
    assertApprox(polar.radius, PLANET_RADIUS, 1e-4, 'Round-trip radius')
  }

  // 3. getSurfaceNormal
  {
    const pos = new Vector3(10, 20, -15)
    const normal = getSurfaceNormal(pos)
    assertApprox(normal.length(), 1.0, 1e-5, 'Normal length is 1.0')
    assertApprox(normal.dot(pos.clone().normalize()), 1.0, 1e-5, 'Normal aligns with position')
  }

  // 4. projectOntoTangentPlane
  {
    const normal = new Vector3(0, 1, 0)
    const testVec = new Vector3(3, 5, -4)
    const projected = projectOntoTangentPlane(testVec, normal)
    assertVectorApprox(projected, new Vector3(3, 0, -4), 1e-4, 'Project onto Y-normal tangent plane')
    assertApprox(projected.dot(normal), 0, 1e-5, 'Tangent projection is strictly orthogonal to normal')
  }

  // 5. getTangentBasis
  {
    const normal = new Vector3(1, 0, 0)
    const { forward, right } = getTangentBasis(normal)
    assertApprox(forward.length(), 1.0, 1e-5, 'Forward is unit length')
    assertApprox(right.length(), 1.0, 1e-5, 'Right is unit length')
    assertApprox(forward.dot(normal), 0, 1e-5, 'Forward orthogonal to normal')
    assertApprox(right.dot(normal), 0, 1e-5, 'Right orthogonal to normal')
    assertApprox(forward.dot(right), 0, 1e-5, 'Forward orthogonal to right')
  }

  // 5b. getTangentBasis is continuous across the Hub (north pole)
  {
    // Walk a 20m line straight through the pole in 5cm steps
    let prev = getTangentBasis(new Vector3(Math.sin(-0.4), Math.cos(-0.4), 0)).forward
    let worst = 1
    for (let a = -0.4; a <= 0.4; a += 0.002) {
      const f = getTangentBasis(new Vector3(Math.sin(a), Math.cos(a), 0)).forward
      worst = Math.min(worst, f.dot(prev))
      prev = f
    }
    assert(worst > 0.99, `Tangent frame does not jump when crossing the Hub (worst step dot ${worst.toFixed(3)})`)
  }

  // 6. alignToNormalQuaternion
  {
    const pos = new Vector3(0, PLANET_RADIUS, 0) // North pole
    const qNorth = alignToNormalQuaternion(pos, 0)
    const upNorth = new Vector3(0, 1, 0).applyQuaternion(qNorth)
    assertVectorApprox(upNorth, new Vector3(0, 1, 0), 1e-4, 'Aligned Y-up at North pole')

    const posEq = new Vector3(PLANET_RADIUS, 0, 0) // Equator +X
    const qEq = alignToNormalQuaternion(posEq, 0)
    const upEq = new Vector3(0, 1, 0).applyQuaternion(qEq)
    assertVectorApprox(upEq, new Vector3(1, 0, 0), 1e-4, 'Aligned Y-up at Equator +X')
  }

  // 7. surfaceDistance
  {
    // Quarter circumference
    const posA = new Vector3(PLANET_RADIUS, 0, 0)
    const posB = new Vector3(0, PLANET_RADIUS, 0)
    const dist = surfaceDistance(posA, posB, PLANET_RADIUS)
    const expectedDist = (Math.PI / 2) * PLANET_RADIUS
    assertApprox(dist, expectedDist, 1e-4, 'Quarter circumference distance')

    // Opposite poles (half circumference)
    const southPole = new Vector3(0, -PLANET_RADIUS, 0)
    const halfDist = surfaceDistance(posB, southPole, PLANET_RADIUS)
    assertApprox(halfDist, Math.PI * PLANET_RADIUS, 1e-4, 'Half circumference distance')
  }

  // 8. slerpOnSphere
  {
    const start = new Vector3(PLANET_RADIUS, 0, 0)
    const end = new Vector3(0, PLANET_RADIUS, 0)
    const mid = slerpOnSphere(start, end, 0.5, PLANET_RADIUS)

    assertApprox(mid.length(), PLANET_RADIUS, 1e-4, 'Midpoint radius matches PLANET_RADIUS')
    const expectedCoord = (PLANET_RADIUS * Math.SQRT2) / 2
    assertVectorApprox(mid, new Vector3(expectedCoord, expectedCoord, 0), 1e-3, 'Midpoint 45-degree coordinates')
  }

  console.log('✓ All 8 sphereMath test suites passed successfully!')
  return true
}

// Self-run when executed directly via node/tsx
if (typeof require !== 'undefined' && require.main === module) {
  runSphereMathTests()
}
