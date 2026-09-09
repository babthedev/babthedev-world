'use client'

import { forwardRef, useMemo, useRef } from 'react'
import { Effect } from 'postprocessing'
import { Uniform } from 'three'
import { useFrame } from '@react-three/fiber'

const fragmentShader = /* glsl */ `
  uniform float time;
  uniform float intensity;

  // Simple hash-based pseudo-random noise — cheap, no texture lookup needed
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec2 offset = vec2(
      hash(uv + time) - 0.5,
      hash(uv - time) - 0.5
    ) * intensity;

    outputColor = texture2D(inputBuffer, uv + offset);
  }
`

class SquigglevisionEffectImpl extends Effect {
  constructor({ intensity = 0.0015 } = {}) {
    super('SquigglevisionEffect', fragmentShader, {
      uniforms: new Map<string, Uniform>([
        ['time', new Uniform(0)],
        ['intensity', new Uniform(intensity)],
      ]),
    })
  }

  updateTime(t: number) {
    const u = this.uniforms.get('time')
    if (u) u.value = t
  }
}

const STEP_HZ = 12 // stepped at exactly 12fps — "on twos" per spec

const Squigglevision = forwardRef<SquigglevisionEffectImpl>((_, ref) => {
  const effect = useMemo(() => new SquigglevisionEffectImpl(), [])
  const lastStepTime = useRef(0)
  const steppedTime = useRef(0)

  useFrame((state) => {
    const now = state.clock.getElapsedTime()
    // Only advance the noise phase 12 times per second, regardless
    // of actual framerate — this is what gives the "hand-boiled"
    // stepped look rather than smooth continuous jitter
    if (now - lastStepTime.current > 1 / STEP_HZ) {
      steppedTime.current = now
      lastStepTime.current = now
      effect.updateTime(steppedTime.current)
    }
  })

  return <primitive ref={ref} object={effect} dispose={null} />
})

Squigglevision.displayName = 'Squigglevision'

export default Squigglevision