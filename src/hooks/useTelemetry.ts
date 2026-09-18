'use client'

import { useCallback } from 'react'

export type TelemetryEvent =
  | 'tour_started'
  | 'tour_completed'
  | 'content_opened'
  | 'content_read_2min'
  | 'guestbook_signed'
  | 'letter_sent'

export function useTelemetry() {
  const trackEvent = useCallback(
    (event: TelemetryEvent, properties?: Record<string, any>) => {
      if (typeof window === 'undefined') return

      const payload = JSON.stringify({
        event,
        properties,
        timestamp: Date.now(),
      })

      // Prefer navigator.sendBeacon for non-blocking transmission on unload/page lifecycle
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' })
        const sent = navigator.sendBeacon('/api/telemetry', blob)
        if (sent) return
      }

      // Fallback to fetch with keepalive
      fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {
        // Silent error handling for telemetry
      })
    },
    []
  )

  return { trackEvent }
}
