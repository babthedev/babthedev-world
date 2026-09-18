'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { Group, Mesh, MeshToonMaterial, Texture } from 'three'
import { flatToSphere } from '@/lib/surfacePlacement'
import { useWorldStore } from '@/store/useWorldStore'

interface PhysicalPropsProps {
  gradientMap: Texture
}

/**
 * Specialized physical 3D content representations per alignment plan:
 * - Q112: Hardcover Book with SDF spine title for essays in The Library
 * - Q114: Concrete Project Pedestal with hovering miniature in Projects Exhibition
 * - Q115: Retro CRT Archive Terminal with glowing phosphor text
 */
export default function PhysicalProps({ gradientMap }: PhysicalPropsProps) {
  // Library essay locations (North, Z ~ -42)
  const book1 = useMemo(() => flatToSphere(-4, -42, 0.6), [])
  const book2 = useMemo(() => flatToSphere(4, -42, 0.6), [])

  // Project pedestal locations (East, X ~ 40)
  const plinth1 = useMemo(() => flatToSphere(38, -6, 0), [])
  const plinth2 = useMemo(() => flatToSphere(42, 6, 0), [])

  // Archive terminal location (East end, X ~ 46)
  const terminal = useMemo(() => flatToSphere(46, 0, 0), [])

  const bookMaterial = useMemo(
    () =>
      new MeshToonMaterial({
        color: '#1A1A1A',
        gradientMap,
      }),
    [gradientMap]
  )

  const pagesMaterial = useMemo(
    () =>
      new MeshToonMaterial({
        color: '#F2EFE9',
        gradientMap,
      }),
    [gradientMap]
  )

  const plinthMaterial = useMemo(
    () =>
      new MeshToonMaterial({
        color: '#222222',
        gradientMap,
      }),
    [gradientMap]
  )

  const gemMaterial = useMemo(
    () =>
      new MeshToonMaterial({
        color: '#E8E6DF',
        gradientMap,
      }),
    [gradientMap]
  )

  // Floating animation for project miniatures
  const gemRef1 = useRef<Mesh>(null)
  const gemRef2 = useRef<Mesh>(null)

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (gemRef1.current) {
      gemRef1.current.position.y = 1.35 + Math.sin(t * 1.8) * 0.08
      gemRef1.current.rotation.y = t * 0.6
    }
    if (gemRef2.current) {
      gemRef2.current.position.y = 1.35 + Math.sin(t * 1.8 + 1.2) * 0.08
      gemRef2.current.rotation.y = -t * 0.6
    }
  })

  return (
    <group>
      {/* ── Q112: LIBRARY HARDCOVER BOOKS ───────────────────── */}
      {/* Essay 1: Brutalist Web */}
      <group position={book1.position} quaternion={book1.quaternion}>
        {/* Book cover */}
        <mesh position={[0, 0.45, 0]} material={bookMaterial} castShadow>
          <boxGeometry args={[0.5, 0.7, 0.12]} />
        </mesh>
        {/* Paper page edges */}
        <mesh position={[0.02, 0.45, 0]} material={pagesMaterial}>
          <boxGeometry args={[0.46, 0.66, 0.1]} />
        </mesh>
        {/* SDF spine title */}
        <Text
          position={[-0.26, 0.45, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          fontSize={0.06}
          color="#F2F1EC"
          letterSpacing={0.1}
          anchorX="center"
          anchorY="middle"
        >
          BRUTALIST WEB
        </Text>
      </group>

      {/* Essay 2: Digital Public Spaces */}
      <group position={book2.position} quaternion={book2.quaternion}>
        <mesh position={[0, 0.45, 0]} material={bookMaterial} castShadow>
          <boxGeometry args={[0.5, 0.7, 0.12]} />
        </mesh>
        <mesh position={[0.02, 0.45, 0]} material={pagesMaterial}>
          <boxGeometry args={[0.46, 0.66, 0.1]} />
        </mesh>
        <Text
          position={[-0.26, 0.45, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          fontSize={0.06}
          color="#F2F1EC"
          letterSpacing={0.1}
          anchorX="center"
          anchorY="middle"
        >
          PUBLIC SPACES
        </Text>
      </group>

      {/* ── Q114: PROJECT PEDESTALS WITH HOVERING MINIATURES ── */}
      {/* Pedestal 1: Oryzon */}
      <group position={plinth1.position} quaternion={plinth1.quaternion}>
        {/* Chamfered concrete plinth */}
        <mesh position={[0, 0.5, 0]} material={plinthMaterial} castShadow receiveShadow>
          <cylinderGeometry args={[0.6, 0.75, 1.0, 8]} />
        </mesh>
        {/* Hovering stylized miniature */}
        <mesh ref={gemRef1} position={[0, 1.35, 0]} material={gemMaterial} castShadow>
          <octahedronGeometry args={[0.26, 0]} />
        </mesh>
        <Text
          position={[0, 0.6, 0.68]}
          fontSize={0.12}
          color="#FFFFFF"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.15}
        >
          ORYZON
        </Text>
      </group>

      {/* Pedestal 2: Roadwarden */}
      <group position={plinth2.position} quaternion={plinth2.quaternion}>
        <mesh position={[0, 0.5, 0]} material={plinthMaterial} castShadow receiveShadow>
          <cylinderGeometry args={[0.6, 0.75, 1.0, 8]} />
        </mesh>
        <mesh ref={gemRef2} position={[0, 1.35, 0]} material={gemMaterial} castShadow>
          <icosahedronGeometry args={[0.24, 0]} />
        </mesh>
        <Text
          position={[0, 0.6, 0.68]}
          fontSize={0.12}
          color="#FFFFFF"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.15}
        >
          ROADWARDEN
        </Text>
      </group>

      {/* ── Q115: RETRO CRT ARCHIVE TERMINAL ───────────────── */}
      <group position={terminal.position} quaternion={terminal.quaternion}>
        {/* Desk body */}
        <mesh position={[0, 0.4, 0]} material={plinthMaterial} castShadow>
          <boxGeometry args={[1.4, 0.8, 0.9]} />
        </mesh>
        {/* CRT Monitor casing */}
        <mesh position={[0, 1.05, 0]} material={bookMaterial} castShadow>
          <boxGeometry args={[0.7, 0.55, 0.5]} />
        </mesh>
        {/* Screen */}
        <mesh position={[0, 1.05, 0.26]}>
          <planeGeometry args={[0.55, 0.4]} />
          <meshBasicMaterial color="#0A1A0A" />
        </mesh>
        {/* Phosphor Text */}
        <Text
          position={[0, 1.08, 0.27]}
          fontSize={0.07}
          color="#44FF44"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.08}
        >
          {'> ARCHIVE'}
        </Text>
        <Text
          position={[0, 0.98, 0.27]}
          fontSize={0.045}
          color="#22AA22"
          anchorX="center"
          anchorY="middle"
        >
          [E] SEARCH ALL
        </Text>
      </group>
    </group>
  )
}
