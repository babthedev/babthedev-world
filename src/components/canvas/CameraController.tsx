'use client'

import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Vector3, MathUtils, Raycaster, Mesh, PerspectiveCamera } from 'three'
import { useWorldStore } from '@/store/useWorldStore'
import {
  CAMERA_HEIGHT,
  CAMERA_BACK,
  CAMERA_LERP,
  CAMERA_FOV,
  CAMERA_FOV_KICK,
  CAMERA_PITCH_MIN,
  CAMERA_PITCH_MAX,
  CAMERA_IMPULSE,
  CAMERA_LOOK_HEIGHT,
  CAMERA_LOOK_AHEAD,
  CAMERA_DIALOGUE_PULL,
  CAMERA_READING_PAN,
} from '@/lib/constants'
import { getSurfaceNormal, getTangentBasis, settleFacing } from '@/lib/sphereMath'
import { cameraRig } from '@/lib/cameraRig'
import { greeting } from '@/lib/greeting'

// Opening two-shot: a level, close camera on the pair. The look point sits below the
// pair so they land above the intro dialogue panel instead of behind it.
const GREET_DIST = 3.4
const GREET_CAM_HEIGHT = 0.9
const GREET_LOOK_HEIGHT = 0.2

// Pre-allocated vectors — avoids GC pressure inside useFrame
const _desired = new Vector3()
const _lookAt = new Vector3()
const _posVec = new Vector3()
const _normal = new Vector3()
const _behindDir = new Vector3()
const _rightScaled = new Vector3()
const _panShift = new Vector3()
const _camRayDir = new Vector3()
const _facingTarget = new Vector3()
const _facingCross = new Vector3()
const _greetSep = new Vector3()

export default function CameraController() {
  const visitorPos = useWorldStore((state) => state.position)
  const guidePos = useWorldStore((state) => state.abdulrahmanPosition)
  const facingDir = useWorldStore((state) => state.facingDir)
  const isReading = useWorldStore((state) => state.isReading)
  const currentDialogue = useWorldStore((state) => state.currentDialogue)
  const npcDialogue = useWorldStore((state) => state.npcDialogue)
  const freeFlyMode = useWorldStore((state) => state.freeFlyMode)
  const districtLabelVisible = useWorldStore((state) => state.districtLabelVisible)

  const isDialogueActive = currentDialogue !== null || npcDialogue !== null

  // Camera tracks its OWN smoothed angle — not the character's live angle.
  // This creates the "camera lags slightly behind the turn" feel
  // that messenger.abeto.co has.
  // The heading lives in cameraRig (shared with the visitor) as a world-space
  // tangent VECTOR: unlike an angle in a fixed reference frame it stays
  // consistent as the visitor walks a great circle.
  const dialogueGlide = useRef(0)
  const arrivalElevation = useRef(0)
  const greetBlend = useRef(0) // 0..1: tight two-shot for the opening handshake

  // Q142: Pitch angle tracking (vertical orbit offset relative to tangent plane)
  const pitchAngle = useRef(0)

  // Q145: Micro-camera impulse — 0.03m directional punch on prop/panel interactions
  const cameraImpulse = useWorldStore((state) => state.cameraImpulse)
  const lastImpulse = useRef(0)
  const impulseOffset = useRef(0)

  const raycaster = useRef(new Raycaster())
  const { scene } = useThree()

  useFrame((state, delta) => {
    if (freeFlyMode) return

    // Bound delta to 0.05s to prevent explosive camera launches during frame hiccups
    const dt = Math.min(delta, 0.05)

    const [vx, vy, vz] = visitorPos
    _posVec.set(vx, vy, vz)

    // ── SURFACE-RELATIVE CAMERA ───────────────────────────
    // On a sphere, "up" is the surface normal at the character's
    // position, not the global Y axis. The camera orbits behind
    // the character in the tangent plane.
    _normal.copy(getSurfaceNormal(_posVec))
    const { forward: tangentForward, right: tangentRight } = getTangentBasis(_normal)

    // Rotate the smoothed heading toward the target heading about the surface
    // normal, along the shortest arc (so crossing ±π can't spin the camera 360°)
    _facingTarget.set(facingDir[0], facingDir[1], facingDir[2])
    settleFacing(_normal, _facingTarget)
    settleFacing(_normal, cameraRig.heading)
    const headingError = Math.atan2(
      _normal.dot(_facingCross.crossVectors(cameraRig.heading, _facingTarget)),
      cameraRig.heading.dot(_facingTarget)
    )
    // Follow rate is set by the visitor: gentle when idle, slow while moving
    // forward, zero for pure strafe/back (Q11)
    cameraRig.heading.applyAxisAngle(_normal, headingError * Math.min(1, cameraRig.followRate * dt))
    // Heading expressed in this frame's tangent basis, for the orbit maths below
    const smoothedAngle = Math.atan2(cameraRig.heading.dot(tangentRight), cameraRig.heading.dot(tangentForward))

    // Q143: Smoothly glide inward 1m and orbit 20° (0.35 rad) during dialogue
    const dialogueAlpha = Math.min(1, 3.5 * dt)
    dialogueGlide.current = MathUtils.lerp(
      dialogueGlide.current,
      isDialogueActive ? 1 : 0,
      dialogueAlpha
    )

    // Q118: Elevate camera +0.5m during district arrival fanfare
    const arrivalAlpha = Math.min(1, 2.5 * dt)
    arrivalElevation.current = MathUtils.lerp(
      arrivalElevation.current,
      districtLabelVisible ? 0.5 : 0,
      arrivalAlpha
    )

    // Opening handshake: move in for a two-shot and aim low, so the pair sits above
    // the intro dialogue panel instead of behind it
    greetBlend.current = MathUtils.lerp(greetBlend.current, greeting.active ? 1 : 0, Math.min(1, 3 * dt))
    const g = greetBlend.current
    // Centre the shot between the two characters rather than on the visitor
    let cx = vx, cy = vy, cz = vz
    if (g > 0.001) {
      _greetSep.set(guidePos[0] - vx, guidePos[1] - vy, guidePos[2] - vz)
      _greetSep.addScaledVector(_normal, -_greetSep.dot(_normal))
      cx += _greetSep.x * 0.5 * g
      cy += _greetSep.y * 0.5 * g
      cz += _greetSep.z * 0.5 * g
    }
    const followDist = CAMERA_BACK - dialogueGlide.current * CAMERA_DIALOGUE_PULL
    const targetDist = MathUtils.lerp(followDist, GREET_DIST, g)
    const camHeight = MathUtils.lerp(CAMERA_HEIGHT, GREET_CAM_HEIGHT, g)
    const lookHeight = MathUtils.lerp(CAMERA_LOOK_HEIGHT, GREET_LOOK_HEIGHT, g)
    const dialogueAngleOffset = dialogueGlide.current * 0.35
    const a = smoothedAngle + dialogueAngleOffset

    // ── Q142: PITCH CLAMPING ────────────────────────────
    // Clamp vertical orbit angle to -15° (down) to +60° (up) relative to tangent plane
    pitchAngle.current = MathUtils.clamp(pitchAngle.current, CAMERA_PITCH_MIN, CAMERA_PITCH_MAX)
    const pitchElevation = Math.sin(pitchAngle.current) * targetDist
    const pitchFlatten = Math.cos(pitchAngle.current)

    // ── Q145: MICRO-CAMERA IMPULSE (0.03m, 80ms) ───────
    // Triggers on panel close or prop activation; decays exponentially
    if (cameraImpulse !== lastImpulse.current) {
      lastImpulse.current = cameraImpulse
      impulseOffset.current = CAMERA_IMPULSE
    }
    const impulseAlpha = Math.min(1, 12 * dt)
    impulseOffset.current = MathUtils.lerp(impulseOffset.current, 0, impulseAlpha)

    // "Behind" direction in tangent plane:
    _rightScaled.copy(tangentRight).multiplyScalar(-Math.sin(a))
    _behindDir.copy(tangentForward).multiplyScalar(-Math.cos(a)).add(_rightScaled)

    // Q144: When reading panel is open: shift camera 1.5m left
    // so both characters remain visible in the 60% uncovered screen
    _panShift.set(0, 0, 0)
    if (isReading) _panShift.copy(tangentRight).multiplyScalar(-CAMERA_READING_PAN)

    // Camera position: behind + height + pitch + impulse, aimed low and
    // close (Messenger framing) rather than the old high, distant chase cam
    _desired.set(cx, cy, cz)
      .addScaledVector(_behindDir, targetDist * pitchFlatten)
      .addScaledVector(_normal, camHeight + arrivalElevation.current + pitchElevation + impulseOffset.current)
      .add(_panShift)

    // Look past the visitor at roughly chest height so the horizon drops and
    // buildings loom. "Ahead" MUST run along the line from the camera through the
    // visitor (-_behindDir), not along the global tangent forward: forward
    // movement is camera-relative, so any yaw error here makes the visitor
    // drift off its facing and spiral.
    _lookAt.set(cx, cy, cz)
      .addScaledVector(_normal, lookHeight)
      .addScaledVector(_behindDir, -CAMERA_LOOK_AHEAD * (1 - dialogueGlide.current * 0.6) * (1 - g))

    // ── Q141: SPRING-ARM OCCLUSION RAYCAST ──────────────
    // Pulls camera forward 0.3m off blocking walls to avoid clipping
    _camRayDir.copy(_desired).sub(_lookAt).normalize()
    const maxCamDist = _desired.distanceTo(_lookAt)
    raycaster.current.set(_lookAt, _camRayDir)
    raycaster.current.far = maxCamDist

    const buildingsGroup = scene.getObjectByName('buildings')
    const occluders = buildingsGroup ? buildingsGroup.children : []

    if (occluders.length > 0) {
      const hits = raycaster.current.intersectObjects(occluders, true)
      let closestBlockingDist = maxCamDist
      for (const hit of hits) {
        if (
          hit.object instanceof Mesh &&
          hit.object.name !== 'ground' &&
          !hit.object.userData?.isCharacter
        ) {
          if (hit.distance < closestBlockingDist && hit.distance > 0.8) {
            closestBlockingDist = Math.max(1.2, hit.distance - 0.3)
          }
        }
      }

      if (closestBlockingDist < maxCamDist) {
        _desired.copy(_lookAt).addScaledVector(_camRayDir, closestBlockingDist)
      }
    }

    // Set camera "up" vector to surface normal BEFORE lookAt so the
    // orientation matrix calculates with the correct up vector
    state.camera.up.copy(_normal)

    // Smooth camera position with bounded lerp factor. After a teleport or map jump
    // the camera cuts straight to its new spot: easing there would slide it through
    // the planet. (Several frames, because the visitor's position reaches this
    // component through React state a frame late.)
    if (cameraRig.snapFrames > 0) {
      cameraRig.snapFrames--
      state.camera.position.copy(_desired)
    } else {
      const camLerpAlpha = Math.min(1, CAMERA_LERP * dt)
      state.camera.position.lerp(_desired, camLerpAlpha)
    }

    // FOV kick: widen a touch with speed, ease back at rest. Small enough to be felt, not seen.
    const cam = state.camera as PerspectiveCamera
    const fovTarget = CAMERA_FOV + CAMERA_FOV_KICK * cameraRig.speed
    const fov = MathUtils.lerp(cam.fov, fovTarget, Math.min(1, 3.5 * dt))
    if (Math.abs(fov - cam.fov) > 0.005) {
      cam.fov = fov
      cam.updateProjectionMatrix()
    }
    state.camera.lookAt(_lookAt)
  })

  if (freeFlyMode) {
    return <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
  }

  return null
}
