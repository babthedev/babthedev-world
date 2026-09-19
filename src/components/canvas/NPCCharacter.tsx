'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3, Group, Texture } from 'three'
import { Html } from '@react-three/drei'
import { useWorldStore } from '@/store/useWorldStore'
import CharacterModel from './CharacterModel'
import { NPCLocation } from '@/lib/worldCoordinates'
import { NPC_DIALOGUES } from '@/lib/dialogue'
import { NPC_TRIGGER_RADIUS, NPC_SPEAK_RADIUS, ABDULRAHMAN_COLOR } from '@/lib/constants'

interface NPCCharacterProps {
  npc: NPCLocation
  gradientMap: Texture
}

const _npcPos = new Vector3()
const _visitorPos = new Vector3()

export default function NPCCharacter({ npc, gradientMap }: NPCCharacterProps) {
  const groupRef = useRef<Group>(null)
  const visitorPosition = useWorldStore((s) => s.position)
  const setNearbyNPC = useWorldStore((s) => s.setNearbyNPC)
  const setNpcDialogue = useWorldStore((s) => s.setNpcDialogue)

  // 'thinking' = "..." indicator, 'speaking' = full dialogue line
  const [state, setState] = useState<'idle' | 'thinking' | 'speaking'>('idle')
  const [isLookingAtVisitor, setIsLookingAtVisitor] = useState(false)
  const lineIndex = useRef(0)
  const speakTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useFrame(() => {
    if (!groupRef.current) return

    // 3D Euclidean distance on the 50m sphere
    _npcPos.set(npc.position[0], npc.position[1], npc.position[2])
    _visitorPos.set(visitorPosition[0], visitorPosition[1], visitorPosition[2])
    const dist = _npcPos.distanceTo(_visitorPos)

    // Q102: Head tracking within 4 meters
    const inHeadTrackRange = dist < 4.0
    if (inHeadTrackRange !== isLookingAtVisitor) {
      setIsLookingAtVisitor(inHeadTrackRange)
    }

    // Ambient NPCs have no dialogue/thinking bubbles
    if (npc.ambient) return

    if (dist < NPC_SPEAK_RADIUS) {
      if (state === 'thinking') {
        setState('speaking')
        setNearbyNPC(npc.id)
        startDialogue()
      } else if (state === 'idle') {
        setState('speaking')
        setNearbyNPC(npc.id)
        startDialogue()
      }
    } else if (dist < NPC_TRIGGER_RADIUS) {
      if (state === 'idle') setState('thinking')
    } else {
      if (state !== 'idle') {
        setState('idle')
        setNearbyNPC(null)
        setNpcDialogue(null)
        lineIndex.current = 0
        if (speakTimer.current) clearTimeout(speakTimer.current)
      }
    }
  })

  const startDialogue = useCallback(() => {
    if (npc.ambient || !npc.dialogueKey) return
    const lines = NPC_DIALOGUES[npc.dialogueKey]
    if (!lines || lines.length === 0) return

    const playLine = () => {
      const line = lines[lineIndex.current]
      if (!line) return
      setNpcDialogue(line.text)

      speakTimer.current = setTimeout(() => {
        lineIndex.current++
        if (lineIndex.current < lines.length) {
          playLine()
        }
      }, line.text.length * 60 + 800)
    }
    playLine()
  }, [npc.ambient, npc.dialogueKey, setNpcDialogue])

  useEffect(() => {
    return () => {
      if (speakTimer.current) clearTimeout(speakTimer.current)
    }
  }, [])

  return (
    <group
      ref={groupRef}
      position={npc.position}
      rotation={npc.rotation ?? [0, 0, 0]}
    >
      <CharacterModel
        url={npc.modelUrl || '/joe.vrm'}
        color={ABDULRAHMAN_COLOR}
        gradientMap={gradientMap}
        animationName={npc.seated ? 'sit' : 'idle'}
        characterType={npc.id === 'joe' ? 'joe' : 'npc'}
        lookAtTarget={isLookingAtVisitor ? visitorPosition : null}
      />

      {/* "..." thinking indicator — appears on proximity, before dialogue (non-ambient only) */}
      {!npc.ambient && state === 'thinking' && (
        <Html position={[0, 2, 0]} center distanceFactor={8}>
          <div className="bg-black text-white border-2 border-white px-3 py-1.5 font-mono text-sm tracking-widest animate-pulse select-none">
            •••
          </div>
        </Html>
      )}
    </group>
  )
}