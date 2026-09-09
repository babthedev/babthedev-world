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

const isLowPower = typeof window !== 'undefined' && navigator.hardwareConcurrency <= 4

export default function Scene() {
  console.log('Scene rendering')
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
      <fog attach="fog" color={PAPER_BACKGROUND} near={FOG_NEAR} far={FOG_FAR} />

      {/* ── LIGHTING ─────────────────────────────────────
          Slightly reduced directional intensity vs a dark-bg scene —
          bright light on a light background washes out toon steps.
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
        <PaperCranes />
      </Suspense>

      {/* ── POST-PROCESSING ──────────────────────────────
          SMAA: subpixel morphological AA that respects toon edges.
          SobelOutline: depth-based edge detection pass, draws the
          ink-style outlines around every mesh in the scene.
      ──────────────────────────────────────────────────── */}
      <EffectComposer multisampling={0}>
        <SMAA />
        <SobelOutline />
        <PaperGrain />
        {!isLowPower && <Squigglevision />}
      </EffectComposer>
    </Canvas>
  )
}