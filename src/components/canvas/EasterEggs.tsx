'use client'

import { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { Vector3, Group, Texture } from 'three'
import { flatToSphere } from '@/lib/surfacePlacement'
import { useWorldStore } from '@/store/useWorldStore'
import { useAudioManager } from '@/hooks/useAudioManager'
import { SPECIAL_DIALOGUES } from '@/lib/dialogue'

interface EasterEggsProps {
  gradientMap?: Texture
}

const _posA = new Vector3()
const _posB = new Vector3()
const _visPos = new Vector3()

export default function EasterEggs({ gradientMap: _gradientMap }: EasterEggsProps) {
  const visitorPosition = useWorldStore((s) => s.position)
  const setCurrentDialogue = useWorldStore((s) => s.setCurrentDialogue)
  const { playPageTurn, playClick } = useAudioManager()

  // Proximity states
  const [nearSketchPad, setNearSketchPad] = useState(false)
  const [nearCraneNest, setNearCraneNest] = useState(false)

  // Dialogue timer ref
  const dialogueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── 1. SKETCH PAD ON CRATE BEHIND LIBRARY ──────────────────
  // Flat position: [-6, 0, -50]
  const sketchPadTransform = useMemo(() => {
    return flatToSphere(-6, -50, 0, 0.2)
  }, [])

  // ── 2. CRANE NEST ON CAFE ROOFTOP AWNING ───────────────────
  // Flat position: [-43, -4], Height: 3.6m
  const craneNestTransform = useMemo(() => {
    return flatToSphere(-43, -4, 3.6, -0.4)
  }, [])

  // Mesh animation refs for Q70 proximity sine bob
  const sketchMeshRef = useRef<Group>(null)
  const nestMeshRef = useRef<Group>(null)

  useFrame((state) => {
    _visPos.set(visitorPosition[0], visitorPosition[1], visitorPosition[2])

    // Check distance to sketch pad
    _posA.set(
      sketchPadTransform.position[0],
      sketchPadTransform.position[1],
      sketchPadTransform.position[2]
    )
    const distA = _posA.distanceTo(_visPos)
    const isNearA = distA < 2.8
    if (isNearA !== nearSketchPad) {
      setNearSketchPad(isNearA)
    }

    // Check distance to crane nest (wider detection because it's elevated)
    _posB.set(
      craneNestTransform.position[0],
      craneNestTransform.position[1],
      craneNestTransform.position[2]
    )
    const distB = _posB.distanceTo(_visPos)
    const isNearB = distB < 4.2
    if (isNearB !== nearCraneNest) {
      setNearCraneNest(isNearB)
    }

    // Subtle 2.5cm proximity sine bob
    const t = state.clock.getElapsedTime()
    if (sketchMeshRef.current && isNearA) {
      sketchMeshRef.current.position.y = Math.sin(t * 3.0) * 0.025
    } else if (sketchMeshRef.current) {
      sketchMeshRef.current.position.y = 0
    }

    if (nestMeshRef.current && isNearB) {
      nestMeshRef.current.position.y = Math.sin(t * 3.0) * 0.025
    } else if (nestMeshRef.current) {
      nestMeshRef.current.position.y = 0
    }
  })

  // Trigger inspect actions
  const inspectSketchPad = useCallback(() => {
    playPageTurn()
    if (dialogueTimerRef.current) clearTimeout(dialogueTimerRef.current)
    setCurrentDialogue(SPECIAL_DIALOGUES.sketch_pad.text)
    dialogueTimerRef.current = setTimeout(() => {
      setCurrentDialogue(null)
    }, 7000)
  }, [playPageTurn, setCurrentDialogue])

  const inspectCraneNest = useCallback(() => {
    playClick()
    if (dialogueTimerRef.current) clearTimeout(dialogueTimerRef.current)
    setCurrentDialogue(SPECIAL_DIALOGUES.crane_nest.text)
    dialogueTimerRef.current = setTimeout(() => {
      setCurrentDialogue(null)
    }, 7000)
  }, [playClick, setCurrentDialogue])

  // Listen for 'E' keypress
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyE') {
        if (nearSketchPad) {
          inspectSketchPad()
        } else if (nearCraneNest) {
          inspectCraneNest()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (dialogueTimerRef.current) clearTimeout(dialogueTimerRef.current)
    }
  }, [nearSketchPad, nearCraneNest, inspectSketchPad, inspectCraneNest])

  return (
    <group name="environmental-easter-eggs">
      {/* ── 1. SKETCH PAD ON CRATE BEHIND LIBRARY ── */}
      <group
        position={sketchPadTransform.position}
        quaternion={sketchPadTransform.quaternion}
      >
        <group ref={sketchMeshRef}>
          {/* Wooden storage crate */}
          <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.8, 0.7, 0.8]} />
            <meshStandardMaterial color="#2B2620" roughness={0.9} />
          </mesh>
          {/* Crate rim trim */}
          <mesh position={[0, 0.71, 0]}>
            <boxGeometry args={[0.84, 0.04, 0.84]} />
            <meshStandardMaterial color="#1A1815" />
          </mesh>

          {/* Open Sketchbook resting on top */}
          <group position={[0, 0.74, 0]} rotation={[0, 0.25, 0]}>
            {/* Book cover base */}
            <mesh position={[0, 0.01, 0]}>
              <boxGeometry args={[0.48, 0.015, 0.36]} />
              <meshStandardMaterial color="#111111" />
            </mesh>
            {/* Left page (paper cream) */}
            <mesh position={[-0.11, 0.022, 0]} rotation={[0, 0, 0.04]}>
              <boxGeometry args={[0.22, 0.01, 0.34]} />
              <meshStandardMaterial color="#FAF9F5" />
            </mesh>
            {/* Right page (paper cream) */}
            <mesh position={[0.11, 0.022, 0]} rotation={[0, 0, -0.04]}>
              <boxGeometry args={[0.22, 0.01, 0.34]} />
              <meshStandardMaterial color="#FAF9F5" />
            </mesh>
            {/* Ink architectural sketches on right page */}
            <mesh position={[0.11, 0.028, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.16, 0.24]} />
              <meshBasicMaterial color="#222222" transparent opacity={0.8} />
            </mesh>
            {/* Pencil resting across spine */}
            <mesh position={[-0.14, 0.035, 0.12]} rotation={[0, 0.4, 0]}>
              <cylinderGeometry args={[0.008, 0.008, 0.22, 6]} />
              <meshStandardMaterial color="#C28A4A" />
            </mesh>
          </group>
        </group>

        {/* Proximity prompt */}
        {nearSketchPad && (
          <Html position={[0, 1.3, 0]} center distanceFactor={10} occlude>
            <button
              onClick={inspectSketchPad}
              className="bg-black text-white border-2 border-white px-3 py-1 font-mono text-xs tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-white hover:text-black cursor-pointer select-none transition-colors whitespace-nowrap"
            >
              [E] Inspect Sketchbook
            </button>
          </Html>
        )}
      </group>

      {/* ── 2. CRANE NEST ON CAFE ROOFTOP AWNING ── */}
      <group
        position={craneNestTransform.position}
        quaternion={craneNestTransform.quaternion}
      >
        <group ref={nestMeshRef}>
          {/* Woven twig basket / nest bowl */}
          <mesh position={[0, 0.08, 0]} castShadow>
            <cylinderGeometry args={[0.32, 0.22, 0.16, 12]} />
            <meshStandardMaterial color="#3A2E24" roughness={1.0} />
          </mesh>
          {/* Nest rim twigs */}
          <mesh position={[0, 0.16, 0]}>
            <torusGeometry args={[0.3, 0.05, 6, 12]} />
            <meshStandardMaterial color="#292019" roughness={1.0} />
          </mesh>

          {/* Paper origami crane inside nest */}
          <group position={[0.04, 0.19, 0]} rotation={[0.1, 0.5, 0]} scale={0.45}>
            {/* Crane central diamond body */}
            <mesh>
              <coneGeometry args={[0.25, 0.5, 4]} />
              <meshStandardMaterial color="#FAF9F5" roughness={0.4} />
            </mesh>
            {/* Left wing */}
            <mesh position={[-0.28, 0.05, 0]} rotation={[0, 0, 0.35]}>
              <boxGeometry args={[0.42, 0.02, 0.22]} />
              <meshStandardMaterial color="#F2EFE9" />
            </mesh>
            {/* Right wing */}
            <mesh position={[0.28, 0.05, 0]} rotation={[0, 0, -0.35]}>
              <boxGeometry args={[0.42, 0.02, 0.22]} />
              <meshStandardMaterial color="#F2EFE9" />
            </mesh>
          </group>

          {/* Two tiny paper crane eggs */}
          <mesh position={[-0.1, 0.14, 0.06]} scale={[0.045, 0.065, 0.045]}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshStandardMaterial color="#EAE7DF" />
          </mesh>
          <mesh position={[-0.03, 0.14, -0.08]} scale={[0.045, 0.065, 0.045]}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshStandardMaterial color="#EAE7DF" />
          </mesh>
        </group>

        {/* Proximity prompt */}
        {nearCraneNest && (
          <Html position={[0, 0.8, 0]} center distanceFactor={10} occlude>
            <button
              onClick={inspectCraneNest}
              className="bg-black text-white border-2 border-white px-3 py-1 font-mono text-xs tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-white hover:text-black cursor-pointer select-none transition-colors whitespace-nowrap"
            >
              [E] Inspect Crane Nest
            </button>
          </Html>
        )}
      </group>
    </group>
  )
}
