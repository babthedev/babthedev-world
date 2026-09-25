import { MathUtils, Quaternion, Vector3 } from 'three'

// ============================================================
// OPENING HANDSHAKE
//
// While the intro dialogue plays, Abdulrahman and the visitor turn to face each
// other and shake hands; the tour starts when they let go.
//
// State lives in a plain mutable object (like cameraRig) because it is read and
// written every frame by the director, both controllers, the camera and the
// character rig. The arm pose comes from a small two-bone IK solve, so both
// hands reach the same point between the characters and actually meet.
// ============================================================

/** Seconds. Turn → reach → clasp and pump → release. */
export const GREETING_TIMELINE = {
  reachStart: 0.45,
  reachEnd: 1.0,
  pumpStart: 1.1,
  pumpEnd: 2.3,
  releaseStart: 2.45,
  releaseEnd: 3.0,
  total: 3.1,
  pumps: 3,
  pumpAmplitude: 0.035, // metres
  handDrop: 0.2, // the clasp sits this far below the shoulders
} as const

export const greeting = {
  /** The handshake is in progress: characters hold still and face each other. */
  active: false,
  /** Finished (or skipped); never runs again this session. */
  done: false,
  t: 0,
  /** 0..1: how far the right arm is into the handshake pose. */
  weight: 0,
  /** Vertical hand offset in metres (the pumping). */
  pump: 0,
  /** Set by each character once its model has loaded. */
  ready: { visitor: false, abdulrahman: false },
  /** World position of each character's right shoulder, published every frame while shaking. The hands meet halfway between them, so the clasp uses the real proportions of both models. */
  shoulder: { visitor: new Vector3(), abdulrahman: new Vector3() },
}

/** Skip the handshake entirely (dev tools, tests, reduced motion). */
export function skipGreeting() {
  greeting.active = false
  greeting.done = true
  greeting.weight = 0
  greeting.pump = 0
}

const smooth = (a: number, b: number, t: number) => MathUtils.smoothstep(t, a, b)

/** Advance the timeline; returns true while the handshake is still running. */
export function stepGreeting(dt: number): boolean {
  const T = GREETING_TIMELINE
  greeting.t += dt
  const t = greeting.t
  const reach = smooth(T.reachStart, T.reachEnd, t)
  const release = smooth(T.releaseStart, T.releaseEnd, t)
  greeting.weight = reach * (1 - release)
  // pumping only while the hands are clasped, eased in and out
  const pumpEnvelope = smooth(T.pumpStart, T.pumpStart + 0.15, t) * (1 - smooth(T.pumpEnd - 0.15, T.pumpEnd, t))
  const phase = ((t - T.pumpStart) / (T.pumpEnd - T.pumpStart)) * T.pumps * Math.PI * 2
  greeting.pump = Math.sin(phase) * T.pumpAmplitude * pumpEnvelope
  if (t >= T.total) {
    greeting.active = false
    greeting.done = true
    greeting.weight = 0
    greeting.pump = 0
    return false
  }
  return true
}

// ── two-bone IK for the right arm ────────────────────────
// Bone rest direction: in the normalised VRM rig the right arm points along -X.
const REST = new Vector3(-1, 0, 0)
const _dir = new Vector3()
const _pole = new Vector3()
const _dU = new Vector3()
const _elbow = new Vector3()
const _dF = new Vector3()
const _qInv = new Quaternion()

/**
 * Solves the right arm so the hand reaches `target` (relative to the shoulder,
 * in the character's frame). `a` and `b` are the upper- and forearm lengths.
 * Writes the local rotations for the upper arm and forearm.
 */
export function solveRightArm(a: number, b: number, target: Vector3, outUpper: Quaternion, outLower: Quaternion) {
  const reachable = (a + b) * 0.985
  const c = Math.min(target.length(), reachable)
  _dir.copy(target).normalize()

  // Law of cosines: angle at the shoulder between the upper arm and the target line
  const cosAlpha = MathUtils.clamp((a * a + c * c - b * b) / (2 * a * c), -1, 1)
  const alpha = Math.acos(cosAlpha)

  // The elbow swings out and down, away from the body
  _pole.set(-0.35, -1, -0.25)
  _pole.addScaledVector(_dir, -_pole.dot(_dir)).normalize()

  _dU.copy(_dir).multiplyScalar(Math.cos(alpha)).addScaledVector(_pole, Math.sin(alpha)).normalize()
  _elbow.copy(_dU).multiplyScalar(a)
  _dF.copy(_dir).multiplyScalar(c).sub(_elbow).normalize()

  outUpper.setFromUnitVectors(REST, _dU)
  // the forearm's local frame is the upper arm's, so express its direction there
  _dF.applyQuaternion(_qInv.copy(outUpper).invert())
  outLower.setFromUnitVectors(REST, _dF)
}
