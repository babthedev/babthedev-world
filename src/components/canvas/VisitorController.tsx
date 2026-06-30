'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import { RigidBody, RapierRigidBody, BallCollider } from '@react-three/rapier';
import { Vector3, Quaternion, Mesh } from 'three';
import { useWorldStore } from '@/store/useWorldStore';
import { useEffect } from 'react';
import { WORLD_COORDINATES, DistrictName } from '@/lib/worldCoordinates';

const SPEED = 12;
const GRAVITY_STRENGTH = 60; // Strong pull to the center of the planet

export default function VisitorController() {
  const bodyRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<Mesh>(null);
  const [, get] = useKeyboardControls();
  const isTourActive = useWorldStore((state) => state.isTourActive);
  const abdulrahmanPosition = useWorldStore((state) => state.abdulrahmanPosition);
  const setPosition = useWorldStore((state) => state.setPosition);
  const setTourActive = useWorldStore((state) => state.setTourActive);

  useEffect(() => {
    if (typeof window !== 'undefined' && bodyRef.current) {
      const path = window.location.pathname as DistrictName;
      if (WORLD_COORDINATES[path] && path !== '/') {
        const spawn = WORLD_COORDINATES[path].spawnPoint;
        bodyRef.current.setTranslation({ x: spawn[0], y: spawn[1], z: spawn[2] }, true);
      }
    }
  }, []);

  useFrame((state, delta) => {
    if (!bodyRef.current || !meshRef.current) return;



    const pos = bodyRef.current.translation();
    const positionVector = new Vector3(pos.x, pos.y, pos.z);
    
    // 1. Central Gravity (pull towards 0,0,0)
    const normal = positionVector.clone().normalize();
    const gravityForce = normal.clone().multiplyScalar(-GRAVITY_STRENGTH);
    // Apply continuous gravity force
    bodyRef.current.applyImpulse({ x: gravityForce.x * delta, y: gravityForce.y * delta, z: gravityForce.z * delta }, true);

    // 2. Tangent-Plane Movement Logic
    const { forward, backward, left, right } = get();
    
    // Auto-disable tour if user presses movement keys
    if (forward || backward || left || right) {
      if (isTourActive) setTourActive(false);
    }

    const direction = new Vector3();

    if (isTourActive) {
      // Auto-follow Abdulrahman
      const abdulPos = new Vector3(abdulrahmanPosition[0], abdulrahmanPosition[1], abdulrahmanPosition[2]);
      const distanceToAbdul = positionVector.distanceTo(abdulPos);
      
      // Follow closely but keep a small gap
      if (distanceToAbdul > 2.5) {
        const rawDir = abdulPos.clone().sub(positionVector).normalize();
        const projectedDir = rawDir.sub(normal.clone().multiplyScalar(rawDir.dot(normal))).normalize();
        direction.copy(projectedDir).multiplyScalar(SPEED * 0.8); // Follow slightly slower than max speed
      }
    } else {
      // Manual Player Control
      const camera = state.camera;
      const camDir = new Vector3();
      camera.getWorldDirection(camDir);
      
      // Tangent right vector (perpendicular to normal and camera view)
      const rightVec = new Vector3().crossVectors(camDir, normal).normalize();
      // Tangent forward vector (perpendicular to normal and right vector)
      const forwardVec = new Vector3().crossVectors(normal, rightVec).normalize();

      if (forward) direction.add(forwardVec);
      if (backward) direction.sub(forwardVec);
      if (right) direction.add(rightVec);
      if (left) direction.sub(rightVec);

      if (direction.lengthSq() > 0) {
        direction.normalize().multiplyScalar(SPEED);
      }
    }

    // Apply movement velocity
    if (direction.length() > 0) {
      const currentVel = bodyRef.current.linvel();
      const currentVelVec = new Vector3(currentVel.x, currentVel.y, currentVel.z);
      const verticalVel = normal.clone().multiplyScalar(currentVelVec.dot(normal));
      
      const newVel = direction.add(verticalVel);
      bodyRef.current.setLinvel({ x: newVel.x, y: newVel.y, z: newVel.z }, true);
    } else {
      // Damping: Kill horizontal velocity, keep vertical
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
    setPosition([pos.x, pos.y, pos.z]);
  });

  return (
    // position is [0, 35, 0] so it spawns slightly above the 30-radius planet
    <RigidBody name="visitor" ref={bodyRef} position={[0, 35, 0]} colliders={false} enabledRotations={[false, false, false]} linearDamping={1}>
      <BallCollider args={[0.5]} />
      <mesh ref={meshRef} castShadow>
        {/* Offset visual mesh up so feet align with the ball collider */}
        <group position={[0, 1, 0]}>
          <capsuleGeometry args={[0.5, 1, 4, 8]} />
          <meshStandardMaterial color="#FFFFFF" wireframe />
        </group>
      </mesh>
    </RigidBody>
  );
}
