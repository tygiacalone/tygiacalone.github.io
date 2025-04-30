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
import useGameStore from '../store/gameStore';
import { isMobile } from 'react-device-detect';

// Function to calculate sun position based on local time
const calculateSunPosition = () => {
  // Get current local time
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
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

// Calculate light intensity based on local time
const calculateLightIntensity = () => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const timeDecimal = hours + minutes / 60;

  // Full intensity at noon, low at midnight
  if (hours >= 6 && hours < 18) {
    // Daytime: peak at noon (12:00)
    const noonDistance = Math.abs(timeDecimal - 12);
    // Scale from 0.5 to 1 during day, with maximum at noon
    return 1 - (noonDistance / 6) * 0.5;
  } else if (hours >= 18 && hours < 20) {
    // Sunset transition: 6pm-8pm
    return 0.5 - ((timeDecimal - 18) / 2) * 0.3;
  } else if (hours >= 4 && hours < 6) {
    // Sunrise transition: 4am-6am
    return 0.2 + ((timeDecimal - 4) / 2) * 0.3;
  } else {
    // Nighttime: 8pm-4am
    return 0.2;
  }
};

// Check if it's nighttime based on local time
const isNighttimeNow = () => {
  const hours = new Date().getHours();
  return hours >= 18 || hours < 6;
};

const Game = () => {
  const [sunPosition, setSunPosition] = useState([0, 1, 0]);
  const [lightIntensity, setLightIntensity] = useState(1);
  const [isNighttime, setIsNighttime] = useState(isNighttimeNow());
  const [flashlightOn, setFlashlightOn] = useState(isNighttimeNow());
  const { playerId, players, updatePlayerFlashlightState, addPlayer } =
    useGameStore();

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
        flashlightOn: isNighttime, // Turn flashlight on if it's nighttime
      });
    }
  }, [playerId, players, addPlayer, isNighttime]);

  useEffect(() => {
    // Function to update lighting
    const updateLighting = () => {
      // Update state based on current local time
      setSunPosition(calculateSunPosition());
      setLightIntensity(calculateLightIntensity());
      const nighttime = isNighttimeNow();

      // Turn flashlight on automatically at night if it's the first time entering night
      if (nighttime && !isNighttime) {
        setFlashlightOn(true);
        // Update the player's flashlight state in the game store
        if (playerId) {
          updatePlayerFlashlightState(playerId, true);
        }
      }

      setIsNighttime(nighttime);
    };

    // Update immediately and then set interval
    updateLighting();
    // Update more frequently for smoother transitions - every 10 seconds
    const interval = setInterval(updateLighting, 10000);

    return () => clearInterval(interval);
  }, [isNighttime, playerId, updatePlayerFlashlightState]);

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

  return (
    <div className="w-screen h-screen">
      <Canvas
        camera={{
          position: [0, 8, 20], // Raised and pulled back for a better view of the ravine
          fov: 75,
          near: 0.1,
          far: 1000,
        }}
        shadows
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
    </div>
  );
};

export default Game;
