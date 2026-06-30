'use client';

import { Suspense } from 'react';
import { KeyboardControls } from '@react-three/drei';
import Scene from '@/components/canvas/Scene';

export default function GlobalCanvas() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-auto bg-black">
      <KeyboardControls
        map={[
          { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
          { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
          { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
          { name: 'right', keys: ['ArrowRight', 'KeyD'] },
          { name: 'run', keys: ['Shift'] },
        ]}
      >
        <Suspense fallback={<div className="absolute inset-0 flex items-center justify-center text-white">Loading World...</div>}>
          <Scene />
        </Suspense>
      </KeyboardControls>
    </div>
  );
}
