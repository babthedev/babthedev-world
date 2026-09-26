/**
 * Secondary motion for the visitor: the weight and give that make a walk feel
 * physical rather than slid along. Springs chase targets, so a sudden start,
 * stop or turn overshoots and settles instead of snapping.
 *
 *   pitch   lean forward while moving (radians about local X, + is forward)
 *   roll    lean into turns and sideways steps (about local Z, + is top to the right)
 *   squash  brief compress-and-rebound on start, stop, landing and interaction
 */

export interface Spring {
  x: number
  v: number
}

const spring = (): Spring => ({ x: 0, v: 0 })

/** Semi-implicit Euler. Stable for dt * sqrt(stiffness) < 2, i.e. dt <= 0.05 at stiffness 90. */
export function stepSpring(s: Spring, target: number, dt: number, stiffness = 90, damping = 12): Spring {
  s.v += (stiffness * (target - s.x) - damping * s.v) * dt
  s.x += s.v * dt
  return s
}

export const PITCH_MAX = 0.07 // ~4 degrees
export const ROLL_MAX = 0.1 // ~6 degrees
const TURN_RATE_FULL = 4 // rad/s of turning that gives full roll
const STRAFE_ROLL = 0.04

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/**
 * Where the body wants to lean, from how it is moving.
 * @param vf speed along the facing (m/s, + forward)
 * @param vr speed to the right of the facing (m/s)
 * @param yawRateLeft turning rate, + when turning left (counter-clockwise seen from above)
 * @param maxSpeed the speed that counts as full
 */
export function leanTargets(vf: number, vr: number, yawRateLeft: number, maxSpeed: number) {
  const pitch = clamp(vf / maxSpeed, -1, 1) * PITCH_MAX
  const roll =
    clamp(-yawRateLeft / TURN_RATE_FULL, -1, 1) * ROLL_MAX + clamp(vr / maxSpeed, -1, 1) * STRAFE_ROLL
  return { pitch, roll }
}

export const bodyMotion = {
  pitch: spring(),
  roll: spring(),
  squash: spring(),
  moving: false,
  /** A compress-and-rebound. `amount` is roughly the depth of the squash as a fraction of height, times 10. */
  kick(amount: number) {
    bodyMotion.squash.v -= amount
  },
}

const MOVING_ABOVE = 0.4 // m/s

/** Advance every spring one frame. */
export function stepBodyMotion(dt: number, vf: number, vr: number, yawRateLeft: number, maxSpeed: number) {
  const b = bodyMotion
  const t = leanTargets(vf, vr, yawRateLeft, maxSpeed)
  stepSpring(b.pitch, t.pitch, dt, 70, 9)
  stepSpring(b.roll, t.roll, dt, 70, 9)

  const moving = Math.hypot(vf, vr) > MOVING_ABOVE
  if (moving !== b.moving) {
    b.moving = moving
    b.kick(0.32) // a dip as the stride starts or the body settles
  }
  stepSpring(b.squash, 0, dt, 110, 10)
}

/** Scale to apply to the body for the current squash (volume roughly preserved). */
export function squashScale(squash: number) {
  const y = 1 + clamp(squash, -0.12, 0.12)
  const xz = 1 - (y - 1) * 0.5
  return { x: xz, y, z: xz }
}

// Dev-only window hook so tests can watch the springs
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  ;(window as unknown as Record<string, unknown>).__BODY__ = bodyMotion
}
