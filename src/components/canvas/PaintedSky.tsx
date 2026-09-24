'use client'

import { useMemo } from 'react'
import { BackSide, Color, ShaderMaterial } from 'three'
import { PLANET_RADIUS, PAPER_BACKGROUND } from '@/lib/constants'

/**
 * A large inverted sphere with a vertical gradient shader.
 * Renders behind everything (BackSide) to create a seamless
 * sky that transitions from the paper background color at the
 * horizon to a slightly darker tone at the zenith.
 *
 * Sized at 4× planet radius so it's always beyond the fog boundary.
 */
export default function GradientSkyDome() {
  const material = useMemo(() => {
    const paperColor = new Color(PAPER_BACKGROUND)
    // Slightly cooler/darker version for the upper sky
    const zenithColor = paperColor.clone().multiplyScalar(0.85)

    return new ShaderMaterial({
      uniforms: {
        uHorizonColor: { value: paperColor },
        uZenithColor: { value: zenithColor },
      },
      vertexShader: /* glsl */ `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uHorizonColor;
        uniform vec3 uZenithColor;
        varying vec3 vWorldPosition;
        void main() {
          // Normalize position relative to sphere center (origin)
          vec3 dir = normalize(vWorldPosition);
          // Use absolute Y to create a gradient from equator to poles
          // abs() so both hemispheres get the same gradient
          float t = abs(dir.y);
          // Smooth the transition
          t = smoothstep(0.0, 1.0, t);
          vec3 color = mix(uHorizonColor, uZenithColor, t);
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: BackSide,
      depthWrite: false,
    })
  }, [])

  return (
    <mesh material={material} renderOrder={-1}>
      <sphereGeometry args={[PLANET_RADIUS * 4, 32, 32]} />
    </mesh>
  )
}
