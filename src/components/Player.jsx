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

  // Update player position and rotation with smooth interpolation
  useFrame(() => {
    // Only apply interpolation to remote players
    if (!isLocalPlayer && playerRef.current && position) {
      // Set target position for smooth interpolation
      targetPositionRef.current.set(position.x, position.y, position.z);

      // Smooth interpolation for remote players
      const lerpFactor = 0.1;
      playerRef.current.position.lerp(targetPositionRef.current, lerpFactor);

      // Smoothly rotate towards target rotation for body
      if (rotation) {
        const targetRotationY = rotation.y;
        playerRef.current.rotation.y = THREE.MathUtils.lerp(
          playerRef.current.rotation.y,
          targetRotationY,
          lerpFactor,
        );
      }
    }

    // Update face rotation for all players
    if (faceRef.current && rotation) {
      // Face pitch (looking up/down)
      faceRef.current.rotation.x = rotation.x;
    }

    // Update arm rotations based on camera pitch
    if (leftArmRef.current && rightArmRef.current && rotation) {
      const armPitch = Math.max(-0.3, Math.min(0.3, rotation.x));
      leftArmRef.current.rotation.x = armPitch;
      rightArmRef.current.rotation.x = armPitch;
    }
  });

  // If no position data, render a placeholder
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

  // Player model with body, face, and arms
  return (
    <group ref={playerRef} position={[position.x, position.y, position.z]}>
      {/* Player body */}
      <mesh castShadow position={[0, 0.5, 0]}>
        <capsuleGeometry args={[0.25, 0.5, 8, 8]} />
        <meshStandardMaterial
          color={isLocalPlayer ? '#4285F4' : '#DB4437'}
          roughness={0.6}
        />
      </mesh>

      {/* Player face */}
      <group ref={faceRef} position={[0, 0.8, -0.2]}>
        {/* Face base */}
        <mesh castShadow>
          <boxGeometry args={[0.3, 0.3, 0.1]} />
          <meshStandardMaterial color="#FFDBAC" roughness={0.5} />
        </mesh>

        {/* Left eye */}
        <mesh position={[-0.08, 0.05, -0.06]} castShadow>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#000000" />
        </mesh>

        {/* Right eye */}
        <mesh position={[0.08, 0.05, -0.06]} castShadow>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#000000" />
        </mesh>

        {/* Mouth */}
        <mesh position={[0, -0.07, -0.06]} castShadow>
          <boxGeometry args={[0.15, 0.03, 0.01]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
      </group>

      {/* Left arm */}
      <group
        ref={leftArmRef}
        position={[-0.4, 0.5, 0]}
        rotation={[0, 0, -Math.PI / 6]}
      >
        <mesh castShadow>
          <capsuleGeometry args={[0.07, 0.4, 8, 8]} />
          <meshStandardMaterial
            color={isLocalPlayer ? '#4285F4' : '#DB4437'}
            roughness={0.6}
          />
        </mesh>
        {/* Left hand */}
        <mesh position={[0, -0.25, 0]} castShadow>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="#FFDBAC" roughness={0.7} />
        </mesh>
      </group>

      {/* Right arm */}
      <group
        ref={rightArmRef}
        position={[0.4, 0.5, 0]}
        rotation={[0, 0, Math.PI / 6]}
      >
        <mesh castShadow>
          <capsuleGeometry args={[0.07, 0.4, 8, 8]} />
          <meshStandardMaterial
            color={isLocalPlayer ? '#4285F4' : '#DB4437'}
            roughness={0.6}
          />
        </mesh>
        {/* Right hand */}
        <mesh position={[0, -0.25, 0]} castShadow>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="#FFDBAC" roughness={0.7} />
        </mesh>
      </group>

      {/* Player ID above head */}
      <group position={[0, 1.3, 0]}>
        <mesh>
          <boxGeometry args={[0.4, 0.2, 0.05]} />
          <meshStandardMaterial
            color={isLocalPlayer ? '#0000FF' : '#FF0000'}
            opacity={0.7}
            transparent
          />
        </mesh>
      </group>
    </group>
  );
};

export default Player;
