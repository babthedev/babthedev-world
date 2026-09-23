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
import PaperFlecks from './PaperFlecks'
import FootstepPuffs from './FootstepPuffs'
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
      onCreated={({ gl, scene, camera }) => {
        if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
          ;(window as any).__THREE_SCENE__ = scene
          ;(window as any).__THREE_CAMERA__ = camera
        }
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
        position: [0, 29, -6],
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
        preserveDrawingBuffer: true,
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
      <ambientLight intensity={AMBIENT_INTENSITY} color="#FFFFFF" />
      <directionalLight
        position={[25, 60, -20]}
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
        <PaperFlecks />
        <FootstepPuffs />
      </Suspense>

      {/* ── POST-PROCESSING ────────────────────────────── */}
      <EffectComposer multisampling={0} enableNormalPass>
        <SMAA />
        <SobelOutline />
        <PaperGrain />
        {!isLowPower ? <Squigglevision /> : <></>}
      </EffectComposer>
    </Canvas>
  )
}