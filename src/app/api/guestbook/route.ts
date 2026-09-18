import { NextRequest, NextResponse } from 'next/server'

/**
 * Q79: Visitor Footprint — Cafe Corkboard Guestbook
 * - Allows visitors to leave a short 100-character note and pick an ink stamp.
 * - Seeded with charming community notes.
 * - In-memory persistent storage across requests.
 */

export const runtime = 'nodejs'

export interface GuestbookEntry {
  id: string
  name: string
  message: string
  stamp: string
  date: string
}

// Initial seed entries
const GUESTBOOK_ENTRIES: GuestbookEntry[] = [
  {
    id: 'seed-1',
    name: 'Elena R.',
    message: 'The radial gravity on this 50m sphere is unbelievably smooth! Kudos.',
    stamp: '✦',
    date: '2026-09-15',
  },
  {
    id: 'seed-2',
    name: 'Marcus K.',
    message: 'Joe gave me a decaf espresso. Still staring at the horizon curvature.',
    stamp: '☕',
    date: '2026-09-16',
  },
  {
    id: 'seed-3',
    name: 'Sumi-e Fan',
    message: 'The ink-drop iris transition and paper flecks gave me goosebumps.',
    stamp: '🕊️',
    date: '2026-09-17',
  },
  {
    id: 'seed-4',
    name: 'David W.',
    message: 'Stark brutalist typography done right. Bookmarked the essays.',
    stamp: '📜',
    date: '2026-09-18',
  },
]

export async function GET() {
  return NextResponse.json({ entries: GUESTBOOK_ENTRIES })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, message, stamp } = body || {}

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Please enter your name.' },
        { status: 400 }
      )
    }

    if (
      !message ||
      typeof message !== 'string' ||
      message.trim().length === 0 ||
      message.length > 100
    ) {
      return NextResponse.json(
        { error: 'Message must be between 1 and 100 characters.' },
        { status: 400 }
      )
    }

    const validStamps = ['☕', '✦', '📜', '🕊️', '✒️']
    const chosenStamp = validStamps.includes(stamp) ? stamp : '✦'

    const newEntry: GuestbookEntry = {
      id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim().slice(0, 30),
      message: message.trim().slice(0, 100),
      stamp: chosenStamp,
      date: new Date().toISOString().split('T')[0],
    }

    // Prepend so latest note is on top of corkboard
    GUESTBOOK_ENTRIES.unshift(newEntry)

    // Keep to a reasonable cap in memory
    if (GUESTBOOK_ENTRIES.length > 50) {
      GUESTBOOK_ENTRIES.pop()
    }

    return NextResponse.json({ success: true, entry: newEntry })
  } catch {
    return NextResponse.json(
      { error: 'Could not pin your note to the corkboard.' },
      { status: 500 }
    )
  }
}
