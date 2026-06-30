'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import World from './World';
import CameraController from './CameraController';

export default function Scene() {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 40, 40], fov: 15, near: 0.1, far: 1000 }}
      gl={{ antialias: true, alpha: true }}
      dpr={typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 1.5) : 1}
    >
      <color attach="background" args={['#0B0B0B']} />
      
      {/* Baseline Lighting */}
      <ambientLight intensity={0.5} color="#FFFFFF" />
      <directionalLight 
        position={[20, 50, -20]} 
        intensity={2.5} 
        color="#F5F5F5"
        castShadow 
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <directionalLight 
        position={[-20, 30, 20]} 
        intensity={0.5} 
        color="#C8C8C8"
      />

      <CameraController />
      <Suspense fallback={null}>
        <World />
      </Suspense>
    </Canvas>
  );
}
