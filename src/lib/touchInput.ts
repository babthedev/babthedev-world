/**
 * Virtual-joystick state, shared between the joystick UI and the visitor
 * controller. Mutable on purpose: it is written from pointer events and read
 * every frame in useFrame, so it must not go through React state.
 */
export const touchInput = {
  /** -1 (left) .. 1 (right) */
  x: 0,
  /** -1 (back) .. 1 (forward) */
  y: 0,
  /** A finger is on the stick and past the dead zone */
  active: false,
}

/** Fraction of the stick's travel that is ignored, so a resting thumb doesn't drift */
export const STICK_DEADZONE = 0.18

export interface StickReading {
  x: number
  y: number
  active: boolean
}

/**
 * Converts a thumb offset from the stick's centre (screen pixels, y down) into a
 * stick reading. The offset is clamped to `radius`; inside the dead zone the
 * reading is zero. Above it the direction is what matters: the visitor walks at
 * one speed, like the keyboard.
 */
export function stickFromOffset(dx: number, dy: number, radius: number, out: StickReading): StickReading {
  const len = Math.hypot(dx, dy)
  const mag = Math.min(1, len / radius)
  if (mag < STICK_DEADZONE || len === 0) {
    out.x = 0
    out.y = 0
    out.active = false
    return out
  }
  out.x = (dx / len) * mag
  out.y = (-dy / len) * mag
  out.active = true
  return out
}
