'use client';

import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { useRouter, usePathname } from 'next/navigation';
import { WORLD_COORDINATES } from '@/lib/worldCoordinates';

export default function TriggerZones() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <>
      {Object.values(WORLD_COORDINATES).map((district) => (
        <RigidBody key={district.path} type="fixed" position={district.sensorPoint}>
          <CuboidCollider 
            args={[5, 5, 5]} 
            sensor 
            onIntersectionEnter={(payload) => {
              // Only trigger if the intersecting body is the visitor
              if (payload.other.rigidBodyObject?.name === 'visitor') {
                if (pathname !== district.path) {
                  router.push(district.path);
                }
              }
            }} 
          />
        </RigidBody>
      ))}
    </>
  );
}
