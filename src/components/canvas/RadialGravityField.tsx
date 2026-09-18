'use client'

import { useRadialGravity } from '@/hooks/useRadialGravity'

/**
 * Invisible component that activates radial gravity within the Physics context.
 * Must be placed as a child of <Physics>. Has no visual output.
 */
export default function RadialGravityField({ strength }: { strength?: number }) {
  useRadialGravity(strength)
  return null
}
