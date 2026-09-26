import { useEffect } from 'react'
import { useWorldStore } from '@/store/useWorldStore'
import { useAudioManager } from '@/hooks/useAudioManager'

/**
 * Brings the ambient bed in once the intro is over. Browsers only let audio run
 * after a first gesture, so this keeps asking, gently, until the bed has started.
 */
export function useAmbience() {
  const introComplete = useWorldStore((s) => s.introComplete)
  const { startAmbience } = useAudioManager()

  useEffect(() => {
    if (!introComplete) return
    startAmbience()
    const id = setInterval(startAmbience, 1500)
    return () => clearInterval(id)
  }, [introComplete, startAmbience])
}
