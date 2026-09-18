'use client'

import { forwardRef, useMemo } from 'react'
import { Effect } from 'postprocessing'
import { Uniform, Vector2, Color } from 'three'
import { useThree } from '@react-three/fiber'
import {
  OUTLINE_COLOR,
  OUTLINE_THICKNESS,
  OUTLINE_DEPTH_THRESHOLD,
} from '@/lib/constants'

// ── FRAGMENT SHADER ────────────────────────────────────
// Combined depth + normal Sobel edge detection.
// - Depth Sobel catches silhouette edges and depth discontinuities
// - Normal Sobel catches surface orientation changes (creases, hard edges)
// - Distance-adaptive thickness: outlines scale thinner with depth
//   for a natural "ink on paper" look where closer objects have
//   bolder strokes.
const fragmentShader = /* glsl */ `
  uniform vec2 texelSize;
  uniform vec3 outlineColor;
  uniform float depthThreshold;
  uniform float normalThreshold;
  uniform float thicknessNear;
  uniform float thicknessFar;

  // Read the scene normal from the GBuffer normal texture.
  // postprocessing v6 provides inputBuffer + normalBuffer via defines.
  vec3 readNormal(vec2 coord) {
    return texture2D(normalBuffer, coord).rgb * 2.0 - 1.0;
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    // ── DISTANCE-ADAPTIVE TEXEL SIZE ───────────────────
    // Scale the Sobel sample radius based on depth at this fragment.
    // Near pixels get full thickness, far pixels get reduced thickness.
    float centerDepth = readDepth(uv);
    // Map depth [0..1] to thickness multiplier [thicknessNear..thicknessFar]
    float adaptiveScale = mix(thicknessNear, thicknessFar, centerDepth);
    vec2 ts = texelSize * adaptiveScale;

    // ── DEPTH SOBEL ────────────────────────────────────
    float tl = readDepth(uv + vec2(-ts.x,  ts.y));
    float t  = readDepth(uv + vec2( 0.0,   ts.y));
    float tr = readDepth(uv + vec2( ts.x,  ts.y));
    float l  = readDepth(uv + vec2(-ts.x,  0.0));
    float r  = readDepth(uv + vec2( ts.x,  0.0));
    float bl = readDepth(uv + vec2(-ts.x, -ts.y));
    float b  = readDepth(uv + vec2( 0.0,  -ts.y));
    float br = readDepth(uv + vec2( ts.x, -ts.y));

    float gxD = -tl - 2.0 * l - bl + tr + 2.0 * r + br;
    float gyD = -tl - 2.0 * t - tr + bl + 2.0 * b + br;
    float depthEdge = sqrt(gxD * gxD + gyD * gyD);

    // ── NORMAL SOBEL ───────────────────────────────────
    vec3 ntl = readNormal(uv + vec2(-ts.x,  ts.y));
    vec3 nt  = readNormal(uv + vec2( 0.0,   ts.y));
    vec3 ntr = readNormal(uv + vec2( ts.x,  ts.y));
    vec3 nl  = readNormal(uv + vec2(-ts.x,  0.0));
    vec3 nr  = readNormal(uv + vec2( ts.x,  0.0));
    vec3 nbl = readNormal(uv + vec2(-ts.x, -ts.y));
    vec3 nb  = readNormal(uv + vec2( 0.0,  -ts.y));
    vec3 nbr = readNormal(uv + vec2( ts.x, -ts.y));

    vec3 gxN = -ntl - 2.0 * nl - nbl + ntr + 2.0 * nr + nbr;
    vec3 gyN = -ntl - 2.0 * nt - ntr + nbl + 2.0 * nb + nbr;
    float normalEdge = length(gxN) + length(gyN);

    // ── COMBINE ────────────────────────────────────────
    float edge = max(
      step(depthThreshold, depthEdge),
      step(normalThreshold, normalEdge)
    );

    outputColor = mix(inputColor, vec4(outlineColor, 1.0), edge);
  }
`

class SobelOutlineEffectImpl extends Effect {
  constructor({
    thickness = OUTLINE_THICKNESS,
    color = OUTLINE_COLOR,
    depthThreshold = OUTLINE_DEPTH_THRESHOLD,
    normalThreshold = 0.3,
    thicknessNear = 1.0,
    thicknessFar = 0.4,
    resolution = new Vector2(1, 1),
  } = {}) {
    super('SobelOutlineEffect', fragmentShader, {
      uniforms: new Map<string, Uniform>([
        [
          'texelSize',
          new Uniform(
            new Vector2(
              thickness / resolution.x,
              thickness / resolution.y
            )
          ),
        ],
        ['outlineColor', new Uniform(new Color(color))],
        ['depthThreshold', new Uniform(depthThreshold)],
        ['normalThreshold', new Uniform(normalThreshold)],
        ['thicknessNear', new Uniform(thicknessNear)],
        ['thicknessFar', new Uniform(thicknessFar)],
      ]),
      // Request the normal buffer from the EffectComposer
      defines: new Map([['NORMAL_BUFFER', 'normalBuffer']]),
    })

    this._thickness = thickness
    this._resolution = resolution
  }

  private _thickness: number
  private _resolution: Vector2

  setSize(width: number, height: number) {
    this._resolution.set(width, height)
    const texelUniform = this.uniforms.get('texelSize')
    if (texelUniform) {
      texelUniform.value.set(
        this._thickness / width,
        this._thickness / height
      )
    }
  }
}

// ── R3F WRAPPER ────────────────────────────────────────
const SobelOutline = forwardRef<SobelOutlineEffectImpl>((_, ref) => {
  const { size } = useThree()

  const effect = useMemo(() => {
    const fx = new SobelOutlineEffectImpl({
      resolution: new Vector2(size.width, size.height),
    })
    fx.setSize(size.width, size.height)
    return fx
  }, [size.width, size.height])

  return <primitive ref={ref} object={effect} dispose={null} />
})

SobelOutline.displayName = 'SobelOutline'

export default SobelOutline