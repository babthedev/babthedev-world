'use client'

import { useState, useEffect, useRef } from 'react'
import { Html } from '@react-three/drei'
import { useWorldStore } from '@/store/useWorldStore'
import { useAudioManager } from '@/hooks/useAudioManager'

export default function DialogueBubble() {
  const currentDialogue = useWorldStore((s) => s.currentDialogue)
  const { playDialogueBlip } = useAudioManager()

  const [displayedText, setDisplayedText] = useState('')
  const indexRef = useRef(0)

  // ── Q137: TYPEWRITER TEXT STREAMING WITH 12Hz MARIMBA BLIPS ──
  useEffect(() => {
    if (!currentDialogue) {
      setDisplayedText('')
      indexRef.current = 0
      return
    }

    setDisplayedText('')
    indexRef.current = 0

    const interval = setInterval(() => {
      indexRef.current++
      if (indexRef.current <= currentDialogue.length) {
        setDisplayedText(currentDialogue.slice(0, indexRef.current))
        const char = currentDialogue[indexRef.current - 1]
        // Play warm acoustic blip for alphanumeric characters
        if (char && char.trim()) {
          const pitchOffset = ((indexRef.current % 5) - 2) * 0.15
          playDialogueBlip(pitchOffset)
        }
      } else {
        clearInterval(interval)
      }
    }, 55)

    return () => clearInterval(interval)
  }, [currentDialogue, playDialogueBlip])

  if (!currentDialogue) return null

  return (
    <Html
      position={[0, 2.2, 0]}
      center
      occlude
      distanceFactor={8}
      // Prevents bubble from blocking clicks on props behind it
      style={{ pointerEvents: 'none' }}
    >
      <div className="relative">
        {/* Bubble body — brutalist speech box with hard drop shadow */}
        <div className="bg-white border-2 border-black text-black px-4 py-2.5 font-inter text-sm leading-snug max-w-[240px] text-center whitespace-pre-wrap shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] select-none">
          {displayedText}
        </div>
        <div
          className="absolute left-1/2 -translate-x-1/2 -bottom-[9px] w-0 h-0"
          style={{
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '9px solid #0B0B0B',
          }}
        />
        <div
          className="absolute left-1/2 -translate-x-1/2 -bottom-[6px] w-0 h-0"
          style={{
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '7px solid #F5F5F5',
          }}
        />
      </div>
    </Html>
  )
}