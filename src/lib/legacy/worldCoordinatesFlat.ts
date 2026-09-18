// ============================================================
// ARCHIVED LEGACY CODE — Flat XZ World Coordinates
// Preserved per Q91 in docs/alignment_plan.md.
// Active production world uses true spherical math (sphereMath.ts).
// ============================================================

export type DistrictNameFlat = '/' | '/bio' | '/projects' | '/essays' | '/404'

export interface DistrictCoordFlat {
  path: DistrictNameFlat
  label: string
  spawnPoint: [number, number, number]
  sensorPoint: [number, number, number]
  entryDialogue: string
  revisitDialogue: string
}

export const LEGACY_FLAT_COORDINATES: Record<DistrictNameFlat, DistrictCoordFlat> = {
  '/': {
    path: '/',
    label: 'The Hub',
    spawnPoint: [0, 1, 0],
    sensorPoint: [0, 0, 0],
    entryDialogue: 'Welcome. This is where everything starts.',
    revisitDialogue: 'Back at the hub.',
  },
  '/bio': {
    path: '/bio',
    label: 'Welcome Terrace',
    spawnPoint: [-40, 1, 0],
    sensorPoint: [-40, 0, 0],
    entryDialogue: 'This is the terrace. Pull up a chair.',
    revisitDialogue: 'The terrace again.',
  },
  '/projects': {
    path: '/projects',
    label: 'Projects Exhibition',
    spawnPoint: [40, 1, 0],
    sensorPoint: [40, 0, 0],
    entryDialogue: 'The exhibition space. Each pedestal is a case study.',
    revisitDialogue: 'Back to the exhibition.',
  },
  '/essays': {
    path: '/essays',
    label: 'The Library',
    spawnPoint: [0, 1, -40],
    sensorPoint: [0, 0, -40],
    entryDialogue: 'The library. Quieter here.',
    revisitDialogue: 'The library. Still quiet.',
  },
  '/404': {
    path: '/404',
    label: 'Dead End',
    spawnPoint: [0, 1, 100],
    sensorPoint: [0, 0, 100],
    entryDialogue: "This isn't on the map.",
    revisitDialogue: 'Still not on the map.',
  },
}
