'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { DirectionalLight, Vector3 } from 'three'
import { useWorldStore } from '@/store/useWorldStore'
import {
  DIRECTIONAL_INTENSITY,
  SHADOW_EXTENT,
  SUN_DISTANCE,
  SUN_TILT,
} from '@/lib/constants'

// Fixed world-space "sun azimuth" reference. Only its tangential part
// matters; where it's parallel to the surface normal the sun is simply
// overhead, so the rig is continuous everywhere on the planet.
const SUN_REF = new Vector3(0.35, 0.25, -0.9).normalize()

const _target = new Vector3()
const _normal = new Vector3()
const _sunDir = new Vector3()
const _right = new Vector3()
const _up = new Vector3()

/**
 * A sun that travels with the visitor.
 *
 * A fixed world-space sun on a sphere lights every district from a
 * different angle and leaves the far side in night. Instead the sun
 * direction is the local surface normal leaned by a fixed tangent
 * offset, so it always sits ~40–90° above the visitor's horizon. The
 * shadow frustum follows too — ±18m at 2048px is ~1.8cm per texel, which
 * keeps cast shadows as hard-edged as Messenger's.
 */
export default function SunRig({ mapSize, softShadows = false }: { mapSize: number; softShadows?: boolean }) {
  const lightRef = useRef<DirectionalLight>(null)
  const texel = (SHADOW_EXTENT * 2) / mapSize

  const shadowProps = useMemo(
    () => ({
      'shadow-mapSize-width': mapSize,
      'shadow-mapSize-height': mapSize,
      'shadow-camera-left': -SHADOW_EXTENT,
      'shadow-camera-right': SHADOW_EXTENT,
      'shadow-camera-top': SHADOW_EXTENT,
      'shadow-camera-bottom': -SHADOW_EXTENT,
      'shadow-camera-near': 1,
      'shadow-camera-far': SUN_DISTANCE * 2,
      'shadow-bias': -0.0004,
      'shadow-normalBias': 0.03,
      // Hard edges are the house style. `?shadows=soft` blurs them: a wider filter radius
      'shadow-radius': softShadows ? 4 : 1,
    }),
    [mapSize, softShadows]
  )

  useFrame(() => {
    const light = lightRef.current
    if (!light) return
    const [x, y, z] = useWorldStore.getState().position
    _target.set(x, y, z)
    _normal.copy(_target).normalize()

    _sunDir.copy(SUN_REF).addScaledVector(_normal, -SUN_REF.dot(_normal)).multiplyScalar(SUN_TILT)
    _sunDir.add(_normal).normalize()

    // Snap the target to whole shadow texels in the light's view plane so
    // shadow edges don't crawl as the visitor walks.
    _right.crossVectors(_sunDir, _normal)
    if (_right.lengthSq() < 1e-6) _right.set(1, 0, 0).cross(_sunDir)
    _right.normalize()
    _up.crossVectors(_right, _sunDir).normalize()
    const a = Math.round(_target.dot(_right) / texel) * texel - _target.dot(_right)
    const b = Math.round(_target.dot(_up) / texel) * texel - _target.dot(_up)
    _target.addScaledVector(_right, a).addScaledVector(_up, b)

    light.target.position.copy(_target)
    light.position.copy(_target).addScaledVector(_sunDir, SUN_DISTANCE)
    light.target.updateMatrixWorld()
  })

  // The target stays out of the scene graph; its matrix is updated by hand
  // above, which is all DirectionalLight needs to aim itself.
  return (
    <directionalLight
      ref={lightRef}
      intensity={DIRECTIONAL_INTENSITY}
      color="#FFFFFF"
      castShadow
      {...shadowProps}
    />
  )
}
