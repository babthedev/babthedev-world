/**
 * Q96: Feature Flags & Future Venture Expansion
 * Allows unlocking districts, experimental features, and live events.
 */

export const FEATURE_FLAGS = {
  // Opening the Oryzon district (controlled via env var or dev toggle)
  ORYZON_OPEN: process.env.NEXT_PUBLIC_ORYZON_OPEN === 'true',
  // Paper cranes, drifting flecks and wind streaks (Q40/Q68). Off while the
  // Messenger-style pass lands — they read as floating render artefacts.
  AMBIENT_PAPER: process.env.NEXT_PUBLIC_AMBIENT_PAPER === 'true',
  // Cones and crates around the plazas that can be shoved and knocked over. Off until
  // it has been felt on real hardware: try it with ?knock=on, or set NEXT_PUBLIC_KNOCKABLES=true.
  KNOCKABLES: process.env.NEXT_PUBLIC_KNOCKABLES === 'true',
}

/** The knockable props are on when the flag is set, or when ?knock=on is in the URL. */
export function knockablesEnabled(): boolean {
  if (FEATURE_FLAGS.KNOCKABLES) return true
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('knock') === 'on'
}
