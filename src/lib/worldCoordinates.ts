export type DistrictName = '/' | '/bio' | '/projects' | '/essays';

export interface DistrictCoord {
  path: DistrictName;
  spawnPoint: [number, number, number];
  sensorPoint: [number, number, number];
}

// Planet radius is 30. Spawning slightly above (radius + 2) to prevent clipping.
export const WORLD_COORDINATES: Record<DistrictName, DistrictCoord> = {
  '/': {
    path: '/',
    spawnPoint: [0, 32, 0], // Top of the sphere
    sensorPoint: [0, 30, 0],
  },
  '/projects': {
    path: '/projects',
    spawnPoint: [0, 0, -32], // Back of the sphere
    sensorPoint: [0, 0, -30],
  },
  '/bio': {
    path: '/bio',
    spawnPoint: [-32, 0, 0], // Left side
    sensorPoint: [-30, 0, 0],
  },
  '/essays': {
    path: '/essays',
    spawnPoint: [32, 0, 0], // Right side
    sensorPoint: [30, 0, 0],
  },
};
