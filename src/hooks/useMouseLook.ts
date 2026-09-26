import { useEffect } from 'react'
import { cameraRig } from '@/lib/cameraRig'
import { useWorldStore } from '@/store/useWorldStore'

const YAW_PER_PX = 0.0026 // radians of turn per pixel of mouse travel
const PITCH_PER_PX = 0.002

const isWorldCanvas = (target: EventTarget | null) =>
  !!(target as Element | null)?.closest?.('canvas:not([data-minimap])')

/** Whether the mouse may steer the camera right now: desktop, in the world, no panel in the way. */
function mayLook() {
  const s = useWorldStore.getState()
  return s.introComplete && !s.touchUi && !s.isReading && !s.mapOpen && s.activePanel === null
}

/**
 * Mouse look, like a third-person game. Click the world and the pointer locks: move
 * the mouse to turn the camera (and tilt it up and down), and W A S D walk relative
 * to where you are looking. Esc lets go. If the browser refuses to lock, holding the
 * button and dragging does the same job.
 *
 * The heading is a world-space vector the camera already owns (see cameraRig), so
 * this only has to say how far to turn it each frame.
 */
export function useMouseLook() {
  useEffect(() => {
    let dragging = false
    const sync = () => {
      cameraRig.mouseLook = dragging || !!document.pointerLockElement
    }

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0 || !mayLook() || !isWorldCanvas(e.target)) return
      dragging = true
      sync()
      try {
        const asked = (e.target as HTMLElement).closest('canvas')?.requestPointerLock() as unknown as Promise<void> | undefined
        asked?.catch?.(() => {}) // refused: dragging still works
      } catch {
        // no pointer lock available: dragging still works
      }
    }
    const onUp = () => {
      dragging = false
      sync()
    }
    const onMove = (e: MouseEvent) => {
      if (!(dragging || document.pointerLockElement) || !mayLook()) return
      cameraRig.lookYaw += e.movementX * YAW_PER_PX
      cameraRig.lookPitch += e.movementY * PITCH_PER_PX
    }

    // Let go of the mouse the moment something needs it: a panel, the map, a modal
    const unsubscribe = useWorldStore.subscribe(() => {
      if (document.pointerLockElement && !mayLook()) document.exitPointerLock()
    })

    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    document.addEventListener('mousemove', onMove)
    document.addEventListener('pointerlockchange', sync)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('pointerlockchange', sync)
      unsubscribe()
      cameraRig.mouseLook = false
    }
  }, [])
}
