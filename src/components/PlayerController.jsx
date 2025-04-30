import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Player from './Player';
import useGameStore from '../store/gameStore';
import useForestStore from '../store/forestStore';
import usePeerConnection from '../hooks/usePeerConnection';
import ParticleEffects from './ParticleEffects';
import Obelisk from './Obelisk';
import { usePlayerControlsContext } from '../contexts/PlayerControlsContext';
import { isMobile } from 'react-device-detect';

// Physics constants (in units/second)
const GRAVITY = 9.81; // Earth's gravity (m/s²)
const JUMP_FORCE = 3.5; // Lower jump height (was 5)
const PLAYER_HEIGHT = 1; // Player's height from ground
const PLAYER_RADIUS = 0.5; // Radius for collision detection

// Spawn area configuration
const SPAWN_RADIUS = 5; // Radius of spawn circle
const SPAWN_CENTER_X = 0; // Center X coordinate of spawn area
const SPAWN_CENTER_Z = 0; // Center Z coordinate of spawn area

// Generate a spawn position within the ravine
const generateSpawnPosition = () => {
  // Random angle but restricted to forward/backward in ravine direction
  const angle = Math.random() * Math.PI * 0.5 - Math.PI * 0.25; // -45 to 45 degrees

  // Position along the center of the ravine with slight variation
  const x = Math.random() * 4 - 2; // Smaller variation across the narrower ravine (-2 to 2)
  const z = SPAWN_CENTER_Z - 5 + Math.random() * 10; // Along the ravine

  return new THREE.Vector3(
    x,
    -3, // Spawn at ravine floor level, adjusted for the deeper ravine
    z,
  );
};

// Generate a position for the obelisk in front of spawn point
const generateObeliskPosition = (spawnPosition, cameraAngle) => {
  // Calculate direction vector based on camera angle
  const directionVector = new THREE.Vector3(
    Math.sin(cameraAngle),
    0,
    -Math.cos(cameraAngle),
  );

  // Place obelisk 5 units in front of player's view direction
  return new THREE.Vector3(
    spawnPosition.x + directionVector.x * 5,
    0, // On the ground
    spawnPosition.z + directionVector.z * 5,
  );
};

const PlayerController = () => {
  const { movement, cameraRotation, cameraChanged } =
    usePlayerControlsContext();
  const { playerId, players, addPlayer } = useGameStore();
  const { checkTreeCollision } = useForestStore();
  const { updatePosition } = usePeerConnection();

  // Player physics refs
  const playerRef = useRef();
  const velocityRef = useRef(new THREE.Vector3());
  const positionRef = useRef(generateSpawnPosition());
  const isJumpingRef = useRef(false);
  const rotationRef = useRef({ x: 0, y: 0, z: 0 });
  const lastRotationUpdateRef = useRef({ x: 0, y: 0, z: 0, lastUpdateTime: 0 });
  const cameraRotationRef = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const cameraAnglesRef = useRef({ x: 0, y: 0 });

  // Camera wobble refs
  const wobbleTimeRef = useRef(0);
  const isMovingRef = useRef(false);

  // State for particles
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 1, z: 0 });
  const [isMoving, setIsMoving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  // State for Obelisk
  const [showObelisk, setShowObelisk] = useState(true);
  const [obeliskPosition, setObeliskPosition] = useState(null);

  // Ref to track if initialization was already performed
  const hasInitializedRef = useRef(false);

  // Sync context camera rotation with internal refs
  useEffect(() => {
    if (isMobile) {
      // On mobile, use camera rotation from context that's updated by Controls component
      cameraRotationRef.current.x = cameraRotation.x;
      cameraRotationRef.current.y = cameraRotation.y;

      // Update angles for other components
      cameraAnglesRef.current = {
        x: cameraRotation.x,
        y: cameraRotation.y,
      };
    }
  }, [cameraRotation, cameraChanged, isMobile]);

  // Add local player to the game state
  useEffect(() => {
    // Skip if already initialized (prevents recreation on component remounts)
    if (hasInitializedRef.current) {
      return;
    }

    // Mark as initialized immediately to prevent double execution
    hasInitializedRef.current = true;

    const currentAddPlayer = addPlayer;
    const currentPlayerId = playerId;
    const initialPosition = positionRef.current.clone();
    const initialCameraAngle = cameraAnglesRef.current.y;

    currentAddPlayer(currentPlayerId, {
      id: currentPlayerId,
      position: {
        x: initialPosition.x,
        y: initialPosition.y,
        z: initialPosition.z,
      },
      rotation: {
        x: 0,
        y: initialCameraAngle,
        z: 0,
      },
      // Initialize with flashlight on
      flashlightOn: true,
    });

    // Initialize player position for particles
    setPlayerPosition({
      x: initialPosition.x,
      y: initialPosition.y,
      z: initialPosition.z,
    });

    // Set obelisk position in front of spawn based on camera direction
    const obeliskPos = generateObeliskPosition(
      initialPosition,
      initialCameraAngle,
    );
    setObeliskPosition(obeliskPos);

    // Debug message
    console.log('Player spawned at:', initialPosition);
    console.log('Obelisk placed at:', obeliskPos);
    console.log('Look for the glowing white obelisk in front of you!');

    // Add a timeout to remind the player where to look
    const timerId = setTimeout(() => {
      // Add a message to help user locate the obelisk
      if (showObelisk) {
        const obeliskDirection = new THREE.Vector3(
          obeliskPos.x - initialPosition.x,
          0,
          obeliskPos.z - initialPosition.z,
        ).normalize();

        const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(
          new THREE.Vector3(0, 1, 0),
          initialCameraAngle,
        );

        const dot = forward.dot(obeliskDirection);
        let message = '';

        if (dot > 0.7) {
          message = 'Look straight ahead for the glowing obelisk!';
        } else if (dot > 0) {
          message =
            'Look slightly to your ' +
            (obeliskDirection.x * forward.z - obeliskDirection.z * forward.x > 0
              ? 'right'
              : 'left') +
            ' for the glowing obelisk!';
        } else {
          message = 'Turn around to see the glowing obelisk!';
        }

        console.log(message);
      }
    }, 2000);

    return () => {
      clearTimeout(timerId); // Clean up the timeout
    };
  }, [addPlayer, playerId]); // Include dependencies but use ref to prevent re-execution

  // Setup mouse controls for click and drag (desktop only)
  useEffect(() => {
    // Skip on mobile devices - they use context camera rotation
    if (isMobile) return;

    let isMouseDown = false;
    let isPointerLocked = false;

    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const lockPointer = () => {
      canvas.requestPointerLock =
        canvas.requestPointerLock ||
        canvas.mozRequestPointerLock ||
        canvas.webkitRequestPointerLock;

      canvas.requestPointerLock();
    };

    const unlockPointer = () => {
      document.exitPointerLock =
        document.exitPointerLock ||
        document.mozExitPointerLock ||
        document.webkitExitPointerLock;

      document.exitPointerLock();
    };

    const handleMouseDown = (e) => {
      isMouseDown = true;
      lockPointer();
    };

    const handleMouseUp = () => {
      isMouseDown = false;
      unlockPointer();
    };

    const handlePointerLockChange = () => {
      isPointerLocked =
        document.pointerLockElement === canvas ||
        document.mozPointerLockElement === canvas ||
        document.webkitPointerLockElement === canvas;

      // If pointer lock is exited, make sure we update our mouse down state
      if (!isPointerLocked) {
        isMouseDown = false;
      }
    };

    const handleMouseMove = (event) => {
      if (!isPointerLocked && !isMouseDown) return;

      // Get mouse movement (with sensitivity adjustment)
      const sensitivity = 0.002;
      const movementX =
        event.movementX || event.mozMovementX || event.webkitMovementX || 0;
      const movementY =
        event.movementY || event.mozMovementY || event.webkitMovementY || 0;

      // Update the camera rotation state
      cameraRotationRef.current.y -= movementX * sensitivity;
      cameraRotationRef.current.x -= movementY * sensitivity;

      // Clamp the vertical rotation to avoid flipping
      cameraRotationRef.current.x = Math.max(
        -Math.PI / 2 + 0.01,
        Math.min(Math.PI / 2 - 0.01, cameraRotationRef.current.x),
      );

      // Update the state for other components to use
      cameraAnglesRef.current = {
        x: cameraRotationRef.current.x,
        y: cameraRotationRef.current.y,
      };
    };

    // Add mouse event listeners
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('mozpointerlockchange', handlePointerLockChange);
    document.addEventListener(
      'webkitpointerlockchange',
      handlePointerLockChange,
    );
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener(
        'pointerlockchange',
        handlePointerLockChange,
      );
      document.removeEventListener(
        'mozpointerlockchange',
        handlePointerLockChange,
      );
      document.removeEventListener(
        'webkitpointerlockchange',
        handlePointerLockChange,
      );
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      // Make sure to unlock pointer when unmounting
      if (isPointerLocked) {
        unlockPointer();
      }
    };
  }, [isMobile]);

  // Handle player movement and physics
  useFrame((state, delta) => {
    if (!playerRef.current) return;

    // Apply camera rotation
    state.camera.rotation.copy(cameraRotationRef.current);

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
    direction.applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      cameraAnglesRef.current.y,
    );

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
      Math.abs(state.camera.rotation.x - lastRotationUpdateRef.current.x) >
        0.01 ||
      Math.abs(state.camera.rotation.y - lastRotationUpdateRef.current.y) >
        0.01 ||
      Math.abs(state.camera.rotation.z - lastRotationUpdateRef.current.z) >
        0.01;

    const shouldUpdateNetwork =
      velocityRef.current.length() > 0.01 ||
      rotationChanged ||
      now - lastRotationUpdateRef.current.lastUpdateTime > 100;

    if (shouldUpdateNetwork) {
      updatePosition(
        { x: position.x, y: position.y, z: position.z },
        {
          x: state.camera.rotation.x,
          y: state.camera.rotation.y,
          z: state.camera.rotation.z,
        },
      );
      // Store the full rotation and update time
      lastRotationUpdateRef.current = {
        x: state.camera.rotation.x,
        y: state.camera.rotation.y,
        z: state.camera.rotation.z,
        lastUpdateTime: now,
      };
    }

    // Update camera position to follow player
    state.camera.position.copy(position);
    state.camera.position.y += 1.5; // Eye height

    // Add wobble effect when walking
    if (isMovingRef.current && !isJumpingRef.current) {
      // Increment wobble time
      wobbleTimeRef.current += delta * (movement.run ? 10 : 5); // Faster wobble when running

      // Vertical bob (up and down)
      const verticalBob = Math.sin(wobbleTimeRef.current * 2) * 0.05;
      state.camera.position.y += verticalBob;

      // Horizontal bob (left and right) - relative to camera view
      const horizontalBob = Math.cos(wobbleTimeRef.current * 1.5) * 0.025;
      state.camera.position.x +=
        horizontalBob * Math.cos(cameraAnglesRef.current.y);
      state.camera.position.z +=
        horizontalBob * Math.sin(cameraAnglesRef.current.y);

      // Slight tilt
      state.camera.rotation.z = Math.sin(wobbleTimeRef.current) * 0.01;
    } else {
      // Reset camera tilt when not moving
      state.camera.rotation.z = 0;
    }
  });

  // Handle obelisk expiration
  const handleObeliskExpire = () => {
    setShowObelisk(false);
  };

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

      {/* Floating obelisk */}
      {showObelisk && obeliskPosition && (
        <Obelisk
          position={[obeliskPosition.x, obeliskPosition.y, obeliskPosition.z]}
          onExpire={handleObeliskExpire}
        />
      )}

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
