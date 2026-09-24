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
}
