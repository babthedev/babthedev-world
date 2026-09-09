import { useRef, useCallback } from 'react'

export type AnimationState = 'idle' | 'walk' | 'point' | 'wave' | 'sit'

interface UseCharacterAnimationsReturn {
  updateFromVelocity: (speed: number, baseSpeed: number) => AnimationState
  setOverride: (anim: AnimationState | null) => void
}

// Velocity threshold below which character is considered "stopped"
const WALK_THRESHOLD = 0.15

export function useCharacterAnimations(): UseCharacterAnimationsReturn {
  const current = useRef<AnimationState>('idle')
  const override = useRef<AnimationState | null>(null)

  const setOverride = useCallback((anim: AnimationState | null) => {
    override.current = anim
  }, [])

  // Called every frame with the character's current speed
  const updateFromVelocity = useCallback(
    (speed: number, baseSpeed: number): AnimationState => {
      // Gestures (point, wave) take priority until they finish
      if (override.current) {
        current.current = override.current
        return current.current
      }

      const normalizedSpeed = speed / baseSpeed
      current.current = normalizedSpeed > WALK_THRESHOLD ? 'walk' : 'idle'
      return current.current
    },
    []
  )

  return {
    updateFromVelocity,
    setOverride,
  }
}