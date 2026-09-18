'use client'

import { useRef } from 'react'
import { Vector3 } from 'three'
import { useBeforePhysicsStep, useRapier } from '@react-three/rapier'
import { RADIAL_GRAVITY } from '@/lib/constants'

/**
 * Applies radial gravity pulling all dynamic rigid bodies toward the sphere's
 * center (origin). Runs once per physics step before the solver.
 *
 * This replaces the standard linear gravity [0, -g, 0] with a force that always
 * points from each body's position toward [0, 0, 0], allowing objects to stand
 * on any point of the spherical planet surface.
 *
 * @param strength Gravity magnitude in m/s². Defaults to RADIAL_GRAVITY (35).
 */
export function useRadialGravity(strength: number = RADIAL_GRAVITY) {
  const { world } = useRapier()
  const _gravityDir = useRef(new Vector3())

  useBeforePhysicsStep(() => {
    world.bodies.forEach((body) => {
      // Only affect dynamic bodies (not fixed or kinematic)
      if (!body.isDynamic()) return

      const pos = body.translation()
      const dir = _gravityDir.current

      // Direction from body position toward center (0,0,0)
      dir.set(-pos.x, -pos.y, -pos.z)
      const distFromCenter = dir.length()

      if (distFromCenter < 0.001) return // Skip bodies at dead center

      // Normalize and scale by gravity strength × mass
      dir.divideScalar(distFromCenter)
      const mass = body.mass()
      dir.multiplyScalar(strength * mass)

      // Apply as a central force (not an impulse — continuous each step)
      body.addForce({ x: dir.x, y: dir.y, z: dir.z }, true)
    })
  })
}
