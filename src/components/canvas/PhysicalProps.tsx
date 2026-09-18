'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { Group, Mesh, MeshToonMaterial, Texture, Vector3 } from 'three'
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

  // Q77: Welcome Terrace Mailbox (-34, -8)
  const mailbox = useMemo(() => flatToSphere(-34, -8, 0), [])

  // Q78: Terrace Chalkboard Standee (-42, -5)
  const chalkboard = useMemo(() => flatToSphere(-42, -5, 0), [])

  // Q79: Cafe Terrace Corkboard Guestbook (-40, 6)
  const corkboard = useMemo(() => flatToSphere(-40, 6, 0), [])

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

  // Floating animation for project miniatures & Q67 interactive prop proximity sine bob
  const gemRef1 = useRef<Mesh>(null)
  const gemRef2 = useRef<Mesh>(null)
  const book1Ref = useRef<Group>(null)
  const book2Ref = useRef<Group>(null)
  const plinth1Ref = useRef<Group>(null)
  const plinth2Ref = useRef<Group>(null)
  const terminalRef = useRef<Group>(null)
  const mailboxRef = useRef<Group>(null)
  const chalkboardRef = useRef<Group>(null)
  const corkboardRef = useRef<Group>(null)

  const nearbyPropId = useWorldStore((s) => s.nearbyPropId)

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

    // ── Q67: PROXIMITY SINE BOB (2-3cm vertical lift along surface normal) ──
    const applyBob = (
      panelId: string,
      ref: React.RefObject<Group | null>,
      basePos: [number, number, number]
    ) => {
      if (!ref.current) return
      if (nearbyPropId === panelId) {
        const lift = (Math.sin(t * 3.6) * 0.5 + 0.5) * 0.025
        const norm = new Vector3(...basePos).normalize()
        ref.current.position.set(
          basePos[0] + norm.x * lift,
          basePos[1] + norm.y * lift,
          basePos[2] + norm.z * lift
        )
      } else {
        ref.current.position.set(basePos[0], basePos[1], basePos[2])
      }
    }

    applyBob('brutalist-web', book1Ref, book1.position)
    applyBob('essay-02', book2Ref, book2.position)
    applyBob('oryzon', plinth1Ref, plinth1.position)
    applyBob('roadwarden', plinth2Ref, plinth2.position)
    applyBob('archive', terminalRef, terminal.position)
    applyBob('contact', mailboxRef, mailbox.position)
    applyBob('resume', chalkboardRef, chalkboard.position)
    applyBob('guestbook', corkboardRef, corkboard.position)
  })

  return (
    <group>
      {/* ── Q112: LIBRARY HARDCOVER BOOKS ───────────────────── */}
      {/* Essay 1: Brutalist Web */}
      <group ref={book1Ref} position={book1.position} quaternion={book1.quaternion}>
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
      <group ref={book2Ref} position={book2.position} quaternion={book2.quaternion}>
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
      <group ref={plinth1Ref} position={plinth1.position} quaternion={plinth1.quaternion}>
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
      <group ref={plinth2Ref} position={plinth2.position} quaternion={plinth2.quaternion}>
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
      <group ref={terminalRef} position={terminal.position} quaternion={terminal.quaternion}>
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

      {/* ── Q77: WELCOME TERRACE MAILBOX ─────────────────────── */}
      <group ref={mailboxRef} position={mailbox.position} quaternion={mailbox.quaternion}>
        {/* Wooden post */}
        <mesh position={[0, 0.45, 0]} material={plinthMaterial} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.9, 8]} />
        </mesh>
        {/* Mailbox casing */}
        <mesh position={[0, 1.05, 0]} material={bookMaterial} castShadow>
          <boxGeometry args={[0.36, 0.38, 0.58]} />
        </mesh>
        {/* Mail Slot */}
        <mesh position={[0, 1.12, 0.291]}>
          <planeGeometry args={[0.24, 0.04]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
        {/* Mailbox Flag */}
        <mesh position={[0.19, 1.15, -0.1]} material={pagesMaterial}>
          <boxGeometry args={[0.02, 0.2, 0.08]} />
        </mesh>
        {/* SDF Signage */}
        <Text
          position={[0, 1.34, 0]}
          fontSize={0.07}
          color="#FAF9F5"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.1}
        >
          MAILBOX
        </Text>
        <Text
          position={[0, 0.92, 0.295]}
          fontSize={0.04}
          color="#FAF9F5"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.05}
        >
          [E] SEND LETTER
        </Text>
      </group>

      {/* ── Q78: TERRACE CHALKBOARD STANDEE (RESUME / CV) ────── */}
      <group ref={chalkboardRef} position={chalkboard.position} quaternion={chalkboard.quaternion}>
        {/* A-frame easel legs */}
        <mesh position={[-0.4, 0.5, 0]} material={plinthMaterial}>
          <boxGeometry args={[0.05, 1.0, 0.06]} />
        </mesh>
        <mesh position={[0.4, 0.5, 0]} material={plinthMaterial}>
          <boxGeometry args={[0.05, 1.0, 0.06]} />
        </mesh>
        {/* Slate blackboard */}
        <mesh position={[0, 0.72, 0.02]} material={bookMaterial} castShadow>
          <boxGeometry args={[0.78, 0.92, 0.04]} />
        </mesh>
        {/* SDF Chalk lettering */}
        <Text
          position={[0, 0.98, 0.05]}
          fontSize={0.075}
          color="#FFFFFF"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.08}
        >
          RESUME / CV
        </Text>
        <Text
          position={[0, 0.85, 0.05]}
          fontSize={0.045}
          color="#CCCCCC"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.06}
        >
          ABDULRAHMAN
        </Text>
        <Text
          position={[0, 0.74, 0.05]}
          fontSize={0.038}
          color="#999999"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.04}
        >
          SYSTEMS & 3D WEB
        </Text>
        <Text
          position={[0, 0.58, 0.05]}
          fontSize={0.042}
          color="#FFFFFF"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.05}
        >
          [E] OPEN & DOWNLOAD PDF
        </Text>
      </group>

      {/* ── Q79: CAFE TERRACE CORKBOARD GUESTBOOK ─────────────── */}
      <group ref={corkboardRef} position={corkboard.position} quaternion={corkboard.quaternion}>
        {/* Stand post */}
        <mesh position={[0, 0.45, 0]} material={plinthMaterial}>
          <cylinderGeometry args={[0.05, 0.05, 0.9, 8]} />
        </mesh>
        {/* Frame */}
        <mesh position={[0, 1.05, 0]} material={plinthMaterial} castShadow>
          <boxGeometry args={[1.22, 0.82, 0.06]} />
        </mesh>
        {/* Corkboard back */}
        <mesh position={[0, 1.05, 0.015]} material={bookMaterial}>
          <boxGeometry args={[1.14, 0.74, 0.04]} />
        </mesh>
        {/* Pinned notes */}
        <mesh position={[-0.32, 1.12, 0.04]} material={pagesMaterial} rotation={[0, 0, 0.05]}>
          <boxGeometry args={[0.26, 0.2, 0.01]} />
        </mesh>
        <mesh position={[0.08, 1.1, 0.04]} material={pagesMaterial} rotation={[0, 0, -0.04]}>
          <boxGeometry args={[0.26, 0.2, 0.01]} />
        </mesh>
        <mesh position={[0.34, 0.98, 0.04]} material={pagesMaterial} rotation={[0, 0, 0.08]}>
          <boxGeometry args={[0.24, 0.18, 0.01]} />
        </mesh>
        {/* SDF Signage */}
        <Text
          position={[0, 1.34, 0]}
          fontSize={0.07}
          color="#FAF9F5"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.08}
        >
          CAFE GUESTBOOK
        </Text>
        <Text
          position={[0, 0.88, 0.05]}
          fontSize={0.042}
          color="#FAF9F5"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.05}
        >
          [E] PIN A NOTE
        </Text>
      </group>
    </group>
  )
}
