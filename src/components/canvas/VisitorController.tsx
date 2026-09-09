'use client'

import { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useKeyboardControls } from '@react-three/drei'
import { RigidBody, RapierRigidBody, CapsuleCollider } from '@react-three/rapier'
import { Vector3, Group, Texture, DataTexture, RedFormat } from 'three'
import { useWorldStore } from '@/store/useWorldStore'
import CharacterModel from './CharacterModel'
import { useCharacterAnimations } from '@/hooks/useCharacterAnimations'
import { WORLD_COORDINATES, DistrictName } from '@/lib/worldCoordinates'
import { useMobileControls } from '@/hooks/useMobileControls'
import {
  VISITOR_SPEED,
  TETHER_DISTANCE,
  LINEAR_DAMPING,
  VISITOR_COLOR,
  CHARACTER_CAPSULE_RADIUS,
  CHARACTER_CAPSULE_HEIGHT,
  TOON_GRADIENT_STEPS,
} from '@/lib/constants'

// Shared gradient texture — created once here, passed down.
// (World.tsx also creates one for the ground; this one is for
// the character until we thread it through props properly in
// a later pass — functionally identical, negligible cost.)
const gradientMap = new DataTexture(
  TOON_GRADIENT_STEPS,
  TOON_GRADIENT_STEPS.length,
  1,
  RedFormat
)
gradientMap.needsUpdate = true

const _direction = new Vector3()
const _forward = new Vector3()
const _right = new Vector3()
const _camDir = new Vector3()
const _worldUp = new Vector3(0, 1, 0)

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

  // ── DEEP LINK SPAWN ────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined' || !bodyRef.current) return
    const path = window.location.pathname as DistrictName
    const coord = WORLD_COORDINATES[path]
    if (coord) {
      bodyRef.current.setTranslation(
        { x: coord.spawnPoint[0], y: coord.spawnPoint[1], z: coord.spawnPoint[2] },
        true
      )
    }
  }, [])

  useFrame((state, delta) => {
    if (!bodyRef.current || !modelRef.current) return

    const pos = bodyRef.current.translation()
    const positionVec = new Vector3(pos.x, pos.y, pos.z)

    const { forward, backward, left, right } = get()
    const hasInput = forward || backward || left || right

    // Movement input breaks tour immediately (per spec: 2-second rule
    // handled separately in useTourLogic for RESUMING)
    if (hasInput && isTourActive) {
      setTourActive(false)
    }

    _direction.set(0, 0, 0)

    // ── READING MODE: ignore all movement input ───────
    if (isReading) {
      // no-op, character frozen
    } else if (isTourActive) {
      // ── GUIDED TOUR: follow Abdulrahman closely ─────
      const abdulVec = new Vector3(abdulPos[0], abdulPos[1], abdulPos[2])
      const distToAbdul = positionVec.distanceTo(abdulVec)

      if (distToAbdul > TETHER_DISTANCE) {
        _direction.copy(abdulVec).sub(positionVec)
        _direction.y = 0
        _direction.normalize().multiplyScalar(VISITOR_SPEED * 0.9)
      }
    } else if (isMobile) {
      const touch = getDirection()
      if (touch.x !== 0 || touch.z !== 0) {
        _right.crossVectors(_camDir, _worldUp).normalize()
        _forward.copy(_camDir)
        _direction.add(_forward.clone().multiplyScalar(-touch.z))
        _direction.add(_right.clone().multiplyScalar(touch.x))
        if (_direction.lengthSq() > 0) {
          _direction.normalize().multiplyScalar(VISITOR_SPEED)
        }
      }
    } else {  
      // ── FREE ROAM: camera-relative WASD ─────────────
      state.camera.getWorldDirection(_camDir)
      _camDir.y = 0
      _camDir.normalize()

      _right.crossVectors(_camDir, _worldUp).normalize()
      _forward.copy(_camDir)

      if (forward) _direction.add(_forward)
      if (backward) _direction.sub(_forward)
      if (right) _direction.add(_right)
      if (left) _direction.sub(_right)

      if (_direction.lengthSq() > 0) {
        _direction.normalize().multiplyScalar(VISITOR_SPEED)
      }
    }

    // ── APPLY VELOCITY ─────────────────────────────────
    const currentVel = bodyRef.current.linvel()
    bodyRef.current.setLinvel(
      { x: _direction.x, y: currentVel.y, z: _direction.z },
      true
    )

    // ── FACING ANGLE ────────────────────────────────────
    // Used by CameraController for behind-the-shoulder framing
    const speed = _direction.length()
    if (speed > 0.1) {
      const angle = Math.atan2(_direction.x, _direction.z)
      modelRef.current.rotation.y = angle
      setFacingAngle(angle)
    }

    // ── ANIMATION STATE ─────────────────────────────────
    const nextAnim = updateFromVelocity(speed, VISITOR_SPEED) as 'idle' | 'walk'
    if (nextAnim !== animStateRef.current) {
      animStateRef.current = nextAnim
      setAnimName(nextAnim)
    }

    // ── SYNC STORE ───────────────────────────────────────
    setPosition([pos.x, pos.y, pos.z])
  })

  return (
    <RigidBody
      name="visitor"
      ref={bodyRef}
      position={[0, 1, 0]}
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