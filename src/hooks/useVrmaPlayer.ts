'use client'

import { useCallback, useEffect, useRef } from 'react'
import { AnimationAction, AnimationMixer, LoopOnce, LoopRepeat } from 'three'
import type { VRM } from '@pixiv/three-vrm'
import { VRMLookAtQuaternionProxy, createVRMAnimationClip } from '@pixiv/three-vrm-animation'
import type { AnimationState } from '@/hooks/useCharacterAnimations'
import { ONE_SHOT_STATES, VRMA_CROSSFADE_S, availableClips, loadVrmAnimation } from '@/lib/vrmaClips'

interface VrmaPlayer {
  /**
   * Advance the clip mixer. Returns true when a clip owns the pose this frame
   * (the caller must then skip its procedural bone animation), false when the
   * requested state has no clip and the procedural path should run.
   * Call before vrm.update().
   */
  update: (dt: number, state: AnimationState) => boolean
}

/**
 * Plays VRMA clips on a VRM with a 0.15s crossfade between states (Q39).
 * States without a clip are left to the caller's procedural animation; the
 * hand-over in either direction resets the normalized pose so the two systems
 * never leave stale rotations behind.
 */
export function useVrmaPlayer(vrm: VRM | null): VrmaPlayer {
  const mixer = useRef<AnimationMixer | null>(null)
  const actions = useRef(new Map<AnimationState, AnimationAction>())
  const current = useRef<AnimationState | null>(null)

  useEffect(() => {
    if (!vrm) return
    const wanted = availableClips()
    if (wanted.length === 0) return

    let cancelled = false
    const m = new AnimationMixer(vrm.scene)
    mixer.current = m

    // VRMA look-at tracks need this proxy in the scene. createVRMAnimationClip
    // would create one implicitly (and warn); owning it here ties its lifetime to
    // the player.
    let lookAtProxy: VRMLookAtQuaternionProxy | null = null
    if (vrm.lookAt && !vrm.scene.getObjectByName('lookAtQuaternionProxy')) {
      lookAtProxy = new VRMLookAtQuaternionProxy(vrm.lookAt)
      lookAtProxy.name = 'lookAtQuaternionProxy'
      vrm.scene.add(lookAtProxy)
    }

    ;(async () => {
      for (const state of wanted) {
        const anim = await loadVrmAnimation(state)
        if (cancelled || !anim) continue
        const action = m.clipAction(createVRMAnimationClip(anim, vrm))
        if (ONE_SHOT_STATES.has(state)) {
          action.setLoop(LoopOnce, 1)
          action.clampWhenFinished = true
        } else {
          action.setLoop(LoopRepeat, Infinity)
        }
        actions.current.set(state, action)
      }
    })()

    const actionsMap = actions.current
    return () => {
      cancelled = true
      m.stopAllAction()
      m.uncacheRoot(vrm.scene)
      if (lookAtProxy) vrm.scene.remove(lookAtProxy)
      mixer.current = null
      actionsMap.clear()
      current.current = null
    }
  }, [vrm])

  const update = useCallback((dt: number, state: AnimationState) => {
    const m = mixer.current
    if (!m || !vrm) return false

    const next = actions.current.get(state) ?? null
    const target = next ? state : null

    if (target !== current.current) {
      const prev = current.current ? (actions.current.get(current.current) ?? null) : null
      if (next) {
        // procedural → clip: start from a clean pose so bones the clip doesn't key stay neutral
        if (!prev) vrm.humanoid.resetNormalizedPose()
        next.reset().play()
        if (prev) prev.crossFadeTo(next, VRMA_CROSSFADE_S, false)
        else next.fadeIn(VRMA_CROSSFADE_S)
      } else {
        // clip → procedural: drop clip output entirely, procedural code takes over from neutral
        m.stopAllAction()
        vrm.humanoid.resetNormalizedPose()
      }
      current.current = target
    }

    if (current.current === null) return false
    m.update(dt)
    return true
  }, [vrm])

  return { update }
}
