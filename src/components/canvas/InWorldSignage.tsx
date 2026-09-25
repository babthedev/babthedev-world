'use client'

import { useMemo } from 'react'
import { flatToSphere } from '@/lib/surfacePlacement'
import SignText from './SignText'

/**
 * In-world directional signage mounted on the Hub's highway signposts (Q87).
 * Uses Signed Distance Field (SDF) text for razor-sharp typography at any angle.
 */
export default function InWorldSignage() {
  // Hub North sign (points toward The Library)
  const northSign = useMemo(() => flatToSphere(0, -8, 2.2), [])
  // Hub West sign (points toward Welcome Terrace)
  const westSign = useMemo(() => flatToSphere(-8, 0, 2.2), [])
  // Hub East sign (points toward Projects Exhibition)
  const eastSign = useMemo(() => flatToSphere(8, 0, 2.2), [])

  return (
    <group>
      {/* ── NORTH SIGN ───────────────────────────────────────── */}
      <group position={northSign.position} quaternion={northSign.quaternion}>
        <SignText
          position={[0, 0, 0]}
          faceOffset={0.1}
          fontSize={0.24}
          color="#0B0B0B"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.12}
        >
          {'^ THE LIBRARY'}
        </SignText>
      </group>

      {/* ── WEST SIGN ────────────────────────────────────────── */}
      <group position={westSign.position} quaternion={westSign.quaternion}>
        <SignText
          position={[0, 0, 0]}
          faceOffset={0.1}
          rotation={[0, Math.PI / 2, 0]}
          fontSize={0.22}
          color="#0B0B0B"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.12}
        >
          {'< TERRACE / BIO'}
        </SignText>
      </group>

      {/* ── EAST SIGN ────────────────────────────────────────── */}
      <group position={eastSign.position} quaternion={eastSign.quaternion}>
        <SignText
          position={[0, 0, 0]}
          faceOffset={0.1}
          rotation={[0, -Math.PI / 2, 0]}
          fontSize={0.22}
          color="#0B0B0B"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.12}
        >
          {'PROJECTS >'}
        </SignText>
      </group>
    </group>
  )
}
