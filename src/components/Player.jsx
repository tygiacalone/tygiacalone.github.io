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
  const faceRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();
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
        // Player body rotates only on Y axis (facing direction)
        const targetRotationY = rotation.y;
        playerRef.current.rotation.y = THREE.MathUtils.lerp(
          playerRef.current.rotation.y,
          targetRotationY,
          lerpFactor,
        );
      }
    }

    // Update face direction to match the full player rotation
    if (faceRef.current && rotation) {
      // Apply x rotation (looking up/down) and y rotation (looking left/right)
      faceRef.current.rotation.x = rotation.x;
      // Face already points forward, just need to adjust for head tilt

      // Animate arms slightly based on rotation
      if (leftArmRef.current && rightArmRef.current) {
        // Adjust arm positioning based on looking up/down
        const armTilt = Math.max(-0.3, Math.min(0.3, rotation.x));
        leftArmRef.current.rotation.x = armTilt;
        rightArmRef.current.rotation.x = armTilt;
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
      <group ref={faceRef} position={[0, 0.25, 0.2]}>
        <mesh castShadow>
          <boxGeometry args={[0.15, 0.08, 0.08]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
      </group>

      {/* Left arm */}
      <group
        ref={leftArmRef}
        position={[-0.3, 0.1, 0]}
        rotation={[0, 0, -Math.PI / 6]}
      >
        <mesh castShadow>
          <capsuleGeometry args={[0.05, 0.3, 4, 8]} />
          <meshStandardMaterial
            color={isLocalPlayer ? '#4285F4' : '#DB4437'}
            roughness={0.6}
          />
        </mesh>
        {/* Left hand */}
        <mesh position={[0, -0.2, 0]} castShadow>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color="#E8BEAC" roughness={0.7} />
        </mesh>
      </group>

      {/* Right arm */}
      <group
        ref={rightArmRef}
        position={[0.3, 0.1, 0]}
        rotation={[0, 0, Math.PI / 6]}
      >
        <mesh castShadow>
          <capsuleGeometry args={[0.05, 0.3, 4, 8]} />
          <meshStandardMaterial
            color={isLocalPlayer ? '#4285F4' : '#DB4437'}
            roughness={0.6}
          />
        </mesh>
        {/* Right hand */}
        <mesh position={[0, -0.2, 0]} castShadow>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color="#E8BEAC" roughness={0.7} />
        </mesh>
      </group>

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
