import React, { useRef, useMemo, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const FlashlightParticles = ({ isOn, position, direction }) => {
  const particlesRef = useRef();
  const particles = useRef([]);
  const lastEmitTime = useRef(0);

  // Create particle system
  const [geometry, material] = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(200 * 3); // 200 particles max
    const opacities = new Float32Array(200);
    const sizes = new Float32Array(200);

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: {
        color: { value: new THREE.Color('#ffffcc') }, // dust color with slight yellow tint
      },
      vertexShader: `
        attribute float opacity;
        attribute float size;
        varying float vOpacity;
        
        void main() {
          vOpacity = opacity;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        varying float vOpacity;
        
        void main() {
          float d = length(gl_PointCoord - vec2(0.5, 0.5));
          if (d > 0.5) discard;
          float alpha = smoothstep(0.5, 0.2, d) * vOpacity;
          gl_FragColor = vec4(color, alpha);
        }
      `,
    });

    return [geometry, material];
  }, []);

  // Update particles
  useFrame(({ clock }) => {
    if (!isOn || !position || !direction) return;

    // Emit new particles at regular intervals
    if (clock.elapsedTime - lastEmitTime.current > 0.05) {
      lastEmitTime.current = clock.elapsedTime;

      // Add new particles inside the flashlight beam cone
      const numParticles = 3;
      for (let i = 0; i < numParticles; i++) {
        // Calculate random position within the cone
        const distance = Math.random() * 5 + 2; // 2-7 units from camera
        const spread = Math.min(0.2 * distance, 1.0); // Wider spread further away

        const offsetX = (Math.random() - 0.5) * spread;
        const offsetY = (Math.random() - 0.5) * spread;

        const pos = new THREE.Vector3()
          .copy(position)
          .add(
            new THREE.Vector3(
              direction.x * distance + offsetX,
              direction.y * distance + offsetY,
              direction.z * distance,
            ),
          );

        particles.current.push({
          position: pos,
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 0.01,
            (Math.random() - 0.5) * 0.01,
            (Math.random() - 0.5) * 0.01,
          ),
          opacity: Math.random() * 0.3 + 0.1,
          size: Math.random() * 0.15 + 0.05,
          age: 0,
          maxAge: 0.5 + Math.random() * 0.5,
        });
      }
    }

    // Update existing particles
    const positions = geometry.attributes.position.array;
    const opacities = geometry.attributes.opacity.array;
    const sizes = geometry.attributes.size.array;

    let i = 0;
    particles.current = particles.current.filter((particle) => {
      particle.age += 0.016; // ~60fps
      if (particle.age >= particle.maxAge) return false;

      // Update particle physics
      particle.position.add(particle.velocity);
      particle.opacity *= 0.97; // Gradually fade out

      // Update buffers
      positions[i * 3] = particle.position.x;
      positions[i * 3 + 1] = particle.position.y;
      positions[i * 3 + 2] = particle.position.z;
      opacities[i] = particle.opacity;
      sizes[i] = particle.size * (1 - particle.age / particle.maxAge);

      i++;
      return true;
    });

    // Update geometry
    geometry.setDrawRange(0, particles.current.length);
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.opacity.needsUpdate = true;
    geometry.attributes.size.needsUpdate = true;
  });

  if (!isOn) return null;

  return <points ref={particlesRef} geometry={geometry} material={material} />;
};

const VolumetricBeam = ({ isOn, position, direction }) => {
  const meshRef = useRef();

  // Create a volumetric cone for the beam
  useFrame(() => {
    if (meshRef.current && isOn && position && direction) {
      // Position the beam cone at the camera position
      meshRef.current.position.copy(position);

      // Orient the cone in the direction of the camera's look
      const lookAt = new THREE.Vector3()
        .copy(position)
        .add(direction.multiplyScalar(10));

      meshRef.current.lookAt(lookAt);

      // Apply rotation to point the cone forward
      meshRef.current.rotation.x = Math.PI / 2;
    }
  });

  if (!isOn) return null;

  return (
    <mesh ref={meshRef} renderOrder={1000}>
      <coneGeometry args={[2, 10, 16, 1, true]} />
      <meshBasicMaterial
        color="#ffffff"
        transparent={true}
        opacity={0.04}
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
};

// Individual flashlight for a player
const PlayerFlashlight = ({ position, rotation, isOn, isLocalPlayer }) => {
  const { camera } = useThree();
  const lightRef = useRef();
  const targetRef = useRef();
  const directionRef = useRef(new THREE.Vector3());
  const positionRef = useRef(new THREE.Vector3());

  // Debug log the flashlight state
  useEffect(() => {
    if (isLocalPlayer) {
      console.log(`Local player flashlight state: isOn=${isOn}`);
    }
  }, [isLocalPlayer, isOn]);

  // Create forward direction based on player rotation or camera view
  useFrame(() => {
    if (!isOn || !lightRef.current || !targetRef.current) return;

    let forwardDirection = new THREE.Vector3(0, 0, -1);
    let sourcePosition = new THREE.Vector3();

    if (isLocalPlayer) {
      // For local player, use camera direction and position
      forwardDirection.applyQuaternion(camera.quaternion);
      sourcePosition.copy(camera.position);
    } else {
      // For other players, use their rotation and position
      // Convert rotation.y to quaternion
      const quaternion = new THREE.Quaternion();
      quaternion.setFromEuler(new THREE.Euler(0, rotation.y, 0));
      forwardDirection.applyQuaternion(quaternion);

      // Use player position but raise slightly to eye level
      sourcePosition.set(position.x, position.y + 1.5, position.z);
    }

    // Store direction and position for particles
    directionRef.current.copy(forwardDirection);
    positionRef.current.copy(sourcePosition);

    // Position the light
    lightRef.current.position.copy(sourcePosition);

    // Position the target in front of the player/camera
    targetRef.current.position
      .copy(sourcePosition)
      .add(forwardDirection.multiplyScalar(5));

    // Update the target
    lightRef.current.target = targetRef.current;
  });

  // Return null only if explicitly turned off
  if (isOn === false) {
    return null;
  }

  return (
    <>
      {/* Invisible target object for the spotlight to point at */}
      <object3D ref={targetRef} position={[0, 0, -5]} />

      {/* Spotlight that acts as the flashlight */}
      <spotLight
        ref={lightRef}
        color="#ffffff"
        intensity={8} // Increased from 5 to 8 for better visibility
        distance={40} // Increased from 30 to 40 for longer range
        angle={0.35}
        penumbra={0.35}
        decay={1.0} // Reduced decay for brighter beam
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={40}
      />

      {/* Volumetric beam effect */}
      <VolumetricBeam
        isOn={isOn}
        position={positionRef.current}
        direction={directionRef.current}
      />

      {/* Dust particles in the beam */}
      <FlashlightParticles
        isOn={isOn}
        position={positionRef.current}
        direction={directionRef.current}
      />
    </>
  );
};

// Main flashlight component that manages all player flashlights
const Flashlight = ({ players, isNighttime, localPlayerId }) => {
  // Force default to ensure it doesn't break
  const actualPlayers = players || {};
  const actualLocalPlayerId = localPlayerId || '';

  // Check if nighttime is explicitly false (not undefined or null)
  const isNight = isNighttime !== false;

  if (Object.keys(actualPlayers).length === 0) {
    console.warn('Flashlight component: players object is empty');
    return null;
  }

  // Debug the players object
  console.log(
    `Flashlight component rendering. Players:`,
    Object.entries(actualPlayers)
      .map(([id, p]) => `${id}: flashlight=${p?.flashlightOn}`)
      .join(', '),
  );

  try {
    return (
      <>
        {/* Render flashlights for all players */}
        {Object.entries(actualPlayers).map(([playerId, playerData]) => {
          // Add safety check for playerData
          if (!playerData || !playerData.position || !playerData.rotation) {
            console.warn(
              `Flashlight component: Invalid player data for ${playerId}`,
            );
            return null;
          }

          // Default to ON for player's flashlight if not explicitly set to false
          const playerFlashlightOn = playerData.flashlightOn !== false;
          const isFlashlightOn = playerFlashlightOn && isNight;

          // Extra logging for local player
          if (playerId === actualLocalPlayerId) {
            console.log(
              `Local player flashlight render state: ${
                isFlashlightOn ? 'ON' : 'OFF'
              }, isNight=${isNight}, playerState=${playerFlashlightOn}`,
            );
          }

          return (
            <PlayerFlashlight
              key={`flashlight-${playerId}`}
              position={playerData.position}
              rotation={playerData.rotation}
              isOn={isFlashlightOn}
              isLocalPlayer={playerId === actualLocalPlayerId}
            />
          );
        })}
      </>
    );
  } catch (error) {
    console.error('Error in Flashlight component:', error);
    return null;
  }
};

export default Flashlight;
