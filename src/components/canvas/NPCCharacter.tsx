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
  // Ambient NPCs are pure decoration — skip all proximity logic entirely
  if (npc.ambient) {
    return (
      <group position={npc.position} rotation={npc.rotation ?? [0, 0, 0]}>
        <CharacterModel
          url={npc.modelUrl || '/joe.vrm'}
          color={ABDULRAHMAN_COLOR}
          gradientMap={gradientMap}
          animationName={npc.seated ? 'sit' : 'idle'}
        />
      </group>
    )
  }
  const groupRef = useRef<Group>(null)
  const visitorPosition = useWorldStore((s) => s.position)
  const setNearbyNPC = useWorldStore((s) => s.setNearbyNPC)
  const setNpcDialogue = useWorldStore((s) => s.setNpcDialogue)

  // 'thinking' = "..." indicator, 'speaking' = full dialogue line
  const [state, setState] = useState<'idle' | 'thinking' | 'speaking'>('idle')
  const lineIndex = useRef(0)
  const speakTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useFrame(() => {
    if (!groupRef.current) return

    _npcPos.set(npc.position[0], 0, npc.position[2])
    _visitorPos.set(visitorPosition[0], 0, visitorPosition[2])
    const dist = _npcPos.distanceTo(_visitorPos)

    if (dist < NPC_SPEAK_RADIUS) {
      if (state === 'thinking') {
        setState('speaking')
        setNearbyNPC(npc.id)
        startDialogue()
      } else if (state === 'idle') {
        // Jump straight to speaking if visitor approaches fast
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
  }, [npc.dialogueKey, npc.id, setNpcDialogue])

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
      />

      {/* "..." thinking indicator — appears on proximity, before dialogue */}
      {state === 'thinking' && (
        <Html position={[0, 2, 0]} center distanceFactor={8} occlude>
          <div className="bg-black text-white border-2 border-white px-3 py-1.5 font-mono text-sm tracking-widest animate-pulse">
            •••
          </div>
        </Html>
      )}
    </group>
  )
}