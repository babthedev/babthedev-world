'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion'
import { useWorldStore } from '@/store/useWorldStore'

// If the models never arrive (offline, blocked WebGL) the world's own error UI must
// not stay hidden behind this screen forever.
const GIVE_UP_MS = 40_000

// Four balls bouncing out of step, each a little slower than the last
const circleVariants: Variants = {
  animate: (i: number) => ({
    y: [0, -30, 0],
    transition: { repeat: Infinity, repeatType: 'loop', duration: 1.2 + i * 0.2, ease: 'easeInOut', delay: 0 },
  }),
}

/**
 * Covers the world until both characters have loaded, so the first thing the
 * visitor sees is the pair meeting, not an empty scene. Slides away once they are ready.
 */
export default function LoadingScreen() {
  const charactersReady = useWorldStore((s) => s.charactersReady)
  const reduceMotion = useReducedMotion()
  const [gaveUp, setGaveUp] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setGaveUp(true), GIVE_UP_MS)
    return () => clearTimeout(timer)
  }, [])

  const loading = !charactersReady && !gaveUp

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          role="status"
          aria-label="Loading the world"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        >
          <div className="flex gap-8 md:gap-16">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="h-16 w-16 rounded-full bg-white md:h-28 md:w-28"
                variants={circleVariants}
                animate={reduceMotion ? undefined : 'animate'}
                custom={i}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
