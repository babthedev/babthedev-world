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
// Sobel operator run on scene depth. `readDepth(uv)` is a
// helper injected by the `postprocessing` library when the
// effect declares EffectAttribute.DEPTH.
const fragmentShader = /* glsl */ `
  uniform vec2 texelSize;
  uniform vec3 outlineColor;
  uniform float depthThreshold;

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    float tl = readDepth(uv + vec2(-texelSize.x,  texelSize.y));
    float t  = readDepth(uv + vec2( 0.0,           texelSize.y));
    float tr = readDepth(uv + vec2( texelSize.x,   texelSize.y));
    float l  = readDepth(uv + vec2(-texelSize.x,   0.0));
    float r  = readDepth(uv + vec2( texelSize.x,   0.0));
    float bl = readDepth(uv + vec2(-texelSize.x,  -texelSize.y));
    float b  = readDepth(uv + vec2( 0.0,          -texelSize.y));
    float br = readDepth(uv + vec2( texelSize.x,  -texelSize.y));

    float gx = -tl - 2.0 * l - bl + tr + 2.0 * r + br;
    float gy = -tl - 2.0 * t - tr + bl + 2.0 * b + br;

    float edge = sqrt(gx * gx + gy * gy);
    edge = step(depthThreshold, edge);

    outputColor = mix(inputColor, vec4(outlineColor, 1.0), edge);
  }
`

class SobelOutlineEffectImpl extends Effect {
  constructor({
    thickness = OUTLINE_THICKNESS,
    color = OUTLINE_COLOR,
    depthThreshold = OUTLINE_DEPTH_THRESHOLD,
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
      ]),
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