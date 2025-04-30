import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Player from './Player';
import usePlayerControls from '../hooks/usePlayerControls';
import useGameStore from '../store/gameStore';
import useForestStore from '../store/forestStore';
import usePeerConnection from '../hooks/usePeerConnection';
import ParticleEffects from './ParticleEffects';

// Physics constants (in units/second)
const GRAVITY = 9.81; // Earth's gravity (m/s²)
const JUMP_FORCE = 3.5; // Lower jump height (was 5)
const PLAYER_HEIGHT = 1; // Player's height from ground
const PLAYER_RADIUS = 0.5; // Radius for collision detection

const PlayerController = () => {
  const { movement, cameraView } = usePlayerControls();
  const { playerId, players, addPlayer } = useGameStore();
  const { checkTreeCollision } = useForestStore();
  const { updatePosition } = usePeerConnection();

  // Player physics refs
  const playerRef = useRef();
  const velocityRef = useRef(new THREE.Vector3());
  const positionRef = useRef(
    new THREE.Vector3(
      Math.random() * 20 - 10, // Random X position
      1, // Y position (height)
      Math.random() * 20 - 10, // Random Z position
    ),
  );
  const isJumpingRef = useRef(false);
  const rotationRef = useRef({ x: 0, y: 0, z: 0 });
  const lastRotationUpdateRef = useRef(0);

  // Camera wobble refs
  const wobbleTimeRef = useRef(0);
  const isMovingRef = useRef(false);

  // State for particles
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 1, z: 0 });
  const [isMoving, setIsMoving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  // Add local player to the game state
  useEffect(() => {
    addPlayer(playerId, {
      id: playerId,
      position: {
        x: positionRef.current.x,
        y: positionRef.current.y,
        z: positionRef.current.z,
      },
      rotation: {
        x: 0,
        y: cameraView.y,
        z: 0,
      },
      // Initialize with flashlight on
      flashlightOn: true,
    });

    // Initialize player position for particles
    setPlayerPosition({
      x: positionRef.current.x,
      y: positionRef.current.y,
      z: positionRef.current.z,
    });
  }, [addPlayer, playerId, cameraView.y]);

  // Handle player movement and physics
  useFrame((state, delta) => {
    if (!playerRef.current) return;

    // Get the player's current position
    const position = playerRef.current.position;

    // Apply gravity
    if (position.y > 1) {
      velocityRef.current.y -= 9.8 * delta; // Gravity
    } else {
      // On the ground
      position.y = 1;
      velocityRef.current.y = 0;
      isJumpingRef.current = false;
    }

    // Handle jumping
    if (movement.jump && !isJumpingRef.current) {
      velocityRef.current.y = 5; // Jump velocity
      isJumpingRef.current = true;
    }

    // Update player rotation to match camera view (full rotation)
    rotationRef.current = {
      x: state.camera.rotation.x,
      y: state.camera.rotation.y,
      z: state.camera.rotation.z,
    };

    // Calculate movement direction based on camera view
    const direction = new THREE.Vector3();
    const speed = movement.run ? 5 : 2; // Run or walk speed

    // Forward/backward - relative to camera view
    if (movement.forward) direction.z = -1;
    else if (movement.backward) direction.z = 1;

    // Left/right - strafe sideways relative to camera view
    if (movement.left) direction.x = -1;
    else if (movement.right) direction.x = 1;

    // Normalize movement direction if moving diagonally
    if (direction.length() > 0) direction.normalize();

    // Apply camera rotation to movement direction
    direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraView.y);

    // Set velocity based on movement direction
    velocityRef.current.x = direction.x * speed;
    velocityRef.current.z = direction.z * speed;

    // Calculate new position after applying velocity
    const newPosition = new THREE.Vector3(
      position.x + velocityRef.current.x * delta,
      position.y + velocityRef.current.y * delta,
      position.z + velocityRef.current.z * delta,
    );

    // Check for tree collisions at the new position
    const collision = checkTreeCollision(newPosition, PLAYER_RADIUS);

    if (collision.collision) {
      // Collision detected, handle response

      // Create a vector from the collision normal
      const normal = new THREE.Vector3(
        collision.normal[0],
        collision.normal[1],
        collision.normal[2],
      );

      // Calculate how much to push the player back
      const pushbackDistance = collision.penetration;

      // Adjust the new position to prevent collision
      newPosition.x += normal.x * pushbackDistance;
      newPosition.z += normal.z * pushbackDistance;

      // Reduce velocity in collision direction
      const dot =
        velocityRef.current.x * normal.x + velocityRef.current.z * normal.z;
      velocityRef.current.x -= normal.x * dot;
      velocityRef.current.z -= normal.z * dot;
    }

    // Apply the adjusted position
    position.copy(newPosition);

    // Update the position reference
    positionRef.current.copy(position);

    // Check if player is moving on the ground
    const isMovingOnGround =
      !isJumpingRef.current &&
      (Math.abs(velocityRef.current.x) > 0.1 ||
        Math.abs(velocityRef.current.z) > 0.1);

    isMovingRef.current = isMovingOnGround;

    // Update state for particles
    setPlayerPosition({
      x: position.x,
      y: position.y,
      z: position.z,
    });
    setIsMoving(isMovingOnGround);
    setIsRunning(movement.run && isMovingOnGround);

    // Update network position and rotation
    // Check if there's significant movement or rotation change
    const now = performance.now();
    const rotationChanged =
      Math.abs(state.camera.rotation.y - lastRotationUpdateRef.current) > 0.01;
    const shouldUpdateNetwork =
      velocityRef.current.length() > 0.01 ||
      rotationChanged ||
      now - lastRotationUpdateRef.current > 100;

    if (shouldUpdateNetwork) {
      updatePosition(
        { x: position.x, y: position.y, z: position.z },
        {
          x: state.camera.rotation.x,
          y: state.camera.rotation.y,
          z: state.camera.rotation.z,
        },
      );
      lastRotationUpdateRef.current = state.camera.rotation.y;
    }

    // Update camera position to follow player
    state.camera.position.copy(position);
    state.camera.position.y += 1.5; // Eye height

    // Note: Camera rotation is handled in the usePlayerControls hook
    // We only need to apply wobble effects here

    // Add wobble effect when walking
    if (isMovingRef.current && !isJumpingRef.current) {
      // Increment wobble time
      wobbleTimeRef.current += delta * (movement.run ? 10 : 5); // Faster wobble when running

      // Vertical bob (up and down)
      const verticalBob = Math.sin(wobbleTimeRef.current * 2) * 0.05;
      state.camera.position.y += verticalBob;

      // Horizontal bob (left and right) - relative to camera view
      const horizontalBob = Math.cos(wobbleTimeRef.current * 1.5) * 0.025;
      state.camera.position.x += horizontalBob * Math.cos(cameraView.y);
      state.camera.position.z += horizontalBob * Math.sin(cameraView.y);

      // Slight tilt
      state.camera.rotation.z = Math.sin(wobbleTimeRef.current) * 0.01;
    } else {
      // Reset camera tilt when not moving
      state.camera.rotation.z = 0;
    }
  });

  return (
    <>
      {/* Local player - invisible to local player but has physics */}
      <group
        ref={playerRef}
        position={[
          positionRef.current.x,
          positionRef.current.y,
          positionRef.current.z,
        ]}
        rotation={[0, rotationRef.current.y, 0]} // Player rotates only on y-axis for physics
      >
        {/* Physics collider - invisible */}
        <mesh visible={false}>
          <capsuleGeometry args={[PLAYER_RADIUS, 1, 4, 8]} />
        </mesh>
      </group>

      {/* Display all players */}
      {Object.entries(players).map(([id, playerData]) => (
        <Player
          key={id}
          playerId={id}
          position={playerData.position}
          rotation={playerData.rotation}
          isLocalPlayer={id === playerId}
        />
      ))}

      {/* Particle Effects */}
      <ParticleEffects
        playerPosition={playerPosition}
        isMoving={isMoving}
        isRunning={isRunning}
      />
    </>
  );
};

export default PlayerController;
