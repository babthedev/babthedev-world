'use client'

import { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, RapierRigidBody, CapsuleCollider } from '@react-three/rapier'
import { Vector3, Group, DataTexture, RedFormat, Texture, Quaternion } from 'three'
import { useWorldStore } from '@/store/useWorldStore'
import CharacterModel from './CharacterModel'
import DialogueBubble from './DialogueBubble'
import { useCharacterAnimations } from '@/hooks/useCharacterAnimations'
import { TOUR_WAYPOINTS, calcDialogueDuration, SPECIAL_DIALOGUES } from '@/lib/dialogue'
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
} from '@/lib/sphereMath'
import { flatToSphere } from '@/lib/surfacePlacement'
import { emitFootstepPuff } from './FootstepPuffs'

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
const _upRef = new Vector3(0, 1, 0)
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
  const setCurrentDialogue = useWorldStore((s) => s.setCurrentDialogue)
  const setAbdulrahmanPosition = useWorldStore((s) => s.setAbdulrahmanPosition)

  const { updateFromVelocity } = useCharacterAnimations()
  const animStateRef = useRef<'idle' | 'walk'>('idle')
  const [animName, setAnimName] = useState<'idle' | 'walk'>('idle')

  const dialogueTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastWaypoint = useRef(-1)
  const yawRef = useRef(0)
  const isWaitingForVisitorRef = useRef(false)
  const footstepDistanceRef = useRef(0.4)

  // ── DEEP LINK SPAWN ────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined' || !bodyRef.current) return
    const path = window.location.pathname as DistrictName
    const coord = WORLD_COORDINATES[path]
    if (coord) {
      bodyRef.current.setTranslation(
        {
          x: coord.spawnPoint[0] + CHARACTER_OFFSET_X,
          y: coord.spawnPoint[1],
          z: coord.spawnPoint[2],
        },
        true
      )
    }
  }, [])

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
    if (!bodyRef.current || !modelRef.current || !introComplete) return

    const pos = bodyRef.current.translation()
    _posVec.set(pos.x, pos.y, pos.z)

    // ── SURFACE NORMAL & TANGENT BASIS ──────────────────
    _normal.copy(getSurfaceNormal(_posVec))
    const { forward: tangentForward, right: tangentRight } = getTangentBasis(_normal)

    _direction.set(0, 0, 0)

    if (isReading) {
      // Waiting animation handled via animState below — no movement
    } else if (isTourActive) {
      // ── GUIDED TOUR: follow waypoint array with adaptive waiting (Q117) ──
      const visVec = new Vector3(
        visitorPosition[0],
        visitorPosition[1],
        visitorPosition[2]
      )
      const distToVisitor = _posVec.distanceTo(visVec)

      // Q117: If separation exceeds 5m, pause and face visitor; resume when visitor <= 2.5m
      if (distToVisitor > 5.0) {
        isWaitingForVisitorRef.current = true
      } else if (distToVisitor <= 2.5) {
        isWaitingForVisitorRef.current = false
      }

      if (isWaitingForVisitorRef.current) {
        // Turn to face visitor while waiting
        const faceVisDir = projectOntoTangentPlane(visVec.clone().sub(_posVec), _normal)
        if (faceVisDir.lengthSq() > 0.01) {
          faceVisDir.normalize()
          yawRef.current = Math.atan2(
            faceVisDir.dot(tangentRight),
            faceVisDir.dot(tangentForward)
          )
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
          }
        }
      }
    } else {
      // ── FREE ROAM: follow visitor, offset to the right ─
      const visVec = new Vector3(
        visitorPosition[0],
        visitorPosition[1],
        visitorPosition[2]
      )
      // Offset along the tangent "right" direction on the sphere surface
      const offsetTarget = visVec.clone().add(tangentRight.clone().multiplyScalar(CHARACTER_OFFSET_X))
      const dist = _posVec.distanceTo(offsetTarget)

      // Catch-up teleport if too far
      if (dist > CATCH_UP_DISTANCE) {
        bodyRef.current.setTranslation(
          { x: offsetTarget.x, y: offsetTarget.y, z: offsetTarget.z },
          true
        )
        return
      }

      if (dist > TETHER_DISTANCE) {
        _direction.copy(offsetTarget).sub(_posVec)
        _direction.copy(projectOntoTangentPlane(_direction, _normal))
        _direction.normalize().multiplyScalar(ABDULRAHMAN_SPEED)
      }
    }

    // ── APPLY TANGENT-PLANE VELOCITY ─────────────────────
    _tangentVel.copy(projectOntoTangentPlane(_direction, _normal))

    const currentVel = bodyRef.current.linvel()
    const currentVelVec = new Vector3(currentVel.x, currentVel.y, currentVel.z)
    const radialSpeed = currentVelVec.dot(_normal)

    const finalVel = _tangentVel.clone().add(_normal.clone().multiplyScalar(radialSpeed))
    bodyRef.current.setLinvel(
      { x: finalVel.x, y: finalVel.y, z: finalVel.z },
      true
    )

    // ── FACING & ALIGNMENT ───────────────────────────────
    const speed = _direction.length()
    if (speed > 0.1) {
      const facingDir = projectOntoTangentPlane(_direction, _normal).normalize()
      yawRef.current = Math.atan2(
        facingDir.dot(tangentRight),
        facingDir.dot(tangentForward)
      )
    }

    // Align body "up" to surface normal + apply yaw
    _qAlign.setFromUnitVectors(_upRef, _normal)
    const qYaw = new Quaternion().setFromAxisAngle(_normal, yawRef.current)
    _qAlign.premultiply(qYaw)
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

    setAbdulrahmanPosition([pos.x, pos.y, pos.z])
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
      <CapsuleCollider
        args={[CHARACTER_CAPSULE_HEIGHT / 2, CHARACTER_CAPSULE_RADIUS]}
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