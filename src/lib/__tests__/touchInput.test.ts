import { stickFromOffset, STICK_DEADZONE, type StickReading } from '../touchInput'

function assertApprox(a: number, b: number, eps: number, message: string) {
  if (Math.abs(a - b) > eps) throw new Error(`Assertion failed: ${message} (got ${a}, expected ${b})`)
}
function assert(cond: boolean, message: string) {
  if (!cond) throw new Error(`Assertion failed: ${message}`)
}

console.log('--- Running virtual joystick tests ---')
const out: StickReading = { x: 0, y: 0, active: false }

stickFromOffset(0, 0, 50, out)
assert(!out.active && out.x === 0 && out.y === 0, 'a stick at rest reads zero')

stickFromOffset(50 * STICK_DEADZONE * 0.9, 0, 50, out)
assert(!out.active && out.x === 0, 'inside the dead zone reads zero')

stickFromOffset(0, -50, 50, out)
assert(out.active, 'pushing up is active')
assertApprox(out.y, 1, 1e-9, 'pushing the thumb up on screen is forward')
assertApprox(out.x, 0, 1e-9, 'straight up has no sideways part')

stickFromOffset(0, 50, 50, out)
assertApprox(out.y, -1, 1e-9, 'pulling the thumb down is backward')

stickFromOffset(50, 0, 50, out)
assertApprox(out.x, 1, 1e-9, 'pushing right is right')

stickFromOffset(-500, 0, 50, out)
assertApprox(out.x, -1, 1e-9, 'a thumb dragged past the rim clamps to full deflection')

stickFromOffset(35, -35, 50, out)
assertApprox(out.x, out.y, 1e-9, 'a diagonal push is an even diagonal')
assert(Math.hypot(out.x, out.y) <= 1 + 1e-9, 'never exceeds full deflection')

console.log('✓ All virtual joystick tests passed successfully!')
