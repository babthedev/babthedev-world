'use client'

import { useEffect, useState } from 'react'
import { useWorldStore } from '@/store/useWorldStore'

/**
 * Tells desktop visitors the mouse turns the camera. "Click to look around" shows for a
 * few seconds after the intro until they try it; "Esc to release" shows briefly once locked.
 */
export default function LookHint() {
  const introComplete = useWorldStore((s) => s.introComplete)
  const touchUi = useWorldStore((s) => s.touchUi)
  const [locked, setLocked] = useState(false)
  const [tried, setTried] = useState(false)
  const [expired, setExpired] = useState(false)
  const [releaseShown, setReleaseShown] = useState(false)

  useEffect(() => {
    const onChange = () => {
      const now = !!document.pointerLockElement
      setLocked(now)
      if (now) {
        setTried(true)
        setReleaseShown(true)
      }
    }
    document.addEventListener('pointerlockchange', onChange)
    return () => document.removeEventListener('pointerlockchange', onChange)
  }, [])

  // The invitation is only shown for a while
  useEffect(() => {
    if (!introComplete) return
    const id = setTimeout(() => setExpired(true), 14000)
    return () => clearTimeout(id)
  }, [introComplete])

  useEffect(() => {
    if (!releaseShown) return
    const id = setTimeout(() => setReleaseShown(false), 3500)
    return () => clearTimeout(id)
  }, [releaseShown])

  const invite = introComplete && !touchUi && !tried && !expired
  const message = locked && releaseShown ? 'MOUSE LOOK  ·  ESC TO RELEASE' : invite ? 'CLICK THE WORLD TO LOOK AROUND' : null

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed bottom-6 left-1/2 z-20 -translate-x-1/2 transition-opacity duration-500 motion-reduce:transition-none ${
        message ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="border-2 border-black bg-white px-4 py-2 font-mono text-xs tracking-widest text-black shadow-[3px_3px_0_0_#0B0B0B]">
        {message ?? ' '}
      </div>
    </div>
  )
}
