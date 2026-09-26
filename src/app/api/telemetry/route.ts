import { NextRequest, NextResponse } from 'next/server'

/**
 * Q76: Cookieless, Privacy-First Custom Beacon Telemetry
 * - Zero cookies, zero IP storage, zero cross-site fingerprinting.
 * - Tracks core engagement metrics: tour_started, tour_completed,
 *   content_opened, content_read_2min, guestbook_signed, letter_sent.
 */

export const runtime = 'nodejs'

const ALLOWED_EVENTS = new Set([
  'tour_started',
  'tour_completed',
  'content_opened',
  'content_read_2min',
  'guestbook_signed',
  'letter_sent',
])

/** What a beacon may carry. Anything else in the body is ignored. */
interface TelemetryBeacon {
  event?: string
  properties?: Record<string, unknown>
  timestamp?: number
}

export async function POST(request: NextRequest) {
  try {
    let payload: TelemetryBeacon | null = null
    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      payload = await request.json()
    } else {
      const text = await request.text()
      payload = JSON.parse(text)
    }

    const { event, properties, timestamp } = payload || {}

    if (!event || !ALLOWED_EVENTS.has(event)) {
      return new NextResponse(null, { status: 400 })
    }

    // In production / self-hosted environments, persist to custom time-series or analytics sink.
    // In dev / preview, log cleanly to stdout without IP or PII.
    const logEntry = {
      event,
      properties: properties ?? {},
      timestamp: timestamp || Date.now(),
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('[Telemetry Beacon]', JSON.stringify(logEntry))
    }

    // 204 No Content for high-throughput lightweight beacons
    return new NextResponse(null, { status: 204 })
  } catch {
    return new NextResponse(null, { status: 400 })
  }
}
