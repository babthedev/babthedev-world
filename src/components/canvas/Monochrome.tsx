'use client'

import { forwardRef, useMemo } from 'react'
import { Effect } from 'postprocessing'
import { Color, Uniform } from 'three'
import { INK_COLOR, PAPER_BACKGROUND, MONO_BLACK, MONO_WHITE, MONO_GAMMA, MONO_STEPS, MONO_POSTERIZE, MONO_CONTRAST, MONO_PIVOT } from '@/lib/constants'

// ── MONOCHROME GRADE ───────────────────────────────────
// Guarantees the frame is black & white regardless of source colours,
// so every texture (Kenney colour map, VRoid skins) can stay as authored.
//   1. Rec.709 luminance
//   2. Levels: remap [black, white] → [0, 1]
//   3. Soft posterise into flat Messenger-style value bands
//   4. Tint along a warm ink → paper ramp (alignment Q9)
const fragmentShader = /* glsl */ `
  uniform vec3 inkColor;
  uniform vec3 paperColor;
  uniform float blackPoint;
  uniform float whitePoint;
  uniform float gamma;
  uniform float steps;
  uniform float posterize;
  uniform float contrast;
  uniform float pivot;

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    // Effects run in linear space; grade in perceptual (gamma) space so
    // levels and bands land where the eye expects them, then convert back.
    float lum = pow(max(dot(inputColor.rgb, vec3(0.2126, 0.7152, 0.0722)), 0.0), 1.0 / 2.2);
    lum = clamp((lum - blackPoint) / (whitePoint - blackPoint), 0.0, 1.0);
    lum = pow(lum, gamma);
    // S-curve around the pivot: darks are pushed toward ink, lights toward paper, and
    // the muddy middle is thinned out. contrast = 1 leaves the tones alone.
    lum = lum < pivot
      ? pivot * pow(lum / pivot, contrast)
      : 1.0 - (1.0 - pivot) * pow((1.0 - lum) / (1.0 - pivot), contrast);
    float banded = floor(lum * steps + 0.5) / steps;
    lum = mix(lum, banded, posterize);
    vec3 ink = pow(inkColor, vec3(1.0 / 2.2));
    vec3 paper = pow(paperColor, vec3(1.0 / 2.2));
    outputColor = vec4(pow(mix(ink, paper, lum), vec3(2.2)), inputColor.a);
  }
`

class MonochromeEffectImpl extends Effect {
  constructor() {
    super('MonochromeEffect', fragmentShader, {
      uniforms: new Map<string, Uniform>([
        ['inkColor', new Uniform(new Color(INK_COLOR))],
        ['paperColor', new Uniform(new Color(PAPER_BACKGROUND))],
        ['blackPoint', new Uniform(MONO_BLACK)],
        ['whitePoint', new Uniform(MONO_WHITE)],
        ['gamma', new Uniform(MONO_GAMMA)],
        ['steps', new Uniform(MONO_STEPS)],
        ['posterize', new Uniform(MONO_POSTERIZE)],
        ['contrast', new Uniform(MONO_CONTRAST)],
        ['pivot', new Uniform(MONO_PIVOT)],
      ]),
    })
  }
}

const Monochrome = forwardRef<MonochromeEffectImpl>((_, ref) => {
  const effect = useMemo(() => new MonochromeEffectImpl(), [])
  // Dev-only: lets the grade be tuned live from the console or a script
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    ;(window as unknown as Record<string, unknown>).__MONO__ = effect.uniforms
  }
  return <primitive ref={ref} object={effect} dispose={null} />
})

Monochrome.displayName = 'Monochrome'

export default Monochrome
