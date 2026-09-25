import { useEffect, useRef } from 'react'
import { useWorldStore } from '@/store/useWorldStore'
import { IDLE_RESUME_TOUR_MS } from '@/lib/constants'
import { touchInput } from '@/lib/touchInput'

export function useTourLogic() {
  const isTourActive = useWorldStore((s) => s.isTourActive)
  const introComplete = useWorldStore((s) => s.introComplete)
  const isReading = useWorldStore((s) => s.isReading)
  const mapOpen = useWorldStore((s) => s.mapOpen)
  const setTourActive = useWorldStore((s) => s.setTourActive)

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Tour logic only matters once intro has finished
    if (!introComplete) return
    // Already touring — nothing to resume
    if (isTourActive) return
    // Reading panel open — movement is frozen anyway, don't resume tour
    if (isReading) return
    // Browsing the world map is not idling
    if (mapOpen) return

    const clearTimer = () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
        idleTimerRef.current = null
      }
    }

    const armIdleTimer = () => {
      clearTimer()
      idleTimerRef.current = setTimeout(() => {
        // A thumb held steadily on the joystick sends no new events, but is not idle; and a
        // visitor who has just jumped across town is looking around, not waiting to be led
        const held = useWorldStore.getState().tourHoldUntil > Date.now()
        if (touchInput.active || held) {
          armIdleTimer()
          return
        }
        setTourActive(true)
      }, Math.max(IDLE_RESUME_TOUR_MS, useWorldStore.getState().tourHoldUntil - Date.now()))
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
  }, [isTourActive, introComplete, isReading, mapOpen, setTourActive])
}