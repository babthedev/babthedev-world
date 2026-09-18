'use client'

import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  InstancedMesh,
  Matrix4,
  Vector3,
  Quaternion,
  DoubleSide,
  MeshBasicMaterial,
} from 'three'
import { getSurfaceNormal, getTangentBasis } from '@/lib/sphereMath'

const MAX_PUFFS = 24
const PUFF_LIFETIME = 0.32 // 0.32 seconds duration

interface Puff {
  pos: Vector3
  normal: Vector3
  tangent: Vector3
  binormal: Vector3
  birthTime: number
  active: boolean
  randomScale: number
}

// Global emitter event system
type PuffListener = (pos: [number, number, number]) => void
const listeners = new Set<PuffListener>()

export function emitFootstepPuff(position: [number, number, number]) {
  listeners.forEach((l) => l(position))
}

const _puffPos = new Vector3()
const _scaleVec = new Vector3()
const _matrix = new Matrix4()
const _qAlign = new Quaternion()
const _upRef = new Vector3(0, 0, 1) // Ring geometry is in XY plane, normal is +Z

export default function FootstepPuffs() {
  const meshRef = useRef<InstancedMesh>(null)

  const puffsRef = useRef<Puff[]>(
    Array.from({ length: MAX_PUFFS }, () => ({
      pos: new Vector3(0, -999, 0),
      normal: new Vector3(0, 1, 0),
      tangent: new Vector3(1, 0, 0),
      binormal: new Vector3(0, 0, 1),
      birthTime: 0,
      active: false,
      randomScale: 1.0,
    }))
  )
  const nextIdxRef = useRef(0)

  useEffect(() => {
    const onEmit: PuffListener = (pos) => {
      const idx = nextIdxRef.current
      nextIdxRef.current = (nextIdxRef.current + 1) % MAX_PUFFS

      const puff = puffsRef.current[idx]
      const posVec = new Vector3(...pos)
      const normal = getSurfaceNormal(posVec)
      const { forward, right } = getTangentBasis(normal)

      // Place puff slightly above surface (4cm) to prevent z-fighting
      puff.pos.copy(posVec).addScaledVector(normal, 0.04)
      puff.normal.copy(normal)
      puff.tangent.copy(forward)
      puff.binormal.copy(right)
      puff.birthTime = performance.now() / 1000
      puff.active = true
      puff.randomScale = 0.85 + Math.random() * 0.3
    }

    listeners.add(onEmit)
    return () => {
      listeners.delete(onEmit)
    }
  }, [])

  useFrame(() => {
    if (!meshRef.current) return
    const now = performance.now() / 1000

    puffsRef.current.forEach((puff, i) => {
      if (!puff.active) {
        _matrix.makeScale(0, 0, 0)
        meshRef.current!.setMatrixAt(i, _matrix)
        return
      }

      const age = now - puff.birthTime
      const progress = age / PUFF_LIFETIME

      if (progress >= 1.0) {
        puff.active = false
        _matrix.makeScale(0, 0, 0)
        meshRef.current!.setMatrixAt(i, _matrix)
        return
      }

      // Q66 2-frame dissolution:
      // Frame 1 (0 to 0.5): rapid expansion from heel contact
      // Frame 2 (0.5 to 1.0): ink dispersal and fading
      const scaleEase = Math.sin(progress * Math.PI * 0.5) // fast rise
      const currentScale = (0.4 + scaleEase * 0.9) * puff.randomScale

      // Align ring XY plane so its Z normal points along puff.normal
      _qAlign.setFromUnitVectors(_upRef, puff.normal)

      _scaleVec.set(currentScale, currentScale, currentScale)
      _matrix.compose(puff.pos, _qAlign, _scaleVec)
      meshRef.current!.setMatrixAt(i, _matrix)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, MAX_PUFFS]}
      castShadow={false}
      receiveShadow={false}
    >
      {/* Irregular 7-sided ring evokes hand-drawn ink / paper puff edge */}
      <ringGeometry args={[0.05, 0.24, 7]} />
      <meshBasicMaterial
        color="#222222"
        transparent
        opacity={0.65}
        side={DoubleSide}
        depthWrite={false}
      />
    </instancedMesh>
  )
}
