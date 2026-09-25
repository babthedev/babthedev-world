'use client'

import type { ComponentProps } from 'react'
import { Text } from '@react-three/drei'
import { FrontSide } from 'three'
import { WORLD_FONT } from '@/lib/worldFont'

type SignTextProps = ComponentProps<typeof Text> & {
  /**
   * Distance of each face from the group's centre along ±Z. Zero for a floating
   * plane; half the board's thickness for text mounted on a solid lintel or
   * sign board, so each copy sits on its own face instead of one being buried.
   */
  faceOffset?: number
}

/**
 * World text that reads correctly from BOTH sides.
 *
 * A troika <Text> is one plane: it reads correctly from the side it faces and
 * shows mirrored from the other. Visitors walk through gates and past signs in
 * both directions (out from the Hub and back again), so a single plane is
 * always backwards half the time. This draws the text on both faces; each copy
 * is front-face only, so from either side you see exactly one, correctly
 * oriented, and the two never overlap.
 *
 * `position` and `rotation` place the centre of the pair (the middle of the board),
 * exactly as they would a single Text.
 */
export default function SignText({ position, rotation, faceOffset = 0.004, children, ...rest }: SignTextProps) {
  return (
    <group position={position} rotation={rotation}>
      <Text font={WORLD_FONT} position={[0, 0, faceOffset]} {...rest}>
        {children}
        <meshBasicMaterial side={FrontSide} transparent />
      </Text>
      <group rotation={[0, Math.PI, 0]}>
        <Text font={WORLD_FONT} position={[0, 0, faceOffset]} {...rest}>
          {children}
          <meshBasicMaterial side={FrontSide} transparent />
        </Text>
      </group>
    </group>
  )
}
