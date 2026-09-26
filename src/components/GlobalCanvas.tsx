'use client'

import { Suspense } from 'react'
import { KeyboardControls } from '@react-three/drei'
import Scene from '@/components/canvas/Scene'
import IntroDialogue from '@/ui/IntroDialogue'
import LoadingScreen from '@/ui/LoadingScreen'
import InteractHint from '@/ui/InteractHint'
import HUDIcons from '@/ui/HUDIcons'
import DistrictLabel from '@/ui/DistrictLabel'
import ReadingPanel from '@/ui/ReadingPanel'
import Minimap from '@/ui/Minimap'
import WorldMap from '@/ui/WorldMap'
import VirtualJoystick from '@/ui/VirtualJoystick'
import DebugOverlay from '@/ui/DebugOverlay'
import InkIrisTransition from '@/ui/InkIrisTransition'
import ContactModal from '@/ui/ContactModal'
import GuestbookModal from '@/ui/GuestbookModal'
import PassportStampToast from '@/ui/PassportStampToast'
import ColophonModal from '@/ui/ColophonModal'
import WebGLErrorBoundary from '@/components/WebGLErrorBoundary'
import { useTourLogic } from '@/hooks/useTourLogic'
import { usePageVisibility } from '@/hooks/usePageVisibility'
import { useAmbience } from '@/hooks/useAmbience'
import { useMouseLook } from '@/hooks/useMouseLook'
import LookHint from '@/ui/LookHint'

export default function GlobalCanvas() {
  // Global tour-resume logic — lives here since this component
  // is always mounted for the lifetime of the app
  useTourLogic()
  usePageVisibility()
  useAmbience()
  useMouseLook()


  return (
    <div className="fixed inset-0 z-0 bg-[#F2F1EC]">
      {/* ── 3D WORLD ─────────────────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-auto touch-none">
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
            <WebGLErrorBoundary>
              <Scene />
            </WebGLErrorBoundary>
          </Suspense>
        </KeyboardControls>
      </div>

      {/* ── 2D UI LAYER ──────────────────────────────────── 
          All siblings of Canvas, not children — none use useFrame.
          Layered by z-index: hints (20) < labels (20) < panel (30) < intro (30) < iris (50)
      ──────────────────────────────────────────────────── */}
      <InteractHint />
      <LookHint />
      <DistrictLabel />
      <HUDIcons />
      <ReadingPanel />
      <ContactModal />
      <GuestbookModal />
      <PassportStampToast />
      <ColophonModal />
      <IntroDialogue />
      <Minimap />
      <WorldMap />
      <VirtualJoystick />
      <DebugOverlay />
      <InkIrisTransition />
      <LoadingScreen />
    </div>
  )
}