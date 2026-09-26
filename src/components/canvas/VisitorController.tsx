'use client'

import { useCallback, useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useKeyboardControls } from '@react-three/drei'
import { RigidBody, RapierRigidBody, CapsuleCollider, useRapier, interactionGroups } from '@react-three/rapier'
import { Vector3, Group, Texture, DataTexture, RedFormat, Quaternion } from 'three'
import { useWorldStore } from '@/store/useWorldStore'
import CharacterModel from './CharacterModel'
import { useCharacterAnimations } from '@/hooks/useCharacterAnimations'
import { WORLD_COORDINATES, DistrictName } from '@/lib/worldCoordinates'
import { useTapToInteract } from '@/hooks/useMobileControls'
import { touchInput } from '@/lib/touchInput'
import { useAudioManager } from '@/hooks/useAudioManager'
import {
  VISITOR_SPEED,
  VISITOR_BOOST_SPEED,
  CAMERA_FOLLOW_IDLE,
  CAMERA_FOLLOW_MOVING,
  CAMERA_FOLLOW_TOUR,
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
  projectOntoTangentPlane,
  settleFacing,
  orientFromFacing,
  turnToward,
} from '@/lib/sphereMath'
import { mapSpawnToSphere } from '@/lib/surfacePlacement'
import { emitFootstepPuff } from './FootstepPuffs'
import { cameraRig } from '@/lib/cameraRig'
import { greeting, skipGreeting } from '@/lib/greeting'

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
const _posVec = new Vector3()
const _normal = new Vector3()
const _currentVel = new Vector3()
const _qAlign = new Quaternion()
const _greetDir = new Vector3()

// Spawn on the north pole of the sphere (top), slightly above surface
const SPAWN_HEIGHT = PLANET_RADIUS + CHARACTER_CAPSULE_HEIGHT
const SPAWN_POS: [number, number, number] = [0, SPAWN_HEIGHT, 0]

/** After a map jump, how long before the idle tour may resume */
const TRAVEL_TOUR_HOLD_MS = 20_000

export default function VisitorController() {
  const bodyRef = useRef<RapierRigidBody>(null)
  const { world } = useRapier()
  const modelRef = useRef<Group>(null)
  const [, get] = useKeyboardControls()

  // Tap on the world = Interact, reuses the same handler InteractiveProps listens for.
  // Walking is the virtual joystick (ui/VirtualJoystick), which writes to touchInput.
  useTapToInteract(
    useCallback(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE' }))
    }, [])
  )

  const isTourActive = useWorldStore((s) => s.isTourActive)
  const isReading = useWorldStore((s) => s.isReading)
  const abdulPos = useWorldStore((s) => s.abdulrahmanPosition)
  const setPosition = useWorldStore((s) => s.setPosition)
  const setTourActive = useWorldStore((s) => s.setTourActive)
  const setFacingDir = useWorldStore((s) => s.setFacingDir)

  const { updateFromVelocity } = useCharacterAnimations()
  const animStateRef = useRef<'idle' | 'walk'>('idle')
  const [animName, setAnimName] = useState<'idle' | 'walk'>('idle')

  const { playFootstep } = useAudioManager()

  // Track the character's heading (yaw) on the tangent plane
  // Facing is a world-space tangent vector, not an angle (see settleFacing)
  const facingRef = useRef(new Vector3(0, 0, 1))
  const lastDispatchedDir = useRef(new Vector3(0, 0, 1))
  const lastDispatchedPos = useRef(new Vector3(...SPAWN_POS))
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
      // The trigger sensor ignores the district you are already on (the URL matches),
      // so a deep link would otherwise leave the title card naming the Hub.
      useWorldStore.getState().setCurrentDistrict(path)
    }
  }, [setPosition])

  // Places the visitor at a flat-world coordinate, facing toward another flat-world
  // coordinate. Used by district travel (the map) and the dev teleport hook.
  const placeAt = useCallback(
    (x: number, z: number, lx: number, lz: number) => {
      if (!bodyRef.current) return
      const spawn = mapSpawnToSphere([x, 0, z], CHARACTER_CAPSULE_HEIGHT)
      bodyRef.current.setTranslation({ x: spawn[0], y: spawn[1], z: spawn[2] }, true)
      bodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
      const here = new Vector3(...spawn)
      const n = getSurfaceNormal(here)
      const look = projectOntoTangentPlane(new Vector3(...mapSpawnToSphere([lx, 0, lz], 0)).sub(here), n).normalize()
      facingRef.current.copy(look)
      lastDispatchedDir.current.copy(look)
      cameraRig.heading.copy(look)
      setFacingDir([look.x, look.y, look.z])
      setTourActive(false)
      skipGreeting() // someone (a script or the map) is driving, not the intro
      cameraRig.snapFrames = 4
      setPosition(spawn)
      // isTourActive is a render-time value, so for a frame or two after this the
      // tour branch can still steer the visitor toward the guide and overwrite the
      // facing. Re-apply once that has settled.
      setTimeout(() => {
        facingRef.current.copy(look)
        lastDispatchedDir.current.copy(look)
        cameraRig.heading.copy(look)
        setFacingDir([look.x, look.y, look.z])
      }, 150)
    },
    [setPosition, setFacingDir, setTourActive]
  )

  // ── DISTRICT TRAVEL (from the world map) ──────────────
  // An ink-iris wipe covers the jump. The visitor lands at the district's spawn point,
  // whose trigger zone then announces the district as usual.
  const travelRequest = useWorldStore((s) => s.travelRequest)
  useEffect(() => {
    if (!travelRequest) return
    const coord = WORLD_COORDINATES[travelRequest.path as DistrictName]
    if (!coord) return
    const store = useWorldStore.getState()
    store.setMapOpen(false)
    store.triggerIrisTransition(() => {
      // Face the middle of town from a district, and up the north street from the Hub
      const [x, , z] = coord.spawnPoint
      const toHub = travelRequest.path === '/'
      placeAt(x, z, 0, toHub ? -8 : 0)
      // Someone who just jumped here wants to look around, not be led away again
      store.holdTour(TRAVEL_TOUR_HOLD_MS)
      store.setTravelArrival({ path: travelRequest.path, id: travelRequest.id })
    })
  }, [travelRequest, placeAt])

  // ── DEV: TELEPORT HOOK (used by scripts/capture-poses.mjs) ──
  // __TELEPORT__(flatX, flatZ, lookFlatX, lookFlatZ)
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return
    const dev = window as unknown as Record<string, unknown>
    dev.__TELEPORT__ = placeAt
    dev.__VISITOR__ = function visitorSnapshot() {
      const b = bodyRef.current
      if (!b) return null
      const t = b.translation()
      const v = b.linvel()
      const contacts: unknown[] = []
      world.contactPairsWith(b.collider(0), (other) => {
        const c = other.translation()
        contacts.push({ shape: other.shapeType(), at: [c.x, c.y, c.z].map((n) => +n.toFixed(2)), body: other.parent()?.bodyType() })
      })
      return { pos: [t.x, t.y, t.z], vel: [v.x, v.y, v.z], sleeping: b.isSleeping(), mass: b.mass(), contacts, keys: get(), tour: useWorldStore.getState().isTourActive, reading: useWorldStore.getState().isReading }
    }
    return () => {
      delete dev.__TELEPORT__
      delete dev.__VISITOR__
    }
  }, [placeAt, world, get])

  useFrame((state, delta) => {
    if (!bodyRef.current || !modelRef.current) return

    const pos = bodyRef.current.translation()
    _posVec.set(pos.x, pos.y, pos.z)

    // ── SURFACE NORMAL & TANGENT BASIS ──────────────────
    // The normal points outward from sphere center; tangent basis
    // gives us "forward" and "right" directions on the curved surface.
    _normal.copy(getSurfaceNormal(_posVec))
    const { forward, backward, left, right } = get()
    // Keys and the joystick both count: either one takes the visitor off the guided tour
    const hasInput = forward || backward || left || right || touchInput.active

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
      _forward.set(abdulPos[0], abdulPos[1], abdulPos[2])
      const distToAbdul = _posVec.distanceTo(_forward)

      if (distToAbdul > TETHER_DISTANCE) {
        _direction.copy(_forward).sub(_posVec)
        // Project follow direction onto the tangent plane
        _direction.copy(projectOntoTangentPlane(_direction, _normal))
        _direction.normalize().multiplyScalar(VISITOR_SPEED * 0.9)
      }
    } else {
      // ── FREE ROAM: input relative to the camera HEADING ──
      // The heading, not the camera's view vector: the camera adds dialogue
      // orbit, look-ahead and pitch on top of it, and none of those may steer
      // the character (see cameraRig).
      _forward.copy(cameraRig.heading)
      settleFacing(_normal, _forward)
      // right = forward × up. (normal × forward is the LEFT vector, which used to
      // make D strafe left and A strafe right.)
      _right.crossVectors(_forward, _normal).normalize()

      // Keyboard is ALWAYS live. Touch is an additional input, never a
      // replacement: navigator.maxTouchPoints > 0 on touch-screen laptops and
      // Windows tablets, so treating "touch-capable" as "phone" used to discard
      // every key press on those machines.
      if (forward) _direction.add(_forward)
      if (backward) _direction.sub(_forward)
      if (right) _direction.add(_right)
      if (left) _direction.sub(_right)

      if (touchInput.active) {
        _direction.addScaledVector(_forward, touchInput.y)
        _direction.addScaledVector(_right, touchInput.x)
      }

      if (_direction.lengthSq() > 0) {
        _direction.normalize().multiplyScalar(currentSpeed)
      }
    }

    // ── OPENING HANDSHAKE: stand still and turn to face the guide ──
    if (greeting.active) {
      _direction.set(0, 0, 0)
      _greetDir.set(abdulPos[0], abdulPos[1], abdulPos[2]).sub(_posVec)
      settleFacing(_normal, _greetDir)
      turnToward(facingRef.current, _greetDir, _normal, 7 * delta)
    }

    // Published for the camera's FOV kick
    cameraRig.speed = greeting.active || isReading ? 0 : Math.min(1, _direction.length() / VISITOR_SPEED)

    // ── CAMERA FOLLOW RATE (Q11) ─────────────────────────
    // Idle: gently orbit toward the facing. Moving: follow only the FORWARD part
    // of the input, slowly, so W+D steers in an arc while pure strafe / back
    // go straight instead of circling.
    // On the guided tour the visitor is steered by the tour, not the camera, so there is
    // no feedback to fear: keep the camera close behind. A slow follow lets the visitor
    // swing out of frame when they turn to follow the guide, badly so in narrow portrait.
    if (greeting.active) {
      cameraRig.followRate = 0 // the director frames the pair
    } else if (isTourActive) {
      cameraRig.followRate = CAMERA_FOLLOW_TOUR
    } else if (_direction.lengthSq() < 1e-6) {
      cameraRig.followRate = CAMERA_FOLLOW_IDLE
    } else {
      const forwardPart = Math.max(0, _direction.dot(_forward)) / currentSpeed
      cameraRig.followRate = CAMERA_FOLLOW_MOVING * forwardPart
    }

    // ── APPLY TANGENT-PLANE VELOCITY ─────────────────────
    // Project desired direction onto tangent plane (safety), then
    // preserve the radial velocity component so gravity still works.
    _tangentVel.copy(projectOntoTangentPlane(_direction, _normal))

    // ── SURFACE CLAMP & RADIAL SPEED ─────────────────────
    // Ensures character never sinks below the planet surface
    const distFromCenter = _posVec.length()
    const targetSurfaceDist = PLANET_RADIUS + CHARACTER_CAPSULE_HEIGHT
    if (distFromCenter < targetSurfaceDist) {
      const pushDist = targetSurfaceDist - distFromCenter
      bodyRef.current.setTranslation(
        {
          x: pos.x + _normal.x * pushDist,
          y: pos.y + _normal.y * pushDist,
          z: pos.z + _normal.z * pushDist,
        },
        true
      )
    }

    // Read current velocity from physics body to preserve radial component (gravity)
    const vel = bodyRef.current.linvel()
    _currentVel.set(vel.x, vel.y, vel.z)
    let radialSpeed = _currentVel.dot(_normal)
    if (distFromCenter <= targetSurfaceDist + 0.05) {
      radialSpeed = Math.max(0, radialSpeed)
    }

    // Final velocity = tangent movement + radial component (in-place math)
    bodyRef.current.setLinvel(
      {
        x: _tangentVel.x + _normal.x * radialSpeed,
        y: _tangentVel.y + _normal.y * radialSpeed,
        z: _tangentVel.z + _normal.z * radialSpeed,
      },
      true
    )

    // ── ALIGN CHARACTER TO SURFACE NORMAL ─────────────────
    // Orient the character so their "up" matches the surface normal,
    // then apply yaw rotation for facing direction.
    const speed = _direction.length()
    if (speed > 0.1) {
      // Facing = the direction we are actually moving, as a tangent vector
      facingRef.current.copy(_direction)
    }
    // Keep it tangent to the surface as we move (exact along a great circle)
    settleFacing(_normal, facingRef.current)
    // Publish to the camera only when the visitor really turns (~2°), not on
    // every frame of a straight walk
    if (facingRef.current.dot(lastDispatchedDir.current) < 0.9994) {
      lastDispatchedDir.current.copy(facingRef.current)
      setFacingDir([facingRef.current.x, facingRef.current.y, facingRef.current.z])
    }

    // Body: +Y = surface normal, +Z = facing
    orientFromFacing(_normal, facingRef.current, _qAlign)
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

    // ── SYNC STORE (Throttled to avoid 60fps re-render storms across store subscribers) ──
    if (_posVec.distanceToSquared(lastDispatchedPos.current) > 0.0004) {
      lastDispatchedPos.current.copy(_posVec)
      setPosition([pos.x, pos.y, pos.z])
    }
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
      {/* Q53: characters ghost through each other (group 1 vs the guide's group 2)
          but still collide with the world (group 0: planet, buildings). Without
          this the guide, who stands 0.7m away with 0.4m-radius capsules, shoves
          the visitor sideways every frame. */}
      <CapsuleCollider
        args={[CHARACTER_CAPSULE_HEIGHT / 2, CHARACTER_CAPSULE_RADIUS]}
        collisionGroups={interactionGroups(1, [0])}
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