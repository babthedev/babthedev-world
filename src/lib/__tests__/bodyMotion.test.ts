import { stepSpring, leanTargets, stepBodyMotion, bodyMotion, squashScale, PITCH_MAX, ROLL_MAX } from '../bodyMotion'

function assert(cond: boolean, message: string) {
  if (!cond) throw new Error(`Assertion failed: ${message}`)
}
function assertApprox(a: number, b: number, eps: number, message: string) {
  if (Math.abs(a - b) > eps) throw new Error(`Assertion failed: ${message} (got ${a}, expected ${b})`)
}

console.log('--- Running body motion tests ---')

// A spring settles on its target...
{
  const s = { x: 0, v: 0 }
  for (let i = 0; i < 240; i++) stepSpring(s, 1, 1 / 60)
  assertApprox(s.x, 1, 1e-3, 'spring settles on target')
  assertApprox(s.v, 0, 1e-3, 'and comes to rest')
}
// ...but not instantly: an underdamped step overshoots, which is the "weight"
{
  const s = { x: 0, v: 0 }
  let peak = 0
  for (let i = 0; i < 120; i++) {
    stepSpring(s, 1, 1 / 60, 70, 9)
    peak = Math.max(peak, s.x)
  }
  assert(peak > 1.02, `a lean spring overshoots its target a little (peak ${peak})`)
  assert(peak < 1.5, 'but only a little')
}
// Stable even at the largest frame step the game allows (dt is clamped to 0.05)
{
  const s = { x: 0, v: 0 }
  for (let i = 0; i < 400; i++) stepSpring(s, 1, 0.05, 110, 10)
  assert(Number.isFinite(s.x) && Math.abs(s.x - 1) < 1e-2, 'stable at dt = 0.05')
}

// Lean directions
{
  const fwd = leanTargets(3, 0, 0, 3)
  assertApprox(fwd.pitch, PITCH_MAX, 1e-9, 'full speed forward leans forward by the maximum')
  assertApprox(fwd.roll, 0, 1e-9, 'straight ahead does not roll')
  assert(leanTargets(-3, 0, 0, 3).pitch < 0, 'backing up leans back')
  assert(leanTargets(3, 0, 4, 3).roll < 0, 'turning left leans the top to the left (negative roll)')
  assert(leanTargets(3, 0, -4, 3).roll > 0, 'turning right leans the top to the right')
  assert(leanTargets(0, 3, 0, 3).roll > 0, 'stepping right leans right')
  assert(leanTargets(30, 0, 40, 3).pitch <= PITCH_MAX && Math.abs(leanTargets(30, 0, 40, 3).roll) <= ROLL_MAX + 0.04, 'extreme input is clamped')
}

// Stepping through a start and a stop dips the body, then it recovers to rest
{
  let lowest = 0
  bodyMotion.squash.x = 0
  bodyMotion.squash.v = 0
  bodyMotion.moving = false
  for (let i = 0; i < 90; i++) {
    stepBodyMotion(1 / 60, 3, 0, 0, 3) // start walking
    lowest = Math.min(lowest, bodyMotion.squash.x)
  }
  assert(lowest < -0.005, `starting to walk dips the body (${lowest})`)
  for (let i = 0; i < 90; i++) stepBodyMotion(1 / 60, 0, 0, 0, 3) // stop
  for (let i = 0; i < 240; i++) stepBodyMotion(1 / 60, 0, 0, 0, 3)
  assertApprox(bodyMotion.squash.x, 0, 1e-3, 'the body returns to full height')
  assertApprox(bodyMotion.pitch.x, 0, 1e-3, 'and stands upright')
}

// Squash preserves volume roughly and is clamped
{
  const s = squashScale(-0.08)
  assert(s.y < 1 && s.x > 1, 'squashing makes the body shorter and wider')
  assertApprox(s.x * s.z * s.y, 1, 0.02, 'volume is roughly preserved')
  assert(squashScale(-5).y >= 0.88, 'squash is clamped')
}

console.log('✓ All body motion tests passed successfully!')
