'use client'

import { useRouter, usePathname } from 'next/navigation'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { useWorldStore } from '@/store/useWorldStore'
import { ZONE_DIALOGUES, calcDialogueDuration } from '@/lib/dialogue'
import { DISTRICT_SENSOR_HALF_EXTENT } from '@/lib/constants'
import { useEffect } from 'react'
import { WORLD_COORDINATES, DistrictName } from '@/lib/worldCoordinates'




export default function TriggerZones() {
  const router = useRouter()
  const pathname = usePathname()
  const setCurrentDistrict = useWorldStore((s) => s.setCurrentDistrict)
  const markDistrictVisited = useWorldStore((s) => s.markDistrictVisited)
  const setCurrentDialogue = useWorldStore((s) => s.setCurrentDialogue)
  const setDistrictLabelVisible = useWorldStore((s) => s.setDistrictLabelVisible)
  const visitedDistricts = useWorldStore((s) => s.visitedDistricts)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const path = window.location.pathname as DistrictName
    const knownPaths = Object.keys(WORLD_COORDINATES)
    if (!knownPaths.includes(path) && path !== '/404') {
      router.push('/404', { scroll: false })
    }
  }, [])

  return (
    <>
      {Object.values(WORLD_COORDINATES).map((district) => (
        <RigidBody
          key={district.path}
          type="fixed"
          position={district.sensorPoint}
          sensor
        >
          <CuboidCollider
            args={[
              DISTRICT_SENSOR_HALF_EXTENT,
              DISTRICT_SENSOR_HALF_EXTENT,
              DISTRICT_SENSOR_HALF_EXTENT,
            ]}
            onIntersectionEnter={(payload) => {
              // Only the Visitor triggers zone changes
              if (payload.other.rigidBodyObject?.name !== 'visitor') return
              if (pathname === district.path) return

              // Update spatial + browser URL state (shallow route)
              router.push(district.path, { scroll: false })
              setCurrentDistrict(district.path)
              setDistrictLabelVisible(true)
              setTimeout(() => setDistrictLabelVisible(false), 2000)

              // Zone acknowledgement dialogue — different if revisiting
              const alreadyVisited = visitedDistricts.includes(district.path)
              const dialogueLines = ZONE_DIALOGUES[district.path]
              const text = alreadyVisited
                ? district.revisitDialogue
                : dialogueLines?.[0]?.text ?? district.entryDialogue

              setCurrentDialogue(text)
              setTimeout(() => {
                setCurrentDialogue(null)
              }, calcDialogueDuration(text))

              markDistrictVisited(district.path)
            }}
          />
        </RigidBody>
      ))}
    </>
  )
}