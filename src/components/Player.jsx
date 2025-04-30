import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Player = ({
  playerId,
  position,
  rotation,
  isLocalPlayer,
  onPositionChange,
}) => {
  const playerRef = useRef();
  const velocityRef = useRef(new THREE.Vector3());
  const targetPositionRef = useRef(new THREE.Vector3());
  const [isVisible, setIsVisible] = useState(true);

  // Log player creation for debugging
  useEffect(() => {
    // Initial console log to debug player visibility
    console.log(`Player ${playerId} rendered:`, {
      position,
      rotation,
      isLocalPlayer,
    });

    // Make sure position exists
    if (!position) {
      console.warn(`Player ${playerId} has no position data`);
      return;
    }

    // Initialize position
    if (playerRef.current) {
      playerRef.current.position.set(position.x, position.y, position.z);
      console.log(`Player ${playerId} positioned at:`, position);

      if (rotation) {
        playerRef.current.rotation.y = rotation.y;
      }
    }
  }, [playerId, position, rotation, isLocalPlayer]);

  // Update remote player position with smooth interpolation
  useFrame(({ clock }) => {
    if (!isLocalPlayer && playerRef.current && position) {
      // Set target position for smooth interpolation
      targetPositionRef.current.set(position.x, position.y, position.z);

      // Smooth interpolation for remote players
      const lerpFactor = 0.1;
      playerRef.current.position.lerp(targetPositionRef.current, lerpFactor);

      // Smoothly rotate towards target rotation
      if (rotation) {
        const targetRotationY = rotation.y;
        playerRef.current.rotation.y = THREE.MathUtils.lerp(
          playerRef.current.rotation.y,
          targetRotationY,
          lerpFactor,
        );
      }
    }
  });

  // If no position data, still render but display missing data warning
  if (!position) {
    return (
      <group ref={playerRef} position={[0, 0, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color="red" wireframe />
        </mesh>
      </group>
    );
  }

  // Simple player avatar - a capsule with a different color for the local player
  return (
    <group ref={playerRef}>
      {/* Player body */}
      <mesh castShadow>
        <capsuleGeometry args={[0.2, 0.6, 4, 8]} />
        <meshStandardMaterial
          color={isLocalPlayer ? '#4285F4' : '#DB4437'}
          roughness={0.5}
          emissive={isLocalPlayer ? '#000000' : '#550000'}
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Player "face" indication - to show which way they're looking */}
      <mesh position={[0, 0.25, 0.2]} castShadow>
        <boxGeometry args={[0.15, 0.08, 0.08]} />
        <meshStandardMaterial color="#000000" />
      </mesh>

      {/* Player ID above head */}
      <group position={[0, 1, 0]}>
        <mesh>
          <boxGeometry args={[0.4, 0.2, 0.05]} />
          <meshStandardMaterial
            color={isLocalPlayer ? '#0000FF' : '#FF0000'}
            opacity={0.7}
            transparent
          />
        </mesh>
        {/* ID display would go here if we had text capabilities */}
      </group>
    </group>
  );
};

export default Player;
