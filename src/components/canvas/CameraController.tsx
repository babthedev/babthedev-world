'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3, MathUtils } from 'three'
import { useWorldStore } from '@/store/useWorldStore'
import { CAMERA_HEIGHT, CAMERA_BACK, CAMERA_LERP } from '@/lib/constants'
import { Raycaster, Mesh, MeshToonMaterial } from 'three'
import { useThree } from '@react-three/fiber'


// Pre-allocated vectors — avoids GC pressure inside useFrame
const _desired = new Vector3()
const _lookAt = new Vector3()

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

    // Smooth the camera's angle toward visitor's facing angle
    // Lower value = more lag = heavier camera feel
    smoothedAngle.current = MathUtils.lerp(
      smoothedAngle.current,
      facingAngle,
      3.5 * delta
    )

    const a = smoothedAngle.current

    // Camera position = visitor + (BACK behind them) + (HEIGHT above them)
    // facingAngle is set via atan2(dx, dz) in VisitorController,
    // so to place camera BEHIND: negate both components.
    //
    // facingAngle = 0 → visitor faces +Z → camera at (0, H, -BACK)
    // facingAngle = π → visitor faces -Z → camera at (0, H, +BACK)
    const backX = -Math.sin(a) * CAMERA_BACK
    const backZ = -Math.cos(a) * CAMERA_BACK

    // When reading panel is open: shift camera left (-X)
    // so both characters remain visible in the 60% uncovered screen
    const panX = isReading ? -3 : 0

    _desired.set(
      vx + backX + panX,
      vy + CAMERA_HEIGHT,
      vz + backZ
    )

    // Smooth camera position
    state.camera.position.lerp(_desired, CAMERA_LERP * delta)

    // Look at visitor's mid-body (Y + 1 avoids staring at feet)
    _lookAt.set(vx, vy + 1.0, vz)
    state.camera.lookAt(_lookAt)

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