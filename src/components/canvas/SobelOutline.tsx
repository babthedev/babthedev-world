'use client'

import { forwardRef, useMemo, useContext, useEffect, useRef } from 'react'
import { Effect, EffectAttribute } from 'postprocessing'
import { Uniform, Vector2, Color, DataTexture, RGBAFormat, UnsignedByteType, Texture } from 'three'
import { useFrame } from '@react-three/fiber'
import { EffectComposerContext } from '@react-three/postprocessing'
import {
  OUTLINE_COLOR,
  OUTLINE_THICKNESS,
  OUTLINE_DEPTH_THRESHOLD,
  OUTLINE_NORMAL_THRESHOLD,
  OUTLINE_BOIL_PX,
} from '@/lib/constants'

// Fallback 1x1 neutral normal texture [0, 0, 1] for when normalPass is disabled or initializing
const defaultNormalTexture = new DataTexture(
  new Uint8Array([128, 128, 255, 255]),
  1,
  1,
  RGBAFormat,
  UnsignedByteType
)
defaultNormalTexture.needsUpdate = true

// ── FRAGMENT SHADER ────────────────────────────────────
// Ink outlines from depth + normal discontinuities.
// - Depth: Laplacian of LINEAR view depth, relative to the centre depth,
//   so a 10cm step reads the same at 2m as at 40m (raw perspective depth
//   crushes everything past a few metres below any fixed threshold).
// - Normal: largest angle between the centre normal and its neighbours,
//   catching creases where depth is continuous.
// - Boil: the sample position is displaced by low-frequency noise that
//   re-rolls at 12fps, so lines wobble like redrawn ink while the flat
//   fills underneath stay perfectly still.
const fragmentShader = /* glsl */ `
  uniform sampler2D normalBuffer;
  uniform vec2 texel;
  uniform vec3 outlineColor;
  uniform float thickness;
  uniform float depthThreshold;
  uniform float normalThreshold;
  uniform float boilPx;
  uniform float time;

  float linZ(const in vec2 p) {
    return -getViewZ(readDepth(p));
  }

  vec3 readNormal(const in vec2 p) {
    return texture2D(normalBuffer, p).rgb * 2.0 - 1.0;
  }

  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash12(i), hash12(i + vec2(1.0, 0.0)), f.x),
      mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    // ── BOIL ──
    vec2 px = uv / texel;
    // fract() keeps the offset bounded so float precision holds over long sessions
    vec2 seed = px / 48.0 + vec2(fract(time * 0.6180), fract(time * 0.3771)) * 97.0;
    vec2 wobble = vec2(valueNoise(seed), valueNoise(seed + 41.7)) - 0.5;
    vec2 suv = uv + wobble * 2.0 * boilPx * texel;

    float farZ = cameraFar * 0.98;
    float dc = linZ(suv);

    // Thinner strokes with distance (Q8: distance-adaptive, clamped)
    float t = thickness * mix(1.0, 0.55, smoothstep(6.0, 45.0, dc));
    vec2 ox = vec2(texel.x * t, 0.0);
    vec2 oy = vec2(0.0, texel.y * t);

    float dl = linZ(suv - ox);
    float dr = linZ(suv + ox);
    float dd = linZ(suv - oy);
    float du = linZ(suv + oy);

    // ── DEPTH EDGE ──
    float nearest = min(dc, min(min(dl, dr), min(dd, du)));
    float lap = abs(dl + dr - 2.0 * dc) + abs(du + dd - 2.0 * dc);
    float depthEdge = lap / max(nearest, 0.05);

    // ── NORMAL EDGE (skip when any tap is sky — depth already inks it) ──
    float normalEdge = 0.0;
    if (max(dc, max(max(dl, dr), max(dd, du))) < farZ) {
      vec3 nc = readNormal(suv);
      float m = 0.0;
      m = max(m, 1.0 - dot(nc, readNormal(suv - ox)));
      m = max(m, 1.0 - dot(nc, readNormal(suv + ox)));
      m = max(m, 1.0 - dot(nc, readNormal(suv - oy)));
      m = max(m, 1.0 - dot(nc, readNormal(suv + oy)));
      normalEdge = m;
    }

    // Pure sky: nothing to ink
    if (nearest >= farZ) {
      outputColor = inputColor;
      return;
    }

    float edge = max(
      smoothstep(depthThreshold, depthThreshold * 1.8, depthEdge),
      smoothstep(normalThreshold, normalThreshold * 1.6, normalEdge)
    );

    outputColor = vec4(mix(inputColor.rgb, outlineColor, edge), inputColor.a);
  }
`

class SobelOutlineEffectImpl extends Effect {
  constructor({ normalTexture = null as Texture | null, boilPx = OUTLINE_BOIL_PX } = {}) {
    super('SobelOutlineEffect', fragmentShader, {
      attributes: EffectAttribute.DEPTH,
      uniforms: new Map<string, Uniform>([
        ['normalBuffer', new Uniform(normalTexture ?? defaultNormalTexture)],
        ['texel', new Uniform(new Vector2(1, 1))],
        ['outlineColor', new Uniform(new Color(OUTLINE_COLOR))],
        ['thickness', new Uniform(OUTLINE_THICKNESS)],
        ['depthThreshold', new Uniform(OUTLINE_DEPTH_THRESHOLD)],
        ['normalThreshold', new Uniform(OUTLINE_NORMAL_THRESHOLD)],
        ['boilPx', new Uniform(boilPx)],
        ['time', new Uniform(0)],
      ]),
    })
  }

  setNormalBuffer(texture: Texture | null) {
    this.uniforms.get('normalBuffer')!.value = texture ?? defaultNormalTexture
  }

  setTime(t: number) {
    this.uniforms.get('time')!.value = t
  }

  // Called by the composer with the drawing-buffer resolution
  setSize(width: number, height: number) {
    this.uniforms.get('texel')!.value.set(1 / width, 1 / height)
  }
}

const BOIL_HZ = 12 // redraw "on twos"

// ── R3F WRAPPER ────────────────────────────────────────
const SobelOutline = forwardRef<SobelOutlineEffectImpl>((_, ref) => {
  const composerContext = useContext(EffectComposerContext)
  const normalPass = composerContext?.normalPass
  const normalTexture = (normalPass as any)?.texture ?? null

  const effect = useMemo(() => {
    const reducedMotion =
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    return new SobelOutlineEffectImpl({ normalTexture, boilPx: reducedMotion ? 0 : OUTLINE_BOIL_PX })
  }, [normalTexture])

  useEffect(() => {
    if ((normalPass as any)?.texture) effect.setNormalBuffer((normalPass as any).texture)
  }, [normalPass, effect])

  const lastStep = useRef(0)
  useFrame((state) => {
    const now = state.clock.getElapsedTime()
    if (now - lastStep.current >= 1 / BOIL_HZ) {
      lastStep.current = now
      effect.setTime(Math.floor(now * BOIL_HZ) / BOIL_HZ)
    }
  })

  return <primitive ref={ref} object={effect} dispose={null} />
})

SobelOutline.displayName = 'SobelOutline'

export default SobelOutline
