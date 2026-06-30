'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, RapierRigidBody, BallCollider } from '@react-three/rapier';
import { Vector3, Quaternion, Mesh } from 'three';
import { useWorldStore } from '@/store/useWorldStore';
import { useEffect } from 'react';
import { WORLD_COORDINATES, DistrictName } from '@/lib/worldCoordinates';
import { TOUR_WAYPOINTS } from '@/lib/dialogue';
import DialogueBubble from './DialogueBubble';

const FOLLOW_SPEED = 6;
const MIN_DISTANCE = 4;
const GRAVITY_STRENGTH = 60;

export default function AbdulrahmanController() {
  const bodyRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<Mesh>(null);
  
  const visitorPosition = useWorldStore((state) => state.position);
  const isTourActive = useWorldStore((state) => state.isTourActive);
  const tourWaypointIndex = useWorldStore((state) => state.tourWaypointIndex);
  const setTourWaypointIndex = useWorldStore((state) => state.setTourWaypointIndex);
  const setCurrentDialogue = useWorldStore((state) => state.setCurrentDialogue);

  useEffect(() => {
    if (typeof window !== 'undefined' && bodyRef.current) {
      const path = window.location.pathname as DistrictName;
      if (WORLD_COORDINATES[path] && path !== '/') {
        const spawn = WORLD_COORDINATES[path].spawnPoint;
        // Spawn Abdulrahman slightly offset from the visitor
        bodyRef.current.setTranslation({ x: spawn[0] - 5, y: spawn[1], z: spawn[2] - 5 }, true);
      }
    }
  }, []);

  useFrame((state, delta) => {
    if (!bodyRef.current || !meshRef.current) return;

    const currentPos = bodyRef.current.translation();
    const abdulPos = new Vector3(currentPos.x, currentPos.y, currentPos.z);

    let targetPos: Vector3;

    if (isTourActive) {
      // In Guided Tour, Abdulrahman follows the waypoints
      const waypoint = TOUR_WAYPOINTS[tourWaypointIndex];
      targetPos = new Vector3(waypoint.position[0], waypoint.position[1], waypoint.position[2]);
      
      // Update Dialogue
      setCurrentDialogue(waypoint.text);

      // Check if we reached the waypoint
      const distanceToWaypoint = abdulPos.distanceTo(targetPos);
      if (distanceToWaypoint < MIN_DISTANCE && tourWaypointIndex < TOUR_WAYPOINTS.length - 1) {
        // We reached it. Move to the next one after a delay.
        // For simplicity, we just move to the next one instantly if we get close.
        setTourWaypointIndex(tourWaypointIndex + 1);
      }
    } else {
      // In Free Roam, Abdulrahman follows the visitor
      targetPos = new Vector3(visitorPosition[0], visitorPosition[1], visitorPosition[2]);
      setCurrentDialogue(null); // Clear dialogue when not on tour
    }
    
    // 1. Central Gravity
    const normal = abdulPos.clone().normalize();
    const gravityForce = normal.clone().multiplyScalar(-GRAVITY_STRENGTH);
    bodyRef.current.applyImpulse({ x: gravityForce.x * delta, y: gravityForce.y * delta, z: gravityForce.z * delta }, true);

    // 2. Tethered Follow Logic (Spherical)
    const distance = abdulPos.distanceTo(targetPos);

    if (distance > MIN_DISTANCE) {
      // Direction to target (raw)
      const rawDir = targetPos.clone().sub(abdulPos).normalize();
      
      // Project direction onto the tangent plane of the sphere to prevent him from digging into the ground
      // tangent = rawDir - (rawDir dot normal) * normal
      const projectedDir = rawDir.sub(normal.clone().multiplyScalar(rawDir.dot(normal))).normalize();
      
      const direction = projectedDir.multiplyScalar(FOLLOW_SPEED);
      
      const currentVel = bodyRef.current.linvel();
      const currentVelVec = new Vector3(currentVel.x, currentVel.y, currentVel.z);
      const verticalVel = normal.clone().multiplyScalar(currentVelVec.dot(normal));
      
      const newVel = direction.add(verticalVel);
      bodyRef.current.setLinvel({ x: newVel.x, y: newVel.y, z: newVel.z }, true);
    } else {
      // Stop moving
      const currentVel = bodyRef.current.linvel();
      const currentVelVec = new Vector3(currentVel.x, currentVel.y, currentVel.z);
      const verticalVel = normal.clone().multiplyScalar(currentVelVec.dot(normal));
      bodyRef.current.setLinvel({ x: verticalVel.x, y: verticalVel.y, z: verticalVel.z }, true);
    }

    // 3. Visual Upright Alignment
    const up = new Vector3(0, 1, 0);
    const targetQuaternion = new Quaternion().setFromUnitVectors(up, normal);
    meshRef.current.quaternion.copy(targetQuaternion);

    // Sync position
    useWorldStore.getState().setAbdulrahmanPosition([currentPos.x, currentPos.y, currentPos.z]);
  });

  return (
    // position is [-5, 35, -5] so it spawns slightly above the 30-radius planet
    <RigidBody ref={bodyRef} position={[-5, 35, -5]} colliders={false} enabledRotations={[false, false, false]} linearDamping={1}>
      <BallCollider args={[0.5]} />
      <mesh ref={meshRef} castShadow>
        <group position={[0, 1, 0]}>
          <capsuleGeometry args={[0.5, 1.2, 4, 8]} />
          <meshStandardMaterial color="#C8C8C8" />
          <DialogueBubble />
        </group>
      </mesh>
    </RigidBody>
  );
}
