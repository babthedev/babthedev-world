'use client'

import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3, MathUtils, Raycaster, Mesh, MeshToonMaterial } from 'three'
import { useWorldStore } from '@/store/useWorldStore'
import { CAMERA_HEIGHT, CAMERA_BACK, CAMERA_LERP } from '@/lib/constants'
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

  // Camera tracks its OWN smoothed angle — not the character's live angle.
  // This creates the "camera lags slightly behind the turn" feel
  // that messenger.abeto.co has.
  const smoothedAngle = useRef(0)

  const raycaster = useRef(new Raycaster())
  const fadedMeshes = useRef<Set<Mesh>>(new Set())
  const { scene } = useThree()

  useFrame((state, delta) => {
    const [vx, vy, vz] = visitorPos
    _posVec.set(vx, vy, vz)

    // ── SURFACE-RELATIVE CAMERA ───────────────────────────
    // On a sphere, "up" is the surface normal at the character's
    // position, not the global Y axis. The camera orbits behind
    // the character in the tangent plane.
    _normal.copy(getSurfaceNormal(_posVec))
    const { forward: tangentForward, right: tangentRight } = getTangentBasis(_normal)

    // Smooth the camera's angle toward visitor's facing angle
    // Lower value = more lag = heavier camera feel
    smoothedAngle.current = MathUtils.lerp(
      smoothedAngle.current,
      facingAngle,
      3.5 * delta
    )

    const a = smoothedAngle.current

    // "Behind" direction in tangent plane:
    // facingAngle is relative to tangentForward/tangentRight basis
    // so we compose the behind direction from those vectors
    _behindDir
      .copy(tangentForward).multiplyScalar(-Math.cos(a))
      .add(tangentRight.clone().multiplyScalar(-Math.sin(a)))

    // When reading panel is open: shift camera left
    // so both characters remain visible in the 60% uncovered screen
    const panShift = isReading
      ? tangentRight.clone().multiplyScalar(-3)
      : new Vector3(0, 0, 0)

    // Camera position:
    // Start at character position,
    // go BACK behind them in tangent plane,
    // go HEIGHT above them along surface normal
    _desired.set(vx, vy, vz)
      .add(_behindDir.clone().multiplyScalar(CAMERA_BACK))
      .add(_normal.clone().multiplyScalar(CAMERA_HEIGHT))
      .add(panShift)

    // Smooth camera position
    state.camera.position.lerp(_desired, CAMERA_LERP * delta)

    // Look at visitor's mid-body (1 unit above position along normal)
    _lookAt.set(vx, vy, vz)
      .add(_normal.clone().multiplyScalar(1.0))
    state.camera.lookAt(_lookAt)

    // Set camera "up" vector to surface normal so the horizon
    // stays level relative to the planet surface
    state.camera.up.copy(_normal)

    // ── OBJECT FADE-THROUGH ─────────────────────────────
    // Raycast from camera to player, fade objects blocking view
    raycaster.current.set(
      _lookAt,
      _desired.clone().sub(_lookAt).normalize()
    )
    raycaster.current.far = _desired.distanceTo(_lookAt)

    const hits = raycaster.current.intersectObjects(scene.children, true)
    const currentlyBlocking = new Set<Mesh>()

    for (const hit of hits) {
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
  })

  return null
}