'use client';

import { Html } from '@react-three/drei';
import { useWorldStore } from '@/store/useWorldStore';

export default function DialogueBubble() {
  const currentDialogue = useWorldStore((state) => state.currentDialogue);

  if (!currentDialogue) return null;

  return (
    <Html position={[0, 1.5, 0]} center>
      <div className="bg-black text-white border-2 border-white p-3 max-w-xs text-center font-inter drop-shadow-md whitespace-pre-wrap pointer-events-none">
        {currentDialogue}
      </div>
    </Html>
  );
}
