'use client'

import { useEffect } from 'react'
import { useWorldStore } from '@/store/useWorldStore'

/**
 * Page Visibility API listener (Q147).
 * When document.hidden === true, pauses render/physics and attenuates audio by 6dB
 * to prevent fan spin and battery drain on visitor laptops.
 */
export function usePageVisibility() {
  const setIsTabHidden = useWorldStore((s) => s.setIsTabHidden)

  useEffect(() => {
    if (typeof document === 'undefined') return

    const handleVisibilityChange = () => {
      const hidden = document.hidden
      setIsTabHidden(hidden)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [setIsTabHidden])
}
