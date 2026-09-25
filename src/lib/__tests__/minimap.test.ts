import { Vector3 } from 'three'
import { PLANET_RADIUS } from '../constants'
import { getSurfaceNormal, getTangentBasis, settleFacing } from '../sphereMath'
import { projectToMap, angleOnMap, type MapPoint } from '../minimap'

function assertApprox(a: number, b: number, eps: number, message: string) {
  if (Math.abs(a - b) > eps) throw new Error(`Assertion failed: ${message} (got ${a}, expected ${b})`)
}

console.log('--- Running minimap projection tests ---')

const R = PLANET_RADIUS
const p = new Vector3(0.3, 0.8, 0.5).normalize()
const { forward, right } = getTangentBasis(getSurfaceNormal(p))
const out: MapPoint = { x: 0, y: 0, dist: 0 }

/** Unit direction reached by walking `metres` from p along tangent `dir`. */
const walk = (dir: Vector3, metres: number) => {
  const a = metres / R
  return p.clone().multiplyScalar(Math.cos(a)).addScaledVector(dir, Math.sin(a)).normalize()
}

// The centre maps to the origin
projectToMap(p, forward, p, out)
assertApprox(out.x, 0, 1e-6, 'centre x')
assertApprox(out.y, 0, 1e-6, 'centre y')

// Straight ahead lands straight up, at its true surface distance
projectToMap(p, forward, walk(forward, 12), out)
assertApprox(out.x, 0, 1e-4, 'ahead has no sideways offset')
assertApprox(out.y, 12, 1e-4, 'ahead is 12m up the map')
assertApprox(out.dist, 12, 1e-4, 'ahead distance')

// Behind is straight down
projectToMap(p, forward, walk(forward, -7), out)
assertApprox(out.y, -7, 1e-4, 'behind is 7m down the map')

// To the right of the heading is right on the map (same handedness as the camera)
projectToMap(p, forward, walk(right, 9), out)
assertApprox(out.x, 9, 1e-4, 'the camera-right side is map-right')
assertApprox(out.y, 0, 1e-4, 'and no ahead component')

// Rotating the heading rotates the map: with the heading turned to face `right`,
// the old forward direction is now to the LEFT of up
projectToMap(p, right.clone(), walk(forward, 10), out)
assertApprox(out.x, -10, 1e-4, 'old forward is map-left when heading turns right')
assertApprox(out.y, 0, 1e-4, 'old forward has no ahead component then')

// Distances are true arc lengths far from the centre too (no flat-map distortion)
projectToMap(p, forward, walk(forward.clone().add(right).normalize(), 25), out)
assertApprox(Math.hypot(out.x, out.y), 25, 1e-4, '25m along a diagonal stays 25m from the centre')

// Facing angle: straight ahead is 0, right is +90deg, and it follows the heading
assertApprox(angleOnMap(p, forward, forward), 0, 1e-6, 'facing ahead')
assertApprox(angleOnMap(p, forward, right), Math.PI / 2, 1e-6, 'facing right')
const turned = right.clone()
settleFacing(getSurfaceNormal(p), turned)
assertApprox(angleOnMap(p, turned, forward), -Math.PI / 2, 1e-6, 'old forward is to the left of a right-turned heading')

console.log('✓ All minimap projection tests passed successfully!')
