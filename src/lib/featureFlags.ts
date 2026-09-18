/**
 * Q96: Feature Flags & Future Venture Expansion
 * Allows unlocking districts, experimental features, and live events.
 */

export const FEATURE_FLAGS = {
  // Opening the Oryzon district (controlled via env var or dev toggle)
  ORYZON_OPEN: process.env.NEXT_PUBLIC_ORYZON_OPEN === 'true',
}
