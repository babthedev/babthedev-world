'use client'

import { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, RapierRigidBody, CapsuleCollider, interactionGroups } from '@react-three/rapier'
import { Vector3, Group, DataTexture, RedFormat, Texture, Quaternion } from 'three'
import { useWorldStore } from '@/store/useWorldStore'
import CharacterModel from './CharacterModel'
import DialogueBubble from './DialogueBubble'
import { useCharacterAnimations } from '@/hooks/useCharacterAnimations'
import { TOUR_WAYPOINTS, calcDialogueDuration } from '@/lib/dialogue'
import { WORLD_COORDINATES, DistrictName } from '@/lib/worldCoordinates'
import {
  ABDULRAHMAN_SPEED,
  TETHER_DISTANCE,
  CATCH_UP_DISTANCE,
  LINEAR_DAMPING,
  ABDULRAHMAN_COLOR,
  CHARACTER_OFFSET_X,
  CHARACTER_CAPSULE_RADIUS,
  CHARACTER_CAPSULE_HEIGHT,
  TOON_GRADIENT_STEPS,
  PLANET_RADIUS,
} from '@/lib/constants'
import {
  getSurfaceNormal,
  getTangentBasis,
  projectOntoTangentPlane,
  settleFacing,
  orientFromFacing,
  turnToward,
} from '@/lib/sphereMath'
import { greeting } from '@/lib/greeting'
import { flatToSphere, mapSpawnToSphere } from '@/lib/surfacePlacement'
import { emitFootstepPuff } from './FootstepPuffs'
import { useTelemetry } from '@/hooks/useTelemetry'

// Pre-compute tour waypoints on the sphere surface
const SPHERE_TOUR_WAYPOINTS = TOUR_WAYPOINTS.map((w) => {
  const { position } = flatToSphere(w.position[0], w.position[2], 1.0)
  return { ...w, spherePosition: position }
})

const gradientMap = new DataTexture(
  TOON_GRADIENT_STEPS,
  TOON_GRADIENT_STEPS.length,
  1,
  RedFormat
)
gradientMap.needsUpdate = true

// Pre-allocated vectors
const _target = new Vector3()
const _direction = new Vector3()
const _tangentVel = new Vector3()
const _posVec = new Vector3()
const _normal = new Vector3()
const _currentVel = new Vector3()
const _visVec = new Vector3()
const _faceDir = new Vector3()
const _qAlign = new Quaternion()

// Spawn next to visitor on north pole, offset slightly on the tangent plane
const SPAWN_HEIGHT = PLANET_RADIUS + CHARACTER_CAPSULE_HEIGHT
const SPAWN_POS: [number, number, number] = [CHARACTER_OFFSET_X, SPAWN_HEIGHT, 0]

export default function AbdulrahmanController() {
  const bodyRef = useRef<RapierRigidBody>(null)
  const modelRef = useRef<Group>(null)

  const visitorPosition = useWorldStore((s) => s.position)
  const isTourActive = useWorldStore((s) => s.isTourActive)
  const introComplete = useWorldStore((s) => s.introComplete)
  const isReading = useWorldStore((s) => s.isReading)
  const tourWaypointIndex = useWorldStore((s) => s.tourWaypointIndex)
  const setTourWaypointIndex = useWorldStore((s) => s.setTourWaypointIndex)
  const setTourActive = useWorldStore((s) => s.setTourActive)
  const setCurrentDialogue = useWorldStore((s) => s.setCurrentDialogue)
  const setAbdulrahmanPosition = useWorldStore((s) => s.setAbdulrahmanPosition)
  const tourCompleted = useWorldStore((s) => s.tourCompleted)
  const setTourCompleted = useWorldStore((s) => s.setTourCompleted)
  const setPassportStampVisible = useWorldStore((s) => s.setPassportStampVisible)
  const triggerCraneFlyover = useWorldStore((s) => s.triggerCraneFlyover)

  const { trackEvent } = useTelemetry()
  const { updateFromVelocity } = useCharacterAnimations()
  const animStateRef = useRef<'idle' | 'walk'>('idle')
  const [animName, setAnimName] = useState<'idle' | 'walk'>('idle')

  const dialogueTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastWaypoint = useRef(-1)
  // Facing is a world-space tangent vector, not an angle (see settleFacing)
  const facingRef = useRef(new Vector3(0, 0, 1))
  const lastDispatchedPos = useRef(new Vector3(...SPAWN_POS))
  const isWaitingForVisitorRef = useRef(false)
  const footstepDistanceRef = useRef(0.4)

  // ── DEEP LINK SPAWN ────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined' || !bodyRef.current) return
    const path = window.location.pathname as DistrictName
    const coord = WORLD_COORDINATES[path]
    if (coord) {
      const spawn = mapSpawnToSphere(
        [coord.spawnPoint[0] + CHARACTER_OFFSET_X, coord.spawnPoint[1], coord.spawnPoint[2]],
        CHARACTER_CAPSULE_HEIGHT
      )
      bodyRef.current.setTranslation(
        {
          x: spawn[0],
          y: spawn[1],
          z: spawn[2],
        },
        true
      )
      setAbdulrahmanPosition(spawn)
    }
  }, [setAbdulrahmanPosition])

  // ── DISTRICT TRAVEL: the guide comes along ─────────────
  // When the visitor jumps to a district from the map, the guide is placed beside them
  // and the tour carries on from that district. Left behind, the idle tour would walk
  // the visitor straight back to a guide on the far side of town.
  const travelArrival = useWorldStore((s) => s.travelArrival)
  useEffect(() => {
    if (!travelArrival || !bodyRef.current) return
    const coord = WORLD_COORDINATES[travelArrival.path as DistrictName]
    if (!coord) return
    const spawn = mapSpawnToSphere(
      [coord.spawnPoint[0] + CHARACTER_OFFSET_X, coord.spawnPoint[1], coord.spawnPoint[2]],
      CHARACTER_CAPSULE_HEIGHT
    )
    bodyRef.current.setTranslation({ x: spawn[0], y: spawn[1], z: spawn[2] }, true)
    bodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
    setAbdulrahmanPosition(spawn)
    const index = TOUR_WAYPOINTS.findIndex(
      (w) => w.position[0] === coord.spawnPoint[0] && w.position[2] === coord.spawnPoint[2]
    )
    if (index >= 0) setTourWaypointIndex(index)
  }, [travelArrival, setAbdulrahmanPosition, setTourWaypointIndex])

  // ── DIALOGUE PLAYBACK ON WAYPOINT CHANGE ───────────
  useEffect(() => {
    if (!isTourActive) return
    if (tourWaypointIndex === lastWaypoint.current) return
    lastWaypoint.current = tourWaypointIndex

    const waypoint = TOUR_WAYPOINTS[tourWaypointIndex]
    if (!waypoint) return

    let lineIndex = 0
    const playNextLine = () => {
      const line = waypoint.lines[lineIndex]
      if (!line) {
        setCurrentDialogue(null)
        return
      }
      setCurrentDialogue(line.text)
      const duration = calcDialogueDuration(line.text)
      dialogueTimer.current = setTimeout(() => {
        lineIndex++
        playNextLine()
      }, duration)
    }
    playNextLine()

    return () => {
      if (dialogueTimer.current) clearTimeout(dialogueTimer.current)
    }
  }, [tourWaypointIndex, isTourActive, setCurrentDialogue])

  useFrame((state, delta) => {
    if (!bodyRef.current || !modelRef.current) return
    // Idle until the intro ends, except for the opening handshake
    if (!introComplete && !greeting.active) return

    const pos = bodyRef.current.translation()
    _posVec.set(pos.x, pos.y, pos.z)

    // ── SURFACE NORMAL & TANGENT BASIS ──────────────────
    _normal.copy(getSurfaceNormal(_posVec))
    const { right: tangentRight } = getTangentBasis(_normal)

    _direction.set(0, 0, 0)

    if (greeting.active) {
      // Opening handshake: stand still and turn to face the visitor
      _faceDir.set(visitorPosition[0], visitorPosition[1], visitorPosition[2]).sub(_posVec)
      settleFacing(_normal, _faceDir)
      turnToward(facingRef.current, _faceDir, _normal, 7 * delta)
    } else if (isReading) {
      // Waiting animation handled via animState below — no movement
    } else if (isTourActive) {
      // ── GUIDED TOUR: follow waypoint array with adaptive waiting (Q117) ──
      _visVec.set(
        visitorPosition[0],
        visitorPosition[1],
        visitorPosition[2]
      )
      const distToVisitor = _posVec.distanceTo(_visVec)

      // Q117: If separation exceeds 5m, pause and face visitor; resume when visitor <= 2.5m
      if (distToVisitor > 5.0) {
        isWaitingForVisitorRef.current = true
      } else if (distToVisitor <= 2.5) {
        isWaitingForVisitorRef.current = false
      }

      if (isWaitingForVisitorRef.current) {
        // Turn to face visitor while waiting
        _faceDir.copy(_visVec).sub(_posVec)
        const faceVisDir = projectOntoTangentPlane(_faceDir, _normal)
        if (faceVisDir.lengthSq() > 0.01) {
          faceVisDir.normalize()
          facingRef.current.copy(faceVisDir)
        }
        _direction.set(0, 0, 0)
      } else {
        const waypoint = SPHERE_TOUR_WAYPOINTS[tourWaypointIndex]
        if (waypoint) {
          _target.set(
            waypoint.spherePosition[0],
            waypoint.spherePosition[1],
            waypoint.spherePosition[2]
          )
          const dist = _posVec.distanceTo(_target)

          if (dist > TETHER_DISTANCE) {
            _direction.copy(_target).sub(_posVec)
            // Project onto tangent plane — stay on the surface
            _direction.copy(projectOntoTangentPlane(_direction, _normal))
            _direction.normalize().multiplyScalar(ABDULRAHMAN_SPEED)
          } else if (
            tourWaypointIndex < SPHERE_TOUR_WAYPOINTS.length - 1 &&
            dist <= TETHER_DISTANCE
          ) {
            setTourWaypointIndex(tourWaypointIndex + 1)
          } else if (
            tourWaypointIndex === SPHERE_TOUR_WAYPOINTS.length - 1 &&
            dist <= TETHER_DISTANCE &&
            !tourCompleted
          ) {
            // Q80: Reached final closing waypoint back at the Hub
            setTourCompleted(true)
            setPassportStampVisible(true)
            triggerCraneFlyover()
            trackEvent('tour_completed')
            // After closing dialogue finishes, allow visitor to explore freely
            setTimeout(() => {
              setTourActive(false)
            }, 6000)
          }
        }
      }
    } else {
      // ── FREE ROAM: follow visitor, offset to the right ─
      _visVec.set(
        visitorPosition[0],
        visitorPosition[1],
        visitorPosition[2]
      )
      // Offset along the tangent "right" direction on the sphere surface
      _visVec.addScaledVector(tangentRight, CHARACTER_OFFSET_X)
      const dist = _posVec.distanceTo(_visVec)

      // Catch-up teleport if too far
      if (dist > CATCH_UP_DISTANCE) {
        bodyRef.current.setTranslation(
          { x: _visVec.x, y: _visVec.y, z: _visVec.z },
          true
        )
        return
      }

      if (dist > TETHER_DISTANCE) {
        _direction.copy(_visVec).sub(_posVec)
        _direction.copy(projectOntoTangentPlane(_direction, _normal))
        _direction.normalize().multiplyScalar(ABDULRAHMAN_SPEED)
      }
    }

    // ── APPLY TANGENT-PLANE VELOCITY ─────────────────────
    _tangentVel.copy(projectOntoTangentPlane(_direction, _normal))

    // ── SURFACE CLAMP & RADIAL SPEED ─────────────────────
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

    // ── FACING & ALIGNMENT ───────────────────────────────
    const speed = _direction.length()
    if (speed > 0.1) facingRef.current.copy(_direction)
    settleFacing(_normal, facingRef.current)

    // Body: +Y = surface normal, +Z = facing
    orientFromFacing(_normal, facingRef.current, _qAlign)
    modelRef.current.quaternion.copy(_qAlign)

    // ── ANIMATION STATE ──────────────────────────────────
    const nextAnim = updateFromVelocity(
      speed,
      ABDULRAHMAN_SPEED
    ) as 'idle' | 'walk'
    if (nextAnim !== animStateRef.current) {
      animStateRef.current = nextAnim
      setAnimName(nextAnim)
    }

    // ── Q66: DUST PUFFS ON FOOTFALLS ──────────────────────
    if (speed > 0.2) {
      footstepDistanceRef.current += speed * delta
      if (footstepDistanceRef.current >= 1.35) {
        footstepDistanceRef.current = 0
        emitFootstepPuff([pos.x, pos.y, pos.z])
      }
    } else {
      footstepDistanceRef.current = 0.4
    }

    // ── SYNC STORE (Throttled to avoid 60fps re-render storms across store subscribers) ──
    if (_posVec.distanceToSquared(lastDispatchedPos.current) > 0.0004) {
      lastDispatchedPos.current.copy(_posVec)
      setAbdulrahmanPosition([pos.x, pos.y, pos.z])
    }
  })

  return (
    <RigidBody
      name="abdulrahman"
      ref={bodyRef}
      position={SPAWN_POS}
      colliders={false}
      enabledRotations={[false, false, false]}
      linearDamping={LINEAR_DAMPING}
    >
      {/* Q53: ghosts through the visitor (group 2 vs group 1), collides with the world (group 0) */}
      <CapsuleCollider
        args={[CHARACTER_CAPSULE_HEIGHT / 2, CHARACTER_CAPSULE_RADIUS]}
        collisionGroups={interactionGroups(2, [0])}
      />
      <group ref={modelRef}>
        <CharacterModel
          url="/abdulrahman.vrm"
          color={ABDULRAHMAN_COLOR}
          gradientMap={gradientMap as unknown as Texture}
          animationName={animName}
        />
        <DialogueBubble />
      </group>
    </RigidBody>
  )
}