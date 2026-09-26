import { Vector3 } from 'three'

/**
 * State shared between the visitor and the camera, read and written every
 * frame inside useFrame (so it is deliberately a mutable object, not React state).
 *
 * Movement input is relative to `heading`, NOT to the camera's actual view
 * vector. The camera adds its own offsets on top of the heading (dialogue orbit,
 * look-ahead, pitch); if movement followed the view vector, every such offset
 * would steer the character, which then turns the camera, and so on: a spiral.
 */
export const cameraRig = {
  /** World-space unit tangent the camera looks along, before any orbit offsets. */
  heading: new Vector3(0, 0, 1),
  /** How fast (1/s) the heading turns toward the visitor's facing this frame. Set by the visitor. */
  followRate: 0,
  /** 0..1: how fast the visitor is moving, as a fraction of walking speed. Drives the FOV kick. */
  speed: 0,
  /** Frames left in which the camera jumps straight to its target instead of easing (a teleport or map jump). */
  snapFrames: 0,
}
