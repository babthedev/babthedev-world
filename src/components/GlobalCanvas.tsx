'use client'

import { Suspense } from 'react'
import { KeyboardControls } from '@react-three/drei'
import Scene from '@/components/canvas/Scene'
import IntroDialogue from '@/ui/IntroDialogue'
import InteractHint from '@/ui/InteractHint'
import HUDIcons from '@/ui/HUDIcons'
import DistrictLabel from '@/ui/DistrictLabel'
import ReadingPanel from '@/ui/ReadingPanel'
import SphereCompass from '@/ui/SphereCompass'
import DebugOverlay from '@/ui/DebugOverlay'
import { useTourLogic } from '@/hooks/useTourLogic'

export default function GlobalCanvas() {
  // Global tour-resume logic — lives here since this component
  // is always mounted for the lifetime of the app
  useTourLogic()

  console.log('GlobalCanvas rendering')

  return (
    <div className="fixed inset-0 z-0 bg-[#F2F1EC]">
      {/* ── 3D WORLD ─────────────────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-auto">
        <KeyboardControls
          map={[
            { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
            { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
            { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
            { name: 'right', keys: ['ArrowRight', 'KeyD'] },
          ]}
        >
          <Suspense
            fallback={
              <div className="absolute inset-0 flex items-center justify-center bg-[#F2F1EC] text-black font-mono text-sm tracking-widest">
                LOADING WORLD...
              </div>
            }
          >
            <Scene />
          </Suspense>
        </KeyboardControls>
      </div>

      {/* ── 2D UI LAYER ──────────────────────────────────── 
          All siblings of Canvas, not children — none use useFrame.
          Layered by z-index: hints (20) < labels (20) < panel (30) < intro (30)
      ──────────────────────────────────────────────────── */}
      <InteractHint />
      <DistrictLabel />
      <HUDIcons />
      <ReadingPanel />
      <IntroDialogue />
      <SphereCompass />
      <DebugOverlay />
    </div>
  )
}