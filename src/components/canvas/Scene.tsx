'use client'

import { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { EffectComposer, SMAA, SSAO, Vignette } from '@react-three/postprocessing'
import AdaptiveQuality from './AdaptiveQuality'
import World from './World'
import CameraController from './CameraController'
import SobelOutline from './SobelOutline'
import Monochrome from './Monochrome'
import PaperGrain from './PaperGrain'
import PaperCranes from './PaperCranes'
import PaperFlecks from './PaperFlecks'
import FootstepPuffs from './FootstepPuffs'
import PaintedSky from './PaintedSky'
import SunRig from './SunRig'
import { useWorldStore } from '@/store/useWorldStore'
import { FEATURE_FLAGS } from '@/lib/featureFlags'
import { QUALITY, getQualityTier } from '@/lib/quality'
import {
  CAMERA_FOV,
  CAMERA_NEAR,
  CAMERA_FAR,
  FOG_NEAR,
  FOG_FAR,
  AMBIENT_INTENSITY,
  SKY_HORIZON_COLOR,
} from '@/lib/constants'

export default function Scene() {
  const isTabHidden = useWorldStore((s) => s.isTabHidden)
  const setContextLost = useWorldStore((s) => s.setContextLost)
  const quality = useMemo(() => QUALITY[getQualityTier()], [])
  // ?shadows=soft blurs shadow edges, for comparing against the hard cel look
  const softShadows = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('shadows') === 'soft'
  // ?ao=on turns ambient occlusion on, for looking at it (off by default, see quality.ts)
  const aoRequested = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('ao') === 'on'

  return (
    <Canvas
      // Hard-edged PCF (no soft blur) — PCFSoftShadowMap is deprecated in r184
      shadows="percentage"
      frameloop={isTabHidden ? 'never' : 'always'}
      onCreated={({ gl, scene, camera }) => {
        if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
          ;(window as unknown as Record<string, unknown>).__THREE_SCENE__ = scene
          ;(window as unknown as Record<string, unknown>).__THREE_CAMERA__ = camera
          ;(window as unknown as Record<string, unknown>).__THREE_RENDERER__ = gl
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
          ? Math.min(window.devicePixelRatio, quality.maxPixelRatio)
          : 1
      }
    >
      {/* ── SKY & ATMOSPHERE ─────────────────────────── */}
      <color attach="background" args={[SKY_HORIZON_COLOR]} />
      {/* Fog matches the horizon tone so distant rooftops dissolve into sky */}
      <fog attach="fog" args={[SKY_HORIZON_COLOR, FOG_NEAR, FOG_FAR]} />

      {/* ── LIGHTING ─────────────────────────────────────
          Ambient sets the shadow tone; the sun rig adds the lit tone and
          follows the visitor so every district gets the same light.
      ──────────────────────────────────────────────────── */}
      <ambientLight intensity={AMBIENT_INTENSITY} color="#FFFFFF" />
      <SunRig mapSize={quality.shadowMapSize} softShadows={softShadows} />

      {/* Keeps the frame rate steady on weaker devices by trading pixel density, not features */}
      <AdaptiveQuality maxDpr={quality.maxPixelRatio} />

      {/* ── CAMERA ───────────────────────────────────── */}
      <CameraController />

      {/* ── WORLD ────────────────────────────────────── */}
      <Suspense fallback={null}>
        <World />
        <PaintedSky />
        {FEATURE_FLAGS.AMBIENT_PAPER && (
          <>
            <PaperCranes />
            <PaperFlecks />
          </>
        )}
        <FootstepPuffs />
      </Suspense>

      {/* ── POST-PROCESSING ──────────────────────────────
          Grade to monochrome first so ink is always the darkest value,
          then ink lines (with 12fps boil), grain, and SMAA last so the
          lines themselves are anti-aliased.
      ──────────────────────────────────────────────────── */}
      <EffectComposer multisampling={0} enableNormalPass={quality.normalPass}>
        {(quality.ao || aoRequested) && quality.normalPass ? (
          <SSAO resolutionScale={0.5} samples={14} rings={4} radius={0.09} intensity={9} bias={0.03} luminanceInfluence={0.45} distanceScaling worldDistanceThreshold={40} worldDistanceFalloff={20} worldProximityThreshold={0.6} worldProximityFalloff={0.4} />
        ) : <></>}
        <Monochrome />
        <SobelOutline />
        <Vignette eskil={false} offset={0.32} darkness={0.42} />
        <PaperGrain />
        {quality.smaa ? <SMAA /> : <></>}
      </EffectComposer>
    </Canvas>
  )
}
