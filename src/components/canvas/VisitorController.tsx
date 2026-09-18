'use client'

import { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useKeyboardControls } from '@react-three/drei'
import { RigidBody, RapierRigidBody, CapsuleCollider } from '@react-three/rapier'
import { Vector3, Group, Texture, DataTexture, RedFormat, Quaternion } from 'three'
import { useWorldStore } from '@/store/useWorldStore'
import CharacterModel from './CharacterModel'
import { useCharacterAnimations } from '@/hooks/useCharacterAnimations'
import { WORLD_COORDINATES, DistrictName } from '@/lib/worldCoordinates'
import { useMobileControls } from '@/hooks/useMobileControls'
import { useAudioManager } from '@/hooks/useAudioManager'
import {
  VISITOR_SPEED,
  VISITOR_BOOST_SPEED,
  TETHER_DISTANCE,
  LINEAR_DAMPING,
  VISITOR_COLOR,
  CHARACTER_CAPSULE_RADIUS,
  CHARACTER_CAPSULE_HEIGHT,
  TOON_GRADIENT_STEPS,
  PLANET_RADIUS,
} from '@/lib/constants'
import {
  getSurfaceNormal,
  getTangentBasis,
  projectOntoTangentPlane,
} from '@/lib/sphereMath'
import { mapSpawnToSphere } from '@/lib/surfacePlacement'
import { emitFootstepPuff } from './FootstepPuffs'

// Shared gradient texture — created once here, passed down.
const gradientMap = new DataTexture(
  TOON_GRADIENT_STEPS,
  TOON_GRADIENT_STEPS.length,
  1,
  RedFormat
)
gradientMap.needsUpdate = true

// Pre-allocated vectors — avoids GC pressure inside useFrame
const _direction = new Vector3()
const _tangentVel = new Vector3()
const _forward = new Vector3()
const _right = new Vector3()
const _camDir = new Vector3()
const _posVec = new Vector3()
const _normal = new Vector3()
const _upRef = new Vector3(0, 1, 0)
const _qAlign = new Quaternion()

// Spawn on the north pole of the sphere (top), slightly above surface
const SPAWN_HEIGHT = PLANET_RADIUS + CHARACTER_CAPSULE_HEIGHT
const SPAWN_POS: [number, number, number] = [0, SPAWN_HEIGHT, 0]

export default function VisitorController() {
  const bodyRef = useRef<RapierRigidBody>(null)
  const modelRef = useRef<Group>(null)
  const [, get] = useKeyboardControls()

  const { isMobile, getDirection } = useMobileControls(() => {
    // Tap = Interact, reuses the same handler InteractiveProps listens for
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE' }))
  })

  const isTourActive = useWorldStore((s) => s.isTourActive)
  const isReading = useWorldStore((s) => s.isReading)
  const abdulPos = useWorldStore((s) => s.abdulrahmanPosition)
  const setPosition = useWorldStore((s) => s.setPosition)
  const setTourActive = useWorldStore((s) => s.setTourActive)
  const setFacingAngle = useWorldStore((s) => s.setFacingAngle)

  const { updateFromVelocity } = useCharacterAnimations()
  const animStateRef = useRef<'idle' | 'walk'>('idle')
  const [animName, setAnimName] = useState<'idle' | 'walk'>('idle')

  const { playFootstep } = useAudioManager()

  // Track the character's heading (yaw) on the tangent plane
  const yawRef = useRef(0)
  // Track continuous locomotion time for subtle speed boost (Q18)
  const movingDurationRef = useRef(0)
  // Track accumulated stride distance for footsteps (Q139)
  const footstepDistanceRef = useRef(0)

  // ── DEEP LINK SPAWN ────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined' || !bodyRef.current) return
    const path = window.location.pathname as DistrictName
    const coord = WORLD_COORDINATES[path]
    if (coord) {
      const spawn = mapSpawnToSphere(coord.spawnPoint, CHARACTER_CAPSULE_HEIGHT)
      bodyRef.current.setTranslation(
        { x: spawn[0], y: spawn[1], z: spawn[2] },
        true
      )
      setPosition(spawn)
    }
  }, [setPosition])

  useFrame((state, delta) => {
    if (!bodyRef.current || !modelRef.current) return

    const pos = bodyRef.current.translation()
    _posVec.set(pos.x, pos.y, pos.z)

    // ── SURFACE NORMAL & TANGENT BASIS ──────────────────
    // The normal points outward from sphere center; tangent basis
    // gives us "forward" and "right" directions on the curved surface.
    _normal.copy(getSurfaceNormal(_posVec))
    const { forward: tangentForward, right: tangentRight } = getTangentBasis(_normal)

    const { forward, backward, left, right } = get()
    const hasInput = forward || backward || left || right

    // Movement input breaks tour immediately
    if (hasInput && isTourActive) {
      setTourActive(false)
    }

    // ── SPEED BOOST (Q18: 3 units/sec base, boosts to 4 after 10s non-interaction) ──
    if (hasInput && !isReading && !isTourActive) {
      movingDurationRef.current += delta
    } else {
      movingDurationRef.current = Math.max(0, movingDurationRef.current - delta * 2)
    }
    const boostFactor = Math.min(1, Math.max(0, (movingDurationRef.current - 10) / 2))
    const currentSpeed = VISITOR_SPEED + (VISITOR_BOOST_SPEED - VISITOR_SPEED) * boostFactor

    _direction.set(0, 0, 0)

    // ── READING MODE: ignore all movement input ───────
    if (isReading) {
      // no-op, character frozen
    } else if (isTourActive) {
      // ── GUIDED TOUR: follow Abdulrahman closely ─────
      const abdulVec = new Vector3(abdulPos[0], abdulPos[1], abdulPos[2])
      const distToAbdul = _posVec.distanceTo(abdulVec)

      if (distToAbdul > TETHER_DISTANCE) {
        _direction.copy(abdulVec).sub(_posVec)
        // Project follow direction onto the tangent plane
        _direction.copy(projectOntoTangentPlane(_direction, _normal))
        _direction.normalize().multiplyScalar(VISITOR_SPEED * 0.9)
      }
    } else if (isMobile) {
      const touch = getDirection()
      if (touch.x !== 0 || touch.z !== 0) {
        // Use camera direction projected onto tangent plane for mobile
        state.camera.getWorldDirection(_camDir)
        const camTangent = projectOntoTangentPlane(_camDir, _normal).normalize()
        const camRight = new Vector3().crossVectors(_normal, camTangent).normalize()
        _direction.add(camTangent.clone().multiplyScalar(-touch.z))
        _direction.add(camRight.clone().multiplyScalar(touch.x))
        if (_direction.lengthSq() > 0) {
          _direction.normalize().multiplyScalar(currentSpeed)
        }
      }
    } else {
      // ── FREE ROAM: camera-relative input mapped to tangent plane ──
      // Get camera forward direction and project it onto the tangent plane
      // so movement always feels "along the surface"
      state.camera.getWorldDirection(_camDir)
      _forward.copy(projectOntoTangentPlane(_camDir, _normal))
      if (_forward.lengthSq() > 0.0001) {
        _forward.normalize()
      } else {
        _forward.copy(tangentForward)
      }
      _right.crossVectors(_normal, _forward).normalize()

      if (forward) _direction.add(_forward)
      if (backward) _direction.sub(_forward)
      if (right) _direction.add(_right)
      if (left) _direction.sub(_right)

      if (_direction.lengthSq() > 0) {
        _direction.normalize().multiplyScalar(currentSpeed)
      }
    }

    // ── APPLY TANGENT-PLANE VELOCITY ─────────────────────
    // Project desired direction onto tangent plane (safety), then
    // preserve the radial velocity component so gravity still works.
    _tangentVel.copy(projectOntoTangentPlane(_direction, _normal))

    const currentVel = bodyRef.current.linvel()
    const currentVelVec = new Vector3(currentVel.x, currentVel.y, currentVel.z)
    const radialSpeed = currentVelVec.dot(_normal)

    // Final velocity = tangent movement + radial (gravity) component
    const finalVel = _tangentVel.clone().add(_normal.clone().multiplyScalar(radialSpeed))
    bodyRef.current.setLinvel(
      { x: finalVel.x, y: finalVel.y, z: finalVel.z },
      true
    )

    // ── ALIGN CHARACTER TO SURFACE NORMAL ─────────────────
    // Orient the character so their "up" matches the surface normal,
    // then apply yaw rotation for facing direction.
    const speed = _direction.length()
    if (speed > 0.1) {
      // Compute facing direction in tangent plane
      const facingDir = projectOntoTangentPlane(_direction, _normal).normalize()
      // Yaw angle relative to the tangent "forward"
      yawRef.current = Math.atan2(
        facingDir.dot(tangentRight),
        facingDir.dot(tangentForward)
      )
      setFacingAngle(yawRef.current)
    }

    // Align body "up" to surface normal
    _qAlign.setFromUnitVectors(_upRef, _normal)
    // Apply yaw on top of normal alignment
    const qYaw = new Quaternion().setFromAxisAngle(_normal, yawRef.current)
    _qAlign.premultiply(qYaw)

    modelRef.current.quaternion.copy(_qAlign)

    // ── ANIMATION STATE ─────────────────────────────────
    const nextAnim = updateFromVelocity(speed, currentSpeed) as 'idle' | 'walk'
    if (nextAnim !== animStateRef.current) {
      animStateRef.current = nextAnim
      setAnimName(nextAnim)
    }

    // ── Q139: FOOTSTEP AUDIO (-14dB, ±4% random pitch jitter) + Q66 DUST PUFFS ──
    if (speed > 0.2 && !isReading) {
      footstepDistanceRef.current += speed * delta
      if (footstepDistanceRef.current >= 1.35) {
        footstepDistanceRef.current = 0
        playFootstep()
        emitFootstepPuff([pos.x, pos.y, pos.z])
      }
    } else {
      footstepDistanceRef.current = 0.4
    }

    // ── SYNC STORE ───────────────────────────────────────
    setPosition([pos.x, pos.y, pos.z])
  })

  return (
    <RigidBody
      name="visitor"
      ref={bodyRef}
      position={SPAWN_POS}
      colliders={false}
      enabledRotations={[false, false, false]}
      linearDamping={LINEAR_DAMPING}
    >
      <CapsuleCollider
        args={[CHARACTER_CAPSULE_HEIGHT / 2, CHARACTER_CAPSULE_RADIUS]}
      />
      <group ref={modelRef}>
        <CharacterModel
          url="/visitor.vrm"
          color={VISITOR_COLOR}
          gradientMap={gradientMap as unknown as Texture}
          animationName={animName}
        />
      </group>
    </RigidBody>
  )
}