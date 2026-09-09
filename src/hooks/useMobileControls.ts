import { useRef, useCallback, useEffect, useState } from 'react'

interface TouchState {
  active: boolean
  startX: number
  startY: number
  deltaX: number
  deltaY: number
}

const DRAG_THRESHOLD = 12 // px before it counts as movement vs a tap
const TAP_MAX_DURATION = 200 // ms

export function useMobileControls(onTap?: () => void) {
  const [isMobile, setIsMobile] = useState(false)
  const touchState = useRef<TouchState>({
    active: false,
    startX: 0,
    startY: 0,
    deltaX: 0,
    deltaY: 0,
  })
  const touchStartTime = useRef(0)

  useEffect(() => {
    setIsMobile(
      typeof window !== 'undefined' &&
        ('ontouchstart' in window || navigator.maxTouchPoints > 0)
    )
  }, [])

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0]
    touchState.current = {
      active: true,
      startX: touch.clientX,
      startY: touch.clientY,
      deltaX: 0,
      deltaY: 0,
    }
    touchStartTime.current = Date.now()
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchState.current.active) return
    const touch = e.touches[0]
    touchState.current.deltaX = touch.clientX - touchState.current.startX
    touchState.current.deltaY = touch.clientY - touchState.current.startY
  }, [])

  const handleTouchEnd = useCallback(() => {
    const duration = Date.now() - touchStartTime.current
    const { deltaX, deltaY } = touchState.current
    const dragDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    // Tap: short duration, minimal drag → treated as Interact
    if (duration < TAP_MAX_DURATION && dragDistance < DRAG_THRESHOLD) {
      onTap?.()
    }

    touchState.current = {
      active: false,
      startX: 0,
      startY: 0,
      deltaX: 0,
      deltaY: 0,
    }
  }, [onTap])

  useEffect(() => {
    if (!isMobile) return
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('touchend', handleTouchEnd)
    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isMobile, handleTouchStart, handleTouchMove, handleTouchEnd])

  // Returns binary direction — dragging further does NOT increase speed,
  // per your original spec
  const getDirection = useCallback((): { x: number; z: number } => {
    const { active, deltaX, deltaY } = touchState.current
    if (!active) return { x: 0, z: 0 }

    const dragDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    if (dragDistance < DRAG_THRESHOLD) return { x: 0, z: 0 }

    return {
      x: deltaX > 0 ? 1 : deltaX < 0 ? -1 : 0,
      z: deltaY > 0 ? 1 : deltaY < 0 ? -1 : 0,
    }
  }, [])

  return { isMobile, getDirection }
}