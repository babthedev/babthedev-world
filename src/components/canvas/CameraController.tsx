'use client';

import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useWorldStore } from '@/store/useWorldStore';

const CAMERA_DISTANCE = 25; // Distance up from surface
const CAMERA_BACK = 20;     // Distance behind player

export default function CameraController() {
  const visitorPos = useWorldStore((state) => state.position);
  const abdulPos = useWorldStore((state) => state.abdulrahmanPosition);
  const isTourActive = useWorldStore((state) => state.isTourActive);

  useFrame((state, delta) => {
    let targetX, targetY, targetZ;

    if (isTourActive) {
      targetX = (visitorPos[0] + abdulPos[0]) / 2;
      targetY = (visitorPos[1] + abdulPos[1]) / 2;
      targetZ = (visitorPos[2] + abdulPos[2]) / 2;
    } else {
      targetX = visitorPos[0];
      targetY = visitorPos[1];
      targetZ = visitorPos[2];
    }

    const targetPos = new Vector3(targetX, targetY, targetZ);
    
    // Normal vector from center of planet
    const normal = targetPos.clone().normalize();
    
    // Calculate a consistent "forward" tangent direction for the camera offset
    const worldUp = new Vector3(0, 1, 0);
    const forwardVec = new Vector3();
    
    if (Math.abs(normal.dot(worldUp)) > 0.99) {
      // If we are exactly at the North/South pole, use Z axis
      forwardVec.set(0, 0, 1);
    } else {
      // Create a tangent plane based on global Up
      const rightVec = new Vector3().crossVectors(worldUp, normal).normalize();
      forwardVec.crossVectors(normal, rightVec).normalize();
    }
    
    // Calculate the desired position: offset "up" along normal, and "back" along tangent
    const offset = normal.clone().multiplyScalar(CAMERA_DISTANCE).add(forwardVec.clone().multiplyScalar(-CAMERA_BACK));
    const desiredCameraPos = targetPos.clone().add(offset);

    // Smooth damp camera position
    state.camera.position.lerp(desiredCameraPos, 3 * delta);
    
    // In a spherical world, the camera's Up vector MUST match the planet normal
    // so the horizon stays level relative to the player
    state.camera.up.copy(normal);
    state.camera.lookAt(targetPos);
  });

  return null;
}
