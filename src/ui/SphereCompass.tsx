'use client'

import { useWorldStore } from '@/store/useWorldStore'
import { PLANET_RADIUS } from '@/lib/constants'

/**
 * A small compass indicator showing the player's approximate position
 * on the spherical planet. Rendered as a minimalist circle (globe outline)
 * with a dot for the player's position.
 *
 * The dot position is derived from the visitor's XZ coordinates projected
 * onto a 2D circle representing the sphere's top-down view.
 */
export default function SphereCompass() {
  const position = useWorldStore((s) => s.position)
  const [px, , pz] = position

  // Project 3D position onto a 2D circle (top-down view)
  // Normalize to [-1, 1] range based on planet radius
  const nx = Math.max(-1, Math.min(1, px / PLANET_RADIUS))
  const nz = Math.max(-1, Math.min(1, pz / PLANET_RADIUS))

  // Map to SVG coordinates (center = 20, radius = 14)
  const dotX = 20 + nx * 14
  const dotY = 20 + nz * 14

  return (
    <div
      className="fixed left-4 bottom-4 z-20 pointer-events-none md:left-6 md:bottom-6"
      aria-label="Position on planet"
    >
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        className="opacity-60"
      >
        {/* Globe outline */}
        <circle
          cx="20"
          cy="20"
          r="16"
          stroke="#0B0B0B"
          strokeWidth="1.5"
          fill="none"
        />
        {/* Equator line */}
        <ellipse
          cx="20"
          cy="20"
          rx="16"
          ry="4"
          stroke="#0B0B0B"
          strokeWidth="0.75"
          fill="none"
          opacity="0.4"
        />
        {/* Meridian line */}
        <ellipse
          cx="20"
          cy="20"
          rx="4"
          ry="16"
          stroke="#0B0B0B"
          strokeWidth="0.75"
          fill="none"
          opacity="0.4"
        />
        {/* Player dot */}
        <circle
          cx={dotX}
          cy={dotY}
          r="2.5"
          fill="#0B0B0B"
        />
      </svg>
    </div>
  )
}
