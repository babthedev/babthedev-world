'use client';

import { Physics, RigidBody } from '@react-three/rapier';
import VisitorController from './VisitorController';
import AbdulrahmanController from './AbdulrahmanController';
import TriggerZones from './TriggerZones';

export default function World() {
  return (
    <Physics timeStep="vary" gravity={[0, 0, 0]} debug>
      {/* The Planet */}
      <RigidBody type="fixed" colliders="ball">
        <mesh receiveShadow>
          <sphereGeometry args={[30, 64, 64]} />
          <meshStandardMaterial color="#1A1A1A" wireframe />
        </mesh>
      </RigidBody>

      {/* Character Controllers */}
      <VisitorController />
      <AbdulrahmanController />
      
      {/* Spatial Routing Zones */}
      <TriggerZones />
    </Physics>
  );
}
