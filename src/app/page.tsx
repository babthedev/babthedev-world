'use client';

import { useTourLogic } from '@/hooks/useTourLogic';

export default function Home() {
  useTourLogic();

  return (
    <main className="w-full h-full relative pointer-events-none">
      <div className="absolute top-10 left-10 pointer-events-auto">
        <h1 className="text-4xl font-merriweather text-white font-bold drop-shadow-md">
          Abdulrahman&apos;s Hub
        </h1>
        <p className="text-gray-300 mt-2 font-inter max-w-sm drop-shadow">
          Welcome to the world. Use WASD to explore.
        </p>
      </div>
    </main>
  );
}
