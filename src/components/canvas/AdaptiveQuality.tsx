'use client'

import { PerformanceMonitor } from '@react-three/drei'
import { useThree } from '@react-three/fiber'

/**
 * Steady frames feel more premium than sharp ones. Watches the frame rate and
 * trades pixel density (never features) to hold it: the render scale drops a
 * step when frames run long and climbs back when there is headroom.
 */
export default function AdaptiveQuality({ maxDpr }: { maxDpr: number }) {
  const setDpr = useThree((s) => s.setDpr)
  const MIN_DPR = 0.7
  return (
    <PerformanceMonitor
      // A dip must last a moment before it counts, so a hiccup doesn't shrink the picture
      flipflops={3}
      onChange={({ factor }) => setDpr(MIN_DPR + (maxDpr - MIN_DPR) * factor)}
    />
  )
}
