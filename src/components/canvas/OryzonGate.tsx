'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import { useWorldStore } from '@/store/useWorldStore'
import { ORYZON_GATE_POSITION } from '@/lib/worldCoordinates'
import { SPECIAL_DIALOGUES, calcDialogueDuration } from '@/lib/dialogue'
import { flatToSphere } from '@/lib/surfacePlacement'
import { FEATURE_FLAGS } from '@/lib/featureFlags'

const GATE_TRIGGER_RADIUS = 6
const _visitorVec = new Vector3()

export default function OryzonGate() {
  const position = useWorldStore((s) => s.position)
  const setCurrentDialogue = useWorldStore((s) => s.setCurrentDialogue)
  const hasTriggered = useRef(false)

  // Project the flat-world gate position onto the sphere surface
  const sphereGatePos = useMemo(() => {
    const { position: pos } = flatToSphere(
      ORYZON_GATE_POSITION[0],
      ORYZON_GATE_POSITION[2],
      ORYZON_GATE_POSITION[1]
    )
    return new Vector3(...pos)
  }, [])

  useFrame(() => {
    _visitorVec.set(position[0], position[1], position[2])
    const dist = _visitorVec.distanceTo(sphereGatePos)

    if (dist < GATE_TRIGGER_RADIUS && !hasTriggered.current) {
      hasTriggered.current = true
      const text = FEATURE_FLAGS.ORYZON_OPEN
        ? "Oryzon is officially open. Come see what we've built."
        : SPECIAL_DIALOGUES.oryzon_gate.text
      setCurrentDialogue(text)
      setTimeout(() => setCurrentDialogue(null), calcDialogueDuration(text))
    }

    // Reset trigger once visitor walks far enough away —
    // allows the line to replay on a future approach
    if (dist > GATE_TRIGGER_RADIUS * 2.5 && hasTriggered.current) {
      hasTriggered.current = false
    }
  })

  return null
}