import type { Material, WebGLProgramParametersWithUniforms } from 'three'

// ============================================================
// PAINTED LAYER (P5)
//
// Patches a MeshToonMaterial so surfaces carry the marks of a hand-painted
// image: brush strokes inside shadows, dashed hatching on walls, hard-edged
// wear patches on floors, leaf speckle on foliage.
//
// Everything is a function of WORLD position, never of screen or UV, so the
// marks are locked to the geometry and don't swim as the camera or characters
// move (the alignment plan calls this out explicitly). No textures: it works
// on any mesh, instanced or not, and needs no assets.
//
// Effects are compile-time constants (one small program variant per
// combination), so unused effects cost nothing.
// ============================================================

export interface PaintOptions {
  /** 0..1 — darkness of brush strokes inside shadowed areas (cast shadows and back faces) */
  shadow?: number
  /** 0..1 — darkness of dashed hatch lines on walls (fades out with distance) */
  hatch?: number
  /** 0..1 — darkness of hard-edged wear patches on upward-facing surfaces */
  blotch?: number
  /** 0..1 — strength of leaf-like speckle on every surface */
  speckle?: number
}

const NOISE = /* glsl */ `
  float pHash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float pNoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(pHash(i), pHash(i + vec3(1,0,0)), f.x), mix(pHash(i + vec3(0,1,0)), pHash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(pHash(i + vec3(0,0,1)), pHash(i + vec3(1,0,1)), f.x), mix(pHash(i + vec3(0,1,1)), pHash(i + vec3(1,1,1)), f.x), f.y),
      f.z);
  }
  float pFbm(vec3 p) {
    return 0.55 * pNoise(p) + 0.30 * pNoise(p * 2.03 + 7.1) + 0.15 * pNoise(p * 4.1 + 13.7);
  }
`

const VERTEX_HEAD = /* glsl */ `
  varying vec3 vPaintPos;
  varying vec3 vPaintNormal;
`

// After project_vertex: world-space position and normal, instancing-aware.
const VERTEX_BODY = /* glsl */ `
  vec4 paintWP = vec4(transformed, 1.0);
  vec3 paintN = objectNormal;
  #ifdef USE_INSTANCING
    paintWP = instanceMatrix * paintWP;
    paintN = mat3(instanceMatrix) * paintN;
  #endif
  vPaintPos = (modelMatrix * paintWP).xyz;
  vPaintNormal = normalize(mat3(modelMatrix) * paintN);
`

const FRAGMENT_HEAD = /* glsl */ `
  varying vec3 vPaintPos;
  varying vec3 vPaintNormal;
  ${NOISE}
`

// After color_fragment: marks that change the surface colour itself.
const FRAGMENT_ALBEDO = /* glsl */ `
  vec3 pN = normalize(vPaintNormal);
  vec3 pUp = normalize(vPaintPos);            // planet centre is the origin
  float pUpDot = dot(pN, pUp);                // +1 floor, 0 wall, -1 ceiling
  float pDist = length(vPaintPos - cameraPosition);

  #ifdef PAINT_BLOTCH
    // Wear patches on floors: large, hard-edged, two sizes
    float floorMask = smoothstep(0.55, 0.9, pUpDot);
    float big = pFbm(vPaintPos * 0.32);
    float fine = pFbm(vPaintPos * 1.15 + 31.0);
    float wear = smoothstep(0.585, 0.605, big) * 0.9 + smoothstep(0.66, 0.68, fine) * 0.5;
    diffuseColor.rgb *= 1.0 - PAINT_BLOTCH * floorMask * min(wear, 1.0);
  #endif

  #ifdef PAINT_HATCH
    // Short broken dashes in horizontal rows on walls. Height = distance from
    // the planet centre, so rows stay level all the way round the sphere.
    float wallMask = 1.0 - smoothstep(0.12, 0.40, abs(pUpDot));
    vec3 pTan = cross(pUp, pN);
    float pTanLen = length(pTan);
    if (pTanLen > 0.0001) {
      pTan /= pTanLen;
      float along = dot(vPaintPos, pTan);
      float rows = length(vPaintPos) * 2.2;
      float rowId = floor(rows);
      float line = 1.0 - smoothstep(0.05, 0.12, abs(fract(rows) - 0.5));
      // Dash lengths and gaps vary per row
      float dashN = pNoise(vec3(along * 0.9 + rowId * 7.13, rowId * 1.7, 0.5));
      float dash = smoothstep(0.52, 0.56, dashN);
      float closeness = 1.0 - smoothstep(16.0, 34.0, pDist);
      diffuseColor.rgb *= 1.0 - PAINT_HATCH * wallMask * line * dash * closeness;
    }
  #endif

  #ifdef PAINT_SPECKLE
    float speck = smoothstep(0.60, 0.64, pNoise(vPaintPos * 9.0));
    float fleck = smoothstep(0.34, 0.30, pNoise(vPaintPos * 6.5 + 3.0));
    diffuseColor.rgb *= 1.0 - PAINT_SPECKLE * speck;
    diffuseColor.rgb += PAINT_SPECKLE * 0.5 * fleck;
  #endif
`

// After lights_fragment_end: brush strokes only where direct light is absent.
const FRAGMENT_SHADOW = /* glsl */ `
  #ifdef PAINT_SHADOW
    float pLit = dot(reflectedLight.directDiffuse, vec3(0.3333));
    float pShadowed = 1.0 - smoothstep(0.0, 0.03, pLit);
    // Long thin sheets of noise along one diagonal, sliced by any surface into
    // parallel strokes. Fixed world axes: stable, and reads as one brush.
    vec3 pq = vec3(
      dot(vPaintPos, vec3(0.62, 0.62, 0.48)),
      dot(vPaintPos, vec3(-0.70, 0.70, 0.00)),
      dot(vPaintPos, vec3(0.34, 0.34, -0.88))
    );
    float pStroke = pNoise(vec3(pq.x * 0.75, pq.y * 5.2, pq.z * 5.2));
    float pStroke2 = pNoise(vec3(pq.x * 1.6 + 9.0, pq.y * 9.0, pq.z * 9.0));
    float pMark = smoothstep(0.50, 0.55, pStroke) * 0.8 + smoothstep(0.62, 0.66, pStroke2) * 0.5;
    reflectedLight.indirectDiffuse *= 1.0 - PAINT_SHADOW * pShadowed * min(pMark, 1.0);
  #endif
`

/** Adds the painted layer to a MeshToonMaterial (returns the same material). */
export function paint<M extends Material>(material: M, options: PaintOptions): M {
  const defs: string[] = []
  if (options.shadow) defs.push(`#define PAINT_SHADOW ${options.shadow.toFixed(3)}`)
  if (options.hatch) defs.push(`#define PAINT_HATCH ${options.hatch.toFixed(3)}`)
  if (options.blotch) defs.push(`#define PAINT_BLOTCH ${options.blotch.toFixed(3)}`)
  if (options.speckle) defs.push(`#define PAINT_SPECKLE ${options.speckle.toFixed(3)}`)
  if (defs.length === 0) return material

  const previous = material.onBeforeCompile
  material.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms, renderer) => {
    previous?.call(material, shader, renderer)
    const head = defs.join('\n')
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${VERTEX_HEAD}`)
      .replace('#include <project_vertex>', `#include <project_vertex>\n${VERTEX_BODY}`)
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${head}\n${FRAGMENT_HEAD}`)
      .replace('#include <color_fragment>', `#include <color_fragment>\n${FRAGMENT_ALBEDO}`)
      .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>\n${FRAGMENT_SHADOW}`)
  }
  const prevKey = material.customProgramCacheKey?.bind(material)
  material.customProgramCacheKey = () => `${prevKey?.() ?? ''}|paint:${defs.join(',')}`
  material.needsUpdate = true
  return material
}
