// ── ORIGINAL DARK SCENE (kept for reference) ──────────────────
// 'use client'

// import { Suspense } from 'react'
// import { Canvas } from '@react-three/fiber'
// import { EffectComposer, SMAA } from '@react-three/postprocessing'
// import World from './World'
// import CameraController from './CameraController'
// import {
//   CAMERA_FOV,
//   CAMERA_NEAR,
//   CAMERA_FAR,
//   MAX_PIXEL_RATIO,
//   SHADOW_MAP_SIZE,
//   FOG_NEAR,
//   FOG_FAR,
//   AMBIENT_INTENSITY,
//   DIRECTIONAL_INTENSITY,
// } from '@/lib/constants'

// export default function Scene() {
//   return (
//     <Canvas
//       shadows
//       // Start camera behind spawn point at street level
//       camera={{
//         position: [0, 4, -6],
//         fov: CAMERA_FOV,
//         near: CAMERA_NEAR,
//         far: CAMERA_FAR,
//       }}
//       gl={{
//         // Disable MSAA — preserves raw toon/sketch edge look
//         // SMAA post-process handles AA instead
//         antialias: false,
//         alpha: false,
//         powerPreference: 'high-performance',
//       }}
//       dpr={
//         typeof window !== 'undefined'
//           ? Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO)
//           : 1
//       }
//     >
//       {/* ── WORLD BACKGROUND ───────────────────────── */}
//       <color attach="background" args={['#0B0B0B']} />
//       <fog attach="fog" args={['#0B0B0B', FOG_NEAR, FOG_FAR]} />

//       {/* ── TOON LIGHTING ───────────────────────────
//           Single hard directional light + very low ambient.
//           This contrast is what makes MeshToonMaterial pop.
//           Soft fills are intentionally avoided.
//       ──────────────────────────────────────────────── */}
//       <ambientLight intensity={AMBIENT_INTENSITY} color="#FFFFFF" />
//       <directionalLight
//         position={[15, 25, -10]}
//         intensity={DIRECTIONAL_INTENSITY}
//         color="#FFFFFF"
//         castShadow
//         shadow-mapSize-width={SHADOW_MAP_SIZE}
//         shadow-mapSize-height={SHADOW_MAP_SIZE}
//         shadow-camera-left={-80}
//         shadow-camera-right={80}
//         shadow-camera-top={80}
//         shadow-camera-bottom={-80}
//         shadow-camera-near={0.5}
//         shadow-camera-far={200}
//         shadow-bias={-0.0001}
//       />
//       {/* Weak fill from opposite side — prevents pure black shadows */}
//       <directionalLight
//         position={[-10, 10, 10]}
//         intensity={0.15}
//         color="#C8C8C8"
//       />

//       {/* ── CAMERA ──────────────────────────────────── */}
//       <CameraController />

//       {/* ── WORLD ───────────────────────────────────── */}
//       <Suspense fallback={null}>
//         <World />
//       </Suspense>

//       {/* ── POST-PROCESSING ─────────────────────────
//           SMAA: subpixel morphological AA — works correctly
//           with toon shading unlike MSAA which blurs cel edges.
//           Additional effects (Vignette, grain) added in later files.
//       ──────────────────────────────────────────────── */}
//       <EffectComposer multisampling={0}>
//         <SMAA />
//       </EffectComposer>
//     </Canvas>
//   )
// }
// ── END ORIGINAL DARK SCENE ────────────────────────────────────

'use client'

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { EffectComposer, SMAA } from '@react-three/postprocessing'
import World from './World'
import CameraController from './CameraController'
import SobelOutline from './SobelOutline'
import Squigglevision from './Squigglevision'
import PaperGrain from './PaperGrain'
import PaperCranes from './PaperCranes'
import GradientSkyDome from './GradientSkyDome'
import { useWorldStore } from '@/store/useWorldStore'
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
  PAPER_BACKGROUND,
} from '@/lib/constants'

const isLowPower =
  typeof window !== 'undefined' && navigator.hardwareConcurrency <= 4

export default function Scene() {
  const isTabHidden = useWorldStore((s) => s.isTabHidden)
  const setContextLost = useWorldStore((s) => s.setContextLost)

  return (
    <Canvas
      shadows
      frameloop={isTabHidden ? 'never' : 'always'}
      onCreated={({ gl }) => {
        const dom = gl.domElement
        // Q90: Automated webglcontextlost recovery
        dom.addEventListener('webglcontextlost', (e) => {
          e.preventDefault()
          console.warn('WebGL context lost. Attempting recovery...')
          setContextLost(true)
        })
        dom.addEventListener('webglcontextrestored', () => {
          console.info('WebGL context successfully restored.')
          setContextLost(false)
        })
      }}
      camera={{
        position: [0, 4, -6],
        fov: CAMERA_FOV,
        near: CAMERA_NEAR,
        far: CAMERA_FAR,
      }}
      gl={{
        // Disable MSAA — SMAA post-process handles AA instead,
        // preserving hard cel-shading edges
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
      {/* ── PAPER BACKGROUND ─────────────────────────── */}
      <color attach="background" args={[PAPER_BACKGROUND]} />
      {/* fog args map directly to THREE.Fog(color, near, far) constructor */}
      <fog attach="fog" args={[PAPER_BACKGROUND, FOG_NEAR, FOG_FAR]} />

      {/* ── LIGHTING ─────────────────────────────────────
          Slightly reduced directional intensity vs the dark-bg version —
          bright light on a light background washes out the toon steps otherwise.
      ──────────────────────────────────────────────────── */}
      <ambientLight intensity={AMBIENT_INTENSITY + 0.15} color="#FFFFFF" />
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
      {/* Weak fill from opposite side — prevents pure-black shadows */}
      <directionalLight position={[-10, 10, 10]} intensity={0.1} color="#C8C8C8" />

      {/* ── CAMERA ───────────────────────────────────── */}
      <CameraController />

      {/* ── WORLD ────────────────────────────────────── */}
      <Suspense fallback={null}>
        <World />
        <GradientSkyDome />
        <PaperCranes />
      </Suspense>

      {/* ── POST-PROCESSING ──────────────────────────────
          SMAA: subpixel morphological AA that respects toon edges.
          SobelOutline: depth-based edge detection draws ink outlines.
          PaperGrain: subtle film grain over the paper background.
          Squigglevision: hand-drawn line wobble (skipped on low-power devices).
      ──────────────────────────────────────────────────── */}
      <EffectComposer multisampling={0} enableNormalPass>
        <SMAA />
        <SobelOutline />
        <PaperGrain />
        {!isLowPower ? <Squigglevision /> : <></>}
      </EffectComposer>
    </Canvas>
  )
}