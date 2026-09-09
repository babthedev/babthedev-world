'use client'

import { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, RapierRigidBody, CapsuleCollider } from '@react-three/rapier'
import { Vector3, Group, DataTexture, RedFormat, Texture } from 'three'
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
} from '@/lib/constants'

const gradientMap = new DataTexture(
  TOON_GRADIENT_STEPS,
  TOON_GRADIENT_STEPS.length,
  1,
  RedFormat
)
gradientMap.needsUpdate = true

const _target = new Vector3()
const _direction = new Vector3()

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
    const abdulVec = new Vector3(pos.x, pos.y, pos.z)

    _direction.set(0, 0, 0)

    if (isReading) {
      // Waiting animation handled via animState below — no movement
    } else if (isTourActive) {
      // ── GUIDED TOUR: follow waypoint array ──────────
      const waypoint = TOUR_WAYPOINTS[tourWaypointIndex]
      if (waypoint) {
        _target.set(waypoint.position[0], pos.y, waypoint.position[2])
        const dist = abdulVec.distanceTo(_target)

        if (dist > TETHER_DISTANCE) {
          _direction.copy(_target).sub(abdulVec)
          _direction.y = 0
          _direction.normalize().multiplyScalar(ABDULRAHMAN_SPEED)
        } else if (
          tourWaypointIndex < TOUR_WAYPOINTS.length - 1 &&
          dist < TETHER_DISTANCE
        ) {
          setTourWaypointIndex(tourWaypointIndex + 1)
        }
      }
    } else {
      // ── FREE ROAM: follow visitor, offset to the right ─
      const visVec = new Vector3(
        visitorPosition[0] + CHARACTER_OFFSET_X,
        pos.y,
        visitorPosition[2]
      )
      const dist = abdulVec.distanceTo(visVec)

      // Catch-up teleport if too far (masked by smoke puff — VFX added later)
      if (dist > CATCH_UP_DISTANCE) {
        bodyRef.current.setTranslation(
          { x: visVec.x, y: pos.y, z: visVec.z },
          true
        )
        return
      }

      if (dist > TETHER_DISTANCE) {
        _direction.copy(visVec).sub(abdulVec)
        _direction.y = 0
        _direction.normalize().multiplyScalar(ABDULRAHMAN_SPEED)
      }
    }

    const currentVel = bodyRef.current.linvel()
    bodyRef.current.setLinvel(
      { x: _direction.x, y: currentVel.y, z: _direction.z },
      true
    )

    const speed = _direction.length()
    if (speed > 0.1) {
      const angle = Math.atan2(_direction.x, _direction.z)
      modelRef.current.rotation.y = angle
    }

    const nextAnim = updateFromVelocity(
      speed,
      ABDULRAHMAN_SPEED
    ) as 'idle' | 'walk'
    if (nextAnim !== animStateRef.current) {
      animStateRef.current = nextAnim
      setAnimName(nextAnim)
    }

    setAbdulrahmanPosition([pos.x, pos.y, pos.z])
  })

  return (
    <RigidBody
      name="abdulrahman"
      ref={bodyRef}
      position={[CHARACTER_OFFSET_X, 1, 0]}
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