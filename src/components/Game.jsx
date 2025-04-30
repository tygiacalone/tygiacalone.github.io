import React, { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  Sky,
  Stars,
  AccumulativeShadows,
  RandomizedLight,
  SoftShadows,
} from '@react-three/drei';
import Ground from './Ground';
import Forest from './Forest';
import PlayerController from './PlayerController';
import ConnectionManager from './ConnectionManager';
import Flashlight from './Flashlight';
import LightningManager from './LightningManager';
import MobileControls from './MobileControls';
import useGameStore from '../store/gameStore';
import usePlayerControls from '../hooks/usePlayerControls';

// Function to calculate sun position based on time
const calculateSunPosition = (date) => {
  // Get hours in Seattle time (UTC-7 or UTC-8 depending on DST)
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const timeDecimal = hours + minutes / 60;

  // Map 24 hours to a full 360° rotation (π*2)
  // With sunset at roughly 6PM (π) and sunrise at 6AM (0)
  const azimuth = ((timeDecimal - 6) / 24) * Math.PI * 2;

  // Calculate sun height (inclination) based on time
  // Highest at noon (12PM), lowest at midnight
  const inclination = Math.sin(((timeDecimal - 6) / 12) * Math.PI);

  // Convert to XYZ position
  const x = Math.cos(azimuth);
  const y = Math.max(0.05, inclination); // Keep sun slightly above horizon even at night
  const z = Math.sin(azimuth);

  return [x, y, z];
};

// Calculate light intensity based on time
const calculateLightIntensity = (date) => {
  const hours = date.getHours();
  const isDaytime = hours >= 6 && hours <= 18;

  // Full intensity at noon, low at midnight
  if (isDaytime) {
    const noonDist = Math.abs(hours - 12);
    return 1 - (noonDist / 12) * 0.5; // Range from 0.5 to 1 during day
  } else {
    return 0.2; // Low intensity at night
  }
};

const Game = () => {
  const [sunPosition, setSunPosition] = useState([0, 1, 0]);
  const [lightIntensity, setLightIntensity] = useState(1);
  const [isNighttime, setIsNighttime] = useState(false);
  const [flashlightOn, setFlashlightOn] = useState(true);
  const { playerId, players, updatePlayerFlashlightState, addPlayer } =
    useGameStore();

  // Get mobile controls handlers from the hook
  const { handleMobileMove, handleMobileLook, handleMobileJump, isMobile } =
    usePlayerControls();

  // Initialize player with flashlight on when component mounts
  useEffect(() => {
    // Initialize the local player with flashlight on
    if (
      playerId &&
      (!players[playerId] || players[playerId].flashlightOn === undefined)
    ) {
      console.log('Initializing player with flashlight ON');
      addPlayer(playerId, {
        id: playerId,
        position: { x: 0, y: 1, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        flashlightOn: true, // Start with flashlight ON
      });
    }
  }, [playerId, players, addPlayer]);

  useEffect(() => {
    // Function to update lighting
    const updateLighting = () => {
      // Create date object in Seattle timezone
      const seattleTime = new Date(
        new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }),
      );

      // Update state based on time
      setSunPosition(calculateSunPosition(seattleTime));
      setLightIntensity(calculateLightIntensity(seattleTime));
      const nighttime =
        seattleTime.getHours() >= 18 || seattleTime.getHours() < 6;
      setIsNighttime(nighttime);

      // Turn flashlight on automatically at night if it's the first time entering night
      if (nighttime && !isNighttime) {
        setFlashlightOn(true);
      }
    };

    // Update immediately and then set interval
    updateLighting();
    const interval = setInterval(updateLighting, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [isNighttime]);

  // Handle flashlight toggle with F key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() === 'f') {
        setFlashlightOn((prev) => {
          const newState = !prev;
          // Update the player's flashlight state in the game store
          if (playerId) {
            // Always force update the flashlight state regardless of player existence
            updatePlayerFlashlightState(playerId, newState);

            // Log the flashlight state for debugging
            console.log(`Flashlight toggled to: ${newState}`);
          }
          return newState;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerId, updatePlayerFlashlightState]);

  // Handle mobile flashlight toggle
  const handleFlashlightToggle = () => {
    setFlashlightOn((prev) => {
      const newState = !prev;
      if (playerId) {
        updatePlayerFlashlightState(playerId, newState);
        console.log(`Mobile flashlight toggled to: ${newState}`);
      }
      return newState;
    });
  };

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden">
      {/* 3D Canvas */}
      <Canvas
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
        }}
        shadows="soft"
        camera={{ position: [0, 1.5, 5], fov: 75 }}
      >
        <SoftShadows size={25} samples={16} focus={0.5} />

        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={isNighttime ? 0.1 : 0.3} />
          <directionalLight
            position={[...sunPosition.map((v) => v * 10)]}
            intensity={lightIntensity}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={50}
            shadow-camera-left={-20}
            shadow-camera-right={20}
            shadow-camera-top={20}
            shadow-camera-bottom={-20}
          />

          {/* Sky */}
          <Sky
            distance={450000}
            sunPosition={sunPosition}
            inclination={sunPosition[1]}
            azimuth={(Math.atan2(sunPosition[2], sunPosition[0]) / Math.PI) * 2}
          />

          {/* Stars - more visible at night */}
          <Stars
            radius={100}
            depth={50}
            count={5000}
            factor={4}
            saturation={0}
            fade
            visible={isNighttime}
          />

          {/* Environment */}
          <Ground size={200} />
          <Forest treeCount={100} forestSize={150} />

          {/* Player */}
          <PlayerController />

          {/* Flashlight - pass necessary props */}
          <Flashlight
            players={players}
            isNighttime={isNighttime}
            localPlayerId={playerId}
          />

          {/* Lightning effects for new player spawns */}
          <LightningManager />
        </Suspense>
      </Canvas>

      {/* UI Overlays */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {/* Connection UI */}
        <div className="pointer-events-auto">
          <ConnectionManager />
        </div>

        {/* Controls Info - Only show on desktop */}
        {!isMobile && (
          <div className="absolute bottom-4 left-4 p-3 bg-white bg-opacity-80 rounded-lg shadow-lg max-w-xs z-20 pointer-events-auto">
            <h3 className="text-md font-semibold mb-1">Controls:</h3>
            <ul className="text-xs space-y-1">
              <li>
                <strong>W/S</strong> - Move forward/backward
              </li>
              <li>
                <strong>A/D</strong> - Rotate player left/right
              </li>
              <li>
                <strong>MOUSE</strong> - Look around (free camera)
              </li>
              <li>
                <strong>SPACE</strong> - Jump
              </li>
              <li>
                <strong>SHIFT</strong> - Run
              </li>
              <li>
                <strong>F</strong> - Toggle flashlight
              </li>
            </ul>
          </div>
        )}

        {/* Mobile Controls */}
        <MobileControls
          onMove={handleMobileMove}
          onLook={handleMobileLook}
          onJump={handleMobileJump}
          onFlashlight={handleFlashlightToggle}
          className="z-20"
        />
      </div>
    </div>
  );
};

export default Game;
