'use client'

import { useMemo } from 'react'
import { Text, useGLTF } from '@react-three/drei'
import { Mesh, MeshToonMaterial, Texture } from 'three'
import { flatToSphere } from '@/lib/surfacePlacement'

interface DistrictGatewaysProps {
  gradientMap: Texture
}

/**
 * Architectural overhead gateways marking entry into narrative chapters (Q135).
 * - The Library: Brutalist stone arch with SDF typography
 * - Welcome Terrace: Pergola with lanterns
 * - Oryzon: Industrial security barrier with warning signage
 */
export default function DistrictGateways({ gradientMap }: DistrictGatewaysProps) {
  const pillarGlb = useGLTF('/kenney/bridge-pillar-wide.glb')
  const barrierGlb = useGLTF('/kenney/construction-barrier.glb')

  const stoneMaterial = useMemo(
    () =>
      new MeshToonMaterial({
        color: '#161616',
        gradientMap,
      }),
    [gradientMap]
  )

  const barrierMaterial = useMemo(
    () =>
      new MeshToonMaterial({
        color: '#D8D8D8',
        gradientMap,
      }),
    [gradientMap]
  )

  // ── 1. THE LIBRARY GATEWAY (North, Z = -22) ──────────────────
  const libraryGate = useMemo(() => {
    return flatToSphere(0, -22, 0)
  }, [])

  // ── 2. WELCOME TERRACE GATEWAY (West, X = -22) ───────────────
  const bioGate = useMemo(() => {
    return flatToSphere(-22, 0, 0)
  }, [])

  // ── 3. ORYZON SECURITY GATEWAY (South, Z = 60) ───────────────
  const oryzonGate = useMemo(() => {
    return flatToSphere(0, 60, 0)
  }, [])

  return (
    <group>
      {/* ── THE LIBRARY STONE ARCHWAY ───────────────────────── */}
      <group position={libraryGate.position} quaternion={libraryGate.quaternion}>
        {/* Left pillar */}
        <primitive
          object={pillarGlb.scene.clone()}
          position={[-3.2, 0, 0]}
          rotation={[0, 0, 0]}
          scale={[1.2, 1.4, 1.2]}
        />
        {/* Right pillar */}
        <primitive
          object={pillarGlb.scene.clone()}
          position={[3.2, 0, 0]}
          rotation={[0, Math.PI, 0]}
          scale={[1.2, 1.4, 1.2]}
        />

        {/* Overhead Lintel Beam */}
        <mesh position={[0, 4.2, 0]} material={stoneMaterial}>
          <boxGeometry args={[7.2, 0.6, 0.8]} />
        </mesh>

        {/* Q87: SDF Signage Text */}
        <Text
          position={[0, 4.2, 0.42]}
          fontSize={0.32}
          color="#F2F1EC"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.2}
          font="/fonts/Inter-Bold.ttf"
        >
          THE LIBRARY
        </Text>
        <Text
          position={[0, 3.8, 0.42]}
          fontSize={0.14}
          color="#A0A0A0"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.15}
        >
          ESSAYS & THOUGHTS
        </Text>
      </group>

      {/* ── WELCOME TERRACE PERGOLA GATEWAY ─────────────────── */}
      <group position={bioGate.position} quaternion={bioGate.quaternion}>
        <primitive
          object={pillarGlb.scene.clone()}
          position={[0, 0, -3.2]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[1.1, 1.3, 1.1]}
        />
        <primitive
          object={pillarGlb.scene.clone()}
          position={[0, 0, 3.2]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[1.1, 1.3, 1.1]}
        />

        {/* Overhead Beam */}
        <mesh position={[0, 4.0, 0]} rotation={[0, Math.PI / 2, 0]} material={stoneMaterial}>
          <boxGeometry args={[7.2, 0.5, 0.7]} />
        </mesh>

        {/* SDF Signage */}
        <Text
          position={[-0.38, 4.0, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          fontSize={0.3}
          color="#F2F1EC"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.2}
        >
          WELCOME TERRACE
        </Text>
      </group>

      {/* ── ORYZON RESTRICTED SECURITY GATEWAY ──────────────── */}
      <group position={oryzonGate.position} quaternion={oryzonGate.quaternion}>
        {/* Barricade across road */}
        <primitive
          object={barrierGlb.scene.clone()}
          position={[-2.2, 0, 0]}
          scale={[1.2, 1.2, 1.2]}
        />
        <primitive
          object={barrierGlb.scene.clone()}
          position={[0, 0, 0]}
          scale={[1.2, 1.2, 1.2]}
        />
        <primitive
          object={barrierGlb.scene.clone()}
          position={[2.2, 0, 0]}
          scale={[1.2, 1.2, 1.2]}
        />

        {/* Danger Warning Signboard */}
        <mesh position={[0, 2.2, 0]} material={stoneMaterial}>
          <boxGeometry args={[4.4, 0.7, 0.1]} />
        </mesh>

        <Text
          position={[0, 2.3, 0.08]}
          fontSize={0.24}
          color="#FFDD55"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.18}
        >
          ORYZON
        </Text>
        <Text
          position={[0, 2.05, 0.08]}
          fontSize={0.12}
          color="#FF5555"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.12}
        >
          RESTRICTED — UNDER CONSTRUCTION
        </Text>
      </group>
    </group>
  )
}
