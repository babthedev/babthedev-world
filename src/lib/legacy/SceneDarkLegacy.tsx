// ============================================================
// ARCHIVED LEGACY CODE — Original Dark Scene Configuration
// Preserved per Q91 in docs/alignment_plan.md.
// Active scene uses monochrome paper-ink brutalist style.
// ============================================================

'use client'

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { EffectComposer, SMAA } from '@react-three/postprocessing'
import World from '@/components/canvas/World'
import CameraController from '@/components/canvas/CameraController'
import {
  CAMERA_FOV,
  CAMERA_NEAR,
  CAMERA_FAR,
  MAX_PIXEL_RATIO,
  SHADOW_MAP_SIZE,
  FOG_NEAR,
  FOG_FAR,
  AMBIENT_INTENSITY,
  DIRECTIONAL_INTENSITY,
} from '@/lib/constants'

export default function SceneDarkLegacy() {
  return (
    <Canvas
      shadows
      camera={{
        position: [0, 4, -6],
        fov: CAMERA_FOV,
        near: CAMERA_NEAR,
        far: CAMERA_FAR,
      }}
      gl={{
        antialias: false,
        alpha: false,
        powerPreference: 'high-performance',
      }}
      dpr={
        typeof window !== 'undefined'
          ? Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO)
          : 1
      }
    >
      <color attach="background" args={['#0B0B0B']} />
      <fog attach="fog" args={['#0B0B0B', FOG_NEAR, FOG_FAR]} />

      <ambientLight intensity={AMBIENT_INTENSITY} color="#FFFFFF" />
      <directionalLight
        position={[15, 25, -10]}
        intensity={DIRECTIONAL_INTENSITY}
        color="#FFFFFF"
        castShadow
        shadow-mapSize-width={SHADOW_MAP_SIZE}
        shadow-mapSize-height={SHADOW_MAP_SIZE}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
        shadow-camera-near={0.5}
        shadow-camera-far={200}
        shadow-bias={-0.0001}
      />
      <directionalLight
        position={[-10, 10, 10]}
        intensity={0.15}
        color="#C8C8C8"
      />

      <CameraController />

      <Suspense fallback={null}>
        <World />
      </Suspense>

      <EffectComposer multisampling={0}>
        <SMAA />
      </EffectComposer>
    </Canvas>
  )
}
