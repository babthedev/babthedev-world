'use client'

import { forwardRef, useMemo } from 'react'
import { Effect } from 'postprocessing'
import { Uniform } from 'three'

const fragmentShader = /* glsl */ `
  uniform float grainOpacity;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    // Static — NOT animated per spec, fixed grain pattern
    float grain = hash(floor(uv * 800.0));
    vec3 grained = inputColor.rgb - (grain - 0.5) * grainOpacity;
    outputColor = vec4(grained, inputColor.a);
  }
`

class PaperGrainEffectImpl extends Effect {
  constructor({ opacity = 0.026 } = {}) {
    super('PaperGrainEffect', fragmentShader, {
      uniforms: new Map<string, Uniform>([
        ['grainOpacity', new Uniform(opacity)],
      ]),
    })
  }
}

const PaperGrain = forwardRef<PaperGrainEffectImpl>((_, ref) => {
  const effect = useMemo(() => new PaperGrainEffectImpl(), [])
  return <primitive ref={ref} object={effect} dispose={null} />
})

PaperGrain.displayName = 'PaperGrain'

export default PaperGrain