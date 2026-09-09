'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import { useWorldStore } from '@/store/useWorldStore'
import { ORYZON_GATE_POSITION } from '@/lib/worldCoordinates'
import { SPECIAL_DIALOGUES, calcDialogueDuration } from '@/lib/dialogue'

const GATE_TRIGGER_RADIUS = 6
const _visitorVec = new Vector3()
const _gateVec = new Vector3(...ORYZON_GATE_POSITION)

export default function OryzonGate() {
  const position = useWorldStore((s) => s.position)
  const setCurrentDialogue = useWorldStore((s) => s.setCurrentDialogue)
  const hasTriggered = useRef(false)

  useFrame(() => {
    _visitorVec.set(position[0], 0, position[2])
    const dist = _visitorVec.distanceTo(_gateVec)

    if (dist < GATE_TRIGGER_RADIUS && !hasTriggered.current) {
      hasTriggered.current = true
      const text = SPECIAL_DIALOGUES.oryzon_gate.text
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