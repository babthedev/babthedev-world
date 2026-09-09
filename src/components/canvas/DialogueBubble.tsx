'use client'

import { Html } from '@react-three/drei'
import { useWorldStore } from '@/store/useWorldStore'

export default function DialogueBubble() {
  const currentDialogue = useWorldStore((s) => s.currentDialogue)

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
        {/* Bubble body — brutalist, matches messenger's speech box */}
        <div className="bg-white border-2 border-black text-black px-4 py-2.5 font-inter text-sm leading-snug max-w-[220px] text-center whitespace-pre-wrap">
  {currentDialogue}
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