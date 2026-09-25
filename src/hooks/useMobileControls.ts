import { useEffect } from 'react'

const DRAG_THRESHOLD = 12 // px before a touch counts as a drag rather than a tap
const TAP_MAX_DURATION = 250 // ms

/**
 * A quick tap on the WORLD is Interact, the same as pressing E. Movement is the
 * virtual joystick's job (see ui/VirtualJoystick), and taps that land on any
 * button, the joystick or the minimap are theirs, not the world's.
 *
 * Tracks one finger by identifier, so a thumb held on the joystick never
 * confuses a tap made with the other hand.
 */
export function useTapToInteract(onTap: () => void) {
  useEffect(() => {
    let id = -1
    let startX = 0
    let startY = 0
    let startTime = 0
    let onWorld = false

    const onStart = (e: TouchEvent) => {
      if (id !== -1) return
      const t = e.changedTouches[0]
      id = t.identifier
      startX = t.clientX
      startY = t.clientY
      startTime = performance.now()
      onWorld = !!(e.target as Element | null)?.closest?.('canvas:not([data-minimap])')
    }
    const onEnd = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier !== id) continue
        id = -1
        const quick = performance.now() - startTime < TAP_MAX_DURATION
        const still = Math.hypot(t.clientX - startX, t.clientY - startY) < DRAG_THRESHOLD
        if (onWorld && quick && still) onTap()
      }
    }
    const onCancel = () => {
      id = -1
    }

    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchend', onEnd)
    window.addEventListener('touchcancel', onCancel)
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('touchcancel', onCancel)
    }
  }, [onTap])
}
