'use client'

import { useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import { useWorldStore } from '@/store/useWorldStore'
import { GREETING_TIMELINE, greeting, skipGreeting, stepGreeting } from '@/lib/greeting'
import { cameraRig } from '@/lib/cameraRig'
import { getSurfaceNormal, settleFacing } from '@/lib/sphereMath'

const _visitor = new Vector3()
const _guide = new Vector3()
const _normal = new Vector3()
const _sep = new Vector3()

/**
 * Runs the opening handshake (see lib/greeting.ts). Renders nothing.
 *
 * Starts once both characters have loaded, while the intro dialogue is still on
 * screen. It frames the pair in profile so the clasp is visible, and hands the
 * camera back afterwards. Skipped if the intro is already over (deep links after
 * a reload, tests) or the visitor prefers reduced motion.
 */
export default function GreetingDirector() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') (window as unknown as { __GREETING__: typeof greeting }).__GREETING__ = greeting
  }, [])

  useFrame((_, delta) => {
    const store = useWorldStore.getState()
    if (store.greetingActive !== greeting.active) store.setGreetingActive(greeting.active)
    if (greeting.done) return
    const { introComplete, position, abdulrahmanPosition, charactersReady } = useWorldStore.getState()
    if (!charactersReady && greeting.ready.visitor && greeting.ready.abdulrahman) useWorldStore.getState().setCharactersReady(true)

    if (!greeting.active) {
      if (introComplete || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
        skipGreeting()
        return
      }
      if (!(greeting.ready.visitor && greeting.ready.abdulrahman)) return
      greeting.active = true
      greeting.t = 0
    }

    _visitor.set(position[0], position[1], position[2])
    _guide.set(abdulrahmanPosition[0], abdulrahmanPosition[1], abdulrahmanPosition[2])
    _normal.copy(getSurfaceNormal(_visitor))
    _sep.copy(_guide).sub(_visitor)
    settleFacing(_normal, _sep)

    // Frame the pair in profile: the camera looks across the line between them,
    // so the clasp in the middle is in clear view instead of hidden behind a back.
    if (greeting.t === 0) cameraRig.heading.copy(_sep).cross(_normal).normalize()
    cameraRig.followRate = 0

    if (greeting.t > GREETING_TIMELINE.total) skipGreeting()
    else stepGreeting(Math.min(delta, 0.05))
  })

  return null
}
