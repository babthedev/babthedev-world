'use client'

import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Vector3, MathUtils, Raycaster, Mesh, MeshToonMaterial } from 'three'
import { useWorldStore } from '@/store/useWorldStore'
import { CAMERA_HEIGHT, CAMERA_BACK, CAMERA_LERP, CAMERA_PITCH_MIN, CAMERA_PITCH_MAX, CAMERA_IMPULSE } from '@/lib/constants'
import { getSurfaceNormal, getTangentBasis } from '@/lib/sphereMath'

// Pre-allocated vectors — avoids GC pressure inside useFrame
const _desired = new Vector3()
const _lookAt = new Vector3()
const _posVec = new Vector3()
const _normal = new Vector3()
const _behindDir = new Vector3()

export default function CameraController() {
  const visitorPos = useWorldStore((state) => state.position)
  const facingAngle = useWorldStore((state) => state.facingAngle)
  const isReading = useWorldStore((state) => state.isReading)
  const currentDialogue = useWorldStore((state) => state.currentDialogue)
  const npcDialogue = useWorldStore((state) => state.npcDialogue)
  const freeFlyMode = useWorldStore((state) => state.freeFlyMode)
  const districtLabelVisible = useWorldStore((state) => state.districtLabelVisible)

  const isDialogueActive = currentDialogue !== null || npcDialogue !== null

  // Camera tracks its OWN smoothed angle — not the character's live angle.
  // This creates the "camera lags slightly behind the turn" feel
  // that messenger.abeto.co has.
  const smoothedAngle = useRef(0)
  const dialogueGlide = useRef(0)
  const arrivalElevation = useRef(0)

  // Q142: Pitch angle tracking (vertical orbit offset relative to tangent plane)
  const pitchAngle = useRef(0)

  // Q145: Micro-camera impulse — 0.03m directional punch on prop/panel interactions
  const cameraImpulse = useWorldStore((state) => state.cameraImpulse)
  const lastImpulse = useRef(0)
  const impulseOffset = useRef(0)

  const raycaster = useRef(new Raycaster())
  const fadedMeshes = useRef<Set<Mesh>>(new Set())
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

    // Smooth the camera's angle toward visitor's facing angle
    const angleAlpha = Math.min(1, 3.5 * dt)
    smoothedAngle.current = MathUtils.lerp(
      smoothedAngle.current,
      facingAngle,
      angleAlpha
    )

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

    const targetDist = CAMERA_BACK - dialogueGlide.current * 1.0
    const dialogueAngleOffset = dialogueGlide.current * 0.35
    const a = smoothedAngle.current + dialogueAngleOffset

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
    _behindDir
      .copy(tangentForward).multiplyScalar(-Math.cos(a))
      .add(tangentRight.clone().multiplyScalar(-Math.sin(a)))

    // Q144: When reading panel is open: shift camera 1.5m left
    // so both characters remain visible in the 60% uncovered screen
    const panShift = isReading
      ? tangentRight.clone().multiplyScalar(-1.5)
      : new Vector3(0, 0, 0)

    // Camera position: behind + height + pitch + impulse
    _desired.set(vx, vy, vz)
      .add(_behindDir.clone().multiplyScalar(targetDist * pitchFlatten))
      .add(_normal.clone().multiplyScalar(CAMERA_HEIGHT + arrivalElevation.current + pitchElevation + impulseOffset.current))
      .add(panShift)

    // Look at visitor's mid-body (1 unit above position along normal)
    _lookAt.set(vx, vy, vz)
      .add(_normal.clone().multiplyScalar(1.0))

    // ── Q141: SPRING-ARM OCCLUSION RAYCAST ──────────────
    // Pulls camera forward 0.3m off blocking walls to avoid clipping
    const camRayDir = _desired.clone().sub(_lookAt).normalize()
    const maxCamDist = _desired.distanceTo(_lookAt)
    raycaster.current.set(_lookAt, camRayDir)
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
        _desired.copy(_lookAt).add(camRayDir.clone().multiplyScalar(closestBlockingDist))
      }
    }

    // Set camera "up" vector to surface normal BEFORE lookAt so the
    // orientation matrix calculates with the correct up vector
    state.camera.up.copy(_normal)

    // Smooth camera position with bounded lerp factor
    const camLerpAlpha = Math.min(1, CAMERA_LERP * dt)
    state.camera.position.lerp(_desired, camLerpAlpha)
    state.camera.lookAt(_lookAt)

    // ── OBJECT FADE-THROUGH ─────────────────────────────
    // Raycast from camera to player, fade objects blocking view
    if (occluders.length > 0) {
      raycaster.current.set(
        _lookAt,
        _desired.clone().sub(_lookAt).normalize()
      )
      raycaster.current.far = _desired.distanceTo(_lookAt)

      const fadeHits = raycaster.current.intersectObjects(occluders, true)
      const currentlyBlocking = new Set<Mesh>()

      for (const hit of fadeHits) {
        if (hit.object instanceof Mesh && hit.object.name !== 'ground') {
          currentlyBlocking.add(hit.object)
          const mat = hit.object.material as MeshToonMaterial
          if (mat && mat.opacity !== 0.25) {
            mat.transparent = true
            mat.opacity = 0.25
            mat.needsUpdate = true
          }
        }
      }

      // Restore opacity on meshes no longer blocking
      for (const mesh of fadedMeshes.current) {
        if (!currentlyBlocking.has(mesh)) {
          const mat = mesh.material as MeshToonMaterial
          if (mat) {
            mat.opacity = 1
            mat.transparent = false
            mat.needsUpdate = true
          }
        }
      }
      fadedMeshes.current = currentlyBlocking
    }
  })

  if (freeFlyMode) {
    return <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
  }

  return null
}