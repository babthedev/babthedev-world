// ============================================================
// DIALOGUE — All text content for Abdulrahman
// Stored here, not in MDX, for tight 3D timing coupling.
// ============================================================

import { WORLD_COORDINATES } from './worldCoordinates'

// ─── TYPES ────────────────────────────────────────────────

export type GestureType =
  | 'idle'
  | 'point'
  | 'wave'
  | 'acknowledge'
  | 'yield'
  | 'waiting'

export interface DialogueLine {
  text: string
  gesture: GestureType
  durationMs?: number    // override auto-calculated duration
}

export interface TourWaypoint {
  position: [number, number, number]
  lines: DialogueLine[]
}

// ─── INTRO SEQUENCE ───────────────────────────────────────
// Plays on top of the fully loaded world.
// Bottom panel style, like messenger's opening.

export const INTRO_SEQUENCE: DialogueLine[] = [
  {
    text: "Hey. I'm Abdulrahman.",
    gesture: 'wave',
  },
  {
    text: "This is my world. Everything I've built, written, and thought about lives here.",
    gesture: 'idle',
  },
  {
    text: "Walk around with WASD. I'll be right beside you.",
    gesture: 'point',
  },
  {
    text: "Or just wait — I'll show you around myself.",
    gesture: 'idle',
  },
]

// ─── TOUR WAYPOINTS ───────────────────────────────────────
// Abdulrahman leads through these in Guided Tour mode.

export const TOUR_WAYPOINTS: TourWaypoint[] = [
  {
    position: WORLD_COORDINATES['/'].spawnPoint,
    lines: [
      {
        text: "This is the Hub. Every path branches from here.",
        gesture: 'point',
      },
    ],
  },
  {
    position: WORLD_COORDINATES['/projects'].spawnPoint,
    lines: [
      {
        text: "The exhibition. Each pedestal is something I built.",
        gesture: 'point',
      },
      {
        text: "Walk up to one and press E to open it.",
        gesture: 'idle',
      },
    ],
  },
  {
    position: WORLD_COORDINATES['/essays'].spawnPoint,
    lines: [
      {
        text: "The library. I write here when I have something to say.",
        gesture: 'idle',
      },
    ],
  },
  {
    position: WORLD_COORDINATES['/bio'].spawnPoint,
    lines: [
      {
        text: "The terrace. This one is more personal.",
        gesture: 'idle',
      },
      {
        text: "That's Joe. He only drinks coffee after midnight.",
        gesture: 'point',
      },
    ],
  },
]

// ─── NPC DIALOGUES ────────────────────────────────────────

export const NPC_DIALOGUES: Record<string, DialogueLine[]> = {
  joe: [
    { text: "...", gesture: 'idle' },
    { text: "I've had six cups today. It's 2am.", gesture: 'idle' },
    { text: "Worth it.", gesture: 'idle' },
  ],
  'library-sleeper': [
    { text: "...", gesture: 'idle' },
    { text: "Zzzz.", gesture: 'idle' },
  ],
}

// ─── FLAVOR DIALOGUES ─────────────────────────────────────
// Random lines when visitor clicks Abdulrahman in Free Roam.

export const FLAVOR_DIALOGUES: DialogueLine[] = [
  { text: "Still here.", gesture: 'acknowledge' },
  { text: "You found a hidden interaction.", gesture: 'acknowledge' },
  {
    text: "I built all of this in Next.js and React Three Fiber.",
    gesture: 'idle',
  },
  { text: "The whole site costs zero dollars a month to run.", gesture: 'idle' },
  { text: "Oryzon is coming. That whole district is under construction.", gesture: 'point' },
  { text: "Don't go south. You'll see why.", gesture: 'idle' },
  { text: "The library used to be indoors. I moved it outside.", gesture: 'idle' },
  {
    text: "Joe has been here longer than I have.",
    gesture: 'point',
  },
]

// ─── ZONE TRANSITION DIALOGUES ────────────────────────────
// Triggered when entering a new district.

export const ZONE_DIALOGUES: Record<string, DialogueLine[]> = {
  '/bio': [
    { text: "Welcome Terrace. Grab a seat.", gesture: 'point' },
  ],
  '/projects': [
    {
      text: "The exhibition. Three case studies, one archive.",
      gesture: 'point',
    },
  ],
  '/essays': [
    { text: "Quiet here. Good for reading.", gesture: 'idle' },
  ],
  '/': [
    { text: "Back at the hub.", gesture: 'idle' },
  ],
}

// ─── SPECIAL DIALOGUES ────────────────────────────────────

export const SPECIAL_DIALOGUES = {
  caught_up: {
    text: "Keep up.",
    gesture: 'yield' as GestureType,
  },
  reading_open: {
    text: "Take your time. I'll wait.",
    gesture: 'waiting' as GestureType,
  },
  reading_close: {
    text: "Good. Shall we continue?",
    gesture: 'point' as GestureType,
  },
  idle_30s: {
    text: "Still there?",
    gesture: 'acknowledge' as GestureType,
  },
  small_viewport: {
    text: "You might want a wider screen for this.",
    gesture: 'idle' as GestureType,
  },
  oryzon_gate: {
    text: "This one's still being built. Check back soon.",
    gesture: 'point' as GestureType,
  },
  '404': {
    text: "This isn't on the map.",
    gesture: 'idle' as GestureType,
  },
}

// ─── UTILITY ──────────────────────────────────────────────
// Calculates how long a dialogue line should display.

export function calcDialogueDuration(
  text: string,
  wordsPerMs = 250,
  bufferMs = 1000
): number {
  const wordCount = text.trim().split(/\s+/).length
  return wordCount * wordsPerMs + bufferMs
}

// Random flavor line picker
export function getRandomFlavor(): DialogueLine {
  return FLAVOR_DIALOGUES[
    Math.floor(Math.random() * FLAVOR_DIALOGUES.length)
  ]
}