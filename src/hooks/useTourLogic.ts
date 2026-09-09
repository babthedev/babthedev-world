import { useEffect, useRef } from 'react'
import { useWorldStore } from '@/store/useWorldStore'
import { IDLE_RESUME_TOUR_MS } from '@/lib/constants'

export function useTourLogic() {
  const isTourActive = useWorldStore((s) => s.isTourActive)
  const introComplete = useWorldStore((s) => s.introComplete)
  const isReading = useWorldStore((s) => s.isReading)
  const setTourActive = useWorldStore((s) => s.setTourActive)

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Tour logic only matters once intro has finished
    if (!introComplete) return
    // Already touring — nothing to resume
    if (isTourActive) return
    // Reading panel open — movement is frozen anyway, don't resume tour
    if (isReading) return

    const clearTimer = () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
        idleTimerRef.current = null
      }
    }

    const armIdleTimer = () => {
      clearTimer()
      idleTimerRef.current = setTimeout(() => {
        setTourActive(true)
      }, IDLE_RESUME_TOUR_MS)
    }

    const handleActivity = () => {
      armIdleTimer()
    }

    window.addEventListener('keydown', handleActivity)
    window.addEventListener('pointerdown', handleActivity)

    // Start counting immediately on entering Free Roam
    armIdleTimer()

    return () => {
      clearTimer()
      window.removeEventListener('keydown', handleActivity)
      window.removeEventListener('pointerdown', handleActivity)
    }
  }, [isTourActive, introComplete, isReading, setTourActive])
}