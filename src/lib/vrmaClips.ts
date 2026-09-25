import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { VRMAnimationLoaderPlugin, type VRMAnimation } from '@pixiv/three-vrm-animation'
import type { AnimationState } from '@/hooks/useCharacterAnimations'

// ============================================================
// VRMA CLIP LIBRARY (P4)
//
// Characters animate from VRM Animation (.vrma) clips when they exist and
// fall back to the procedural bone animation in CharacterModel when they
// don't, so the site works identically with zero, some, or all clips.
//
// Clips are looked up at  /animations/<state>.vrma  (public/animations/).
// Which ones exist is declared, not probed: probing a missing file would put a
// 404 in every visitor's console. Declare them with
//
//   NEXT_PUBLIC_VRMA_CLIPS=idle,walk,sit,wave,point
//
// See docs/ANIMATIONS.md.
// ============================================================

/** Q39: fast crossfade between states. */
export const VRMA_CROSSFADE_S = 0.15

/** States that play once and hold their last frame instead of looping. */
export const ONE_SHOT_STATES: ReadonlySet<AnimationState> = new Set<AnimationState>(['wave', 'point'])

const ALL_STATES: readonly AnimationState[] = ['idle', 'walk', 'sit', 'wave', 'point']

function parseList(raw: string | undefined): AnimationState[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is AnimationState => (ALL_STATES as readonly string[]).includes(s))
}

/** Clip states declared as available. In dev, `window.__VRMA_CLIPS__` overrides the env var (used by the test harness). */
export function availableClips(): AnimationState[] {
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    const override = (window as unknown as { __VRMA_CLIPS__?: unknown }).__VRMA_CLIPS__
    if (Array.isArray(override)) return parseList(override.join(','))
  }
  return parseList(process.env.NEXT_PUBLIC_VRMA_CLIPS)
}

export const vrmaUrl = (state: AnimationState) => `/animations/${state}.vrma`

// One fetch + parse per clip for the whole app, shared by every character.
// A clip that fails to load resolves to null (and warns once) so the character
// keeps its procedural animation instead of breaking.
const cache = new Map<AnimationState, Promise<VRMAnimation | null>>()

export function loadVrmAnimation(state: AnimationState): Promise<VRMAnimation | null> {
  let pending = cache.get(state)
  if (!pending) {
    const loader = new GLTFLoader()
    loader.register((parser) => new VRMAnimationLoaderPlugin(parser))
    pending = loader
      .loadAsync(vrmaUrl(state))
      .then((gltf) => {
        const anim = (gltf.userData.vrmAnimations as VRMAnimation[] | undefined)?.[0]
        if (!anim) throw new Error('file contains no VRM animation')
        return anim
      })
      .catch((err: unknown) => {
        console.warn(`[vrma] "${state}" unavailable (${vrmaUrl(state)}): ${err instanceof Error ? err.message : err}. Using procedural animation.`)
        return null
      })
    cache.set(state, pending)
  }
  return pending
}
