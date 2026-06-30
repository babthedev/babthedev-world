import { WORLD_COORDINATES } from './worldCoordinates';

export interface TourWaypoint {
  position: [number, number, number];
  text: string;
}

export const TOUR_WAYPOINTS: TourWaypoint[] = [
  {
    position: WORLD_COORDINATES['/'].spawnPoint,
    text: "Welcome to my digital space. Let me show you around.",
  },
  {
    position: WORLD_COORDINATES['/projects'].spawnPoint,
    text: "Here are my recent case studies. The Oryzon project is particularly interesting.",
  },
  {
    position: WORLD_COORDINATES['/essays'].spawnPoint,
    text: "I also write about software engineering and brutalist architecture.",
  },
  {
    position: WORLD_COORDINATES['/bio'].spawnPoint,
    text: "And here is a bit more about my professional journey.",
  }
];
