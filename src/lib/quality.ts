// ============================================================
// QUALITY TIERS (Q57)
//
// Two tiers. The expensive parts of the frame are all *extra passes over the
// whole scene* (the normal buffer the outline pass reads, the shadow map, SMAA)
// and the pixel count, so that is what the low tier drops:
//
//   high  dpr ≤ 1.5, 2048 shadow map, normal-buffer outlines, SMAA, ambient occlusion
//   low   dpr 1,     1024 shadow map, depth-only outlines, no SMAA, no ambient occlusion
//
// The low tier is chosen automatically for weak or touch-first devices, and
// can be forced with ?quality=low or ?quality=high (handy for comparing).
// ============================================================

export type QualityTier = 'high' | 'low'

export interface QualitySettings {
  maxPixelRatio: number
  shadowMapSize: number
  /** Render the scene a second time into a normal buffer, so creases inside one surface get inked. */
  normalPass: boolean
  smaa: boolean
  /** Screen-space ambient occlusion: soft darkening in corners and under overhangs. Needs the normal buffer. */
  ao: boolean
}

export const QUALITY: Record<QualityTier, QualitySettings> = {
  high: { maxPixelRatio: 1.5, shadowMapSize: 2048, normalPass: true, smaa: true, ao: true },
  low: { maxPixelRatio: 1, shadowMapSize: 1024, normalPass: false, smaa: false, ao: false },
}

export function getQualityTier(): QualityTier {
  if (typeof window === 'undefined') return 'high'
  const forced = new URLSearchParams(window.location.search).get('quality')
  if (forced === 'low' || forced === 'high') return forced
  const cores = navigator.hardwareConcurrency ?? 8
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8
  // "coarse pointer" means touch is the PRIMARY input (phones, tablets). Do not
  // use maxTouchPoints here: touch-screen laptops report it too.
  const touchFirst = window.matchMedia?.('(pointer: coarse)').matches ?? false
  return cores <= 4 || memory <= 4 || touchFirst ? 'low' : 'high'
}
