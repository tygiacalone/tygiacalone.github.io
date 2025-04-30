import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';

// Static counter to generate unique IDs and track created obelisks
const createdObelisks = new Set();

// Resume URL - Google Docs link
const RESUME_URL =
  'https://docs.google.com/document/d/1yArxUS0Yo0nNJ6fuuolZ6AsEmuvF0XITGVp6HdU1mVA/edit?usp=sharing';

const Obelisk = ({ position = [0, 0, 0], onExpire }) => {
  const obeliskRef = useRef();
  const baseRef = useRef();
  const glowRef = useRef();
  const textGroupRef = useRef();
  const collisionRadiusRef = useRef(1.5); // Collision radius for "walking into" functionality
  const { camera, raycaster, mouse, scene, gl } = useThree();

  // Store the initial position in a ref to avoid reacting to prop changes
  const initialPositionRef = useRef(position);

  // Generate a unique ID for this obelisk instance
  const obeliskId = useRef(`obelisk-${initialPositionRef.current.join(',')}`);

  // Track when the obelisk was created
  const creationTimeRef = useRef(Date.now());
  const [timeRemaining, setTimeRemaining] = useState(60); // 60 seconds lifespan
  const [hovered, setHovered] = useState(false);
  const [lastCollisionCheck, setLastCollisionCheck] = useState(0); // Prevent too frequent collision checks

  // Floating animation values
  const floatOffset = useRef(Math.random() * Math.PI * 2);
  const floatHeight = useRef(0.3 + Math.random() * 0.2);
  const floatSpeed = useRef(0.5 + Math.random() * 0.3);

  // Function to open resume in new tab
  const openResume = () => {
    console.log('Opening resume...');
    window.open(RESUME_URL, '_blank');
  };

  // Console log to debug - only run once per unique position
  useEffect(() => {
    // Check if this obelisk was already created
    if (createdObelisks.has(obeliskId.current)) {
      return; // Skip if already created
    }

    // Add to set of created obelisks
    createdObelisks.add(obeliskId.current);

    console.log('Obelisk created at position:', initialPositionRef.current);

    // Add debug sphere to mark position
    const geometry = new THREE.SphereGeometry(0.2, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const sphere = new THREE.Mesh(geometry, material);
    const pos = initialPositionRef.current;
    sphere.position.set(pos[0], pos[1] + 0.2, pos[2]);
    scene.add(sphere);

    return () => {
      scene.remove(sphere);
      // Don't remove from createdObelisks to prevent recreation if component remounts
    };
  }, []); // Run only once on mount

  // Handle mouse clicks
  useEffect(() => {
    const handleClick = () => {
      // Raycast to see if obelisk is clicked
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
      const intersects = raycaster.intersectObject(obeliskRef.current, true);

      if (intersects.length > 0) {
        console.log('Obelisk clicked!');
        openResume();
      }
    };

    // Add event listener
    const canvas = gl.domElement;
    canvas.addEventListener('click', handleClick);

    return () => {
      canvas.removeEventListener('click', handleClick);
    };
  }, [camera, raycaster, gl]);

  // Animation and lifecycle
  useFrame((state, delta) => {
    if (!obeliskRef.current) return;

    // Calculate remaining time
    const elapsed = (Date.now() - creationTimeRef.current) / 1000;
    const remaining = Math.max(0, 60 - elapsed);
    setTimeRemaining(remaining);

    // Trigger onExpire callback when time runs out
    if (remaining <= 0 && onExpire) {
      // Remove from the set to allow proper cleanup
      createdObelisks.delete(obeliskId.current);
      onExpire();
      return;
    }

    // Floating animation
    const floatY =
      Math.sin(
        state.clock.elapsedTime * floatSpeed.current + floatOffset.current,
      ) * floatHeight.current;
    obeliskRef.current.position.y = initialPositionRef.current[1] + floatY + 2; // Increased height

    // Gentle rotation
    obeliskRef.current.rotation.y += delta * 0.2;

    // Pulse glow effect
    if (glowRef.current && glowRef.current.material) {
      const pulseIntensity = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
      glowRef.current.material.opacity = 0.8 * pulseIntensity; // Increased opacity

      // Make glow more intense when hovered
      if (hovered) {
        glowRef.current.material.opacity *= 1.5;
      }
    }

    // Animate base ring
    if (baseRef.current) {
      baseRef.current.rotation.z += delta * 0.5;
      // Pulse the base too
      const baseScale = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
      baseRef.current.scale.set(baseScale, baseScale, 1);
    }

    // Check for hover (center of screen intersection)
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.intersectObject(obeliskRef.current, true);
    setHovered(intersects.length > 0);

    // Counter-rotate text group to keep all text elements static relative to the camera
    if (textGroupRef.current && obeliskRef.current) {
      // Apply counter-rotation to the text group
      textGroupRef.current.rotation.y = -obeliskRef.current.rotation.y;

      // Scale text with hover
      const scale = hovered ? 1.2 : 1;
      textGroupRef.current.scale.set(scale, scale, scale);
    }

    // Walk-into collision detection (check every 200ms)
    const now = Date.now();
    if (now - lastCollisionCheck > 200) {
      setLastCollisionCheck(now);

      // Calculate distance between player (camera) and obelisk
      const cameraPosition = new THREE.Vector3();
      camera.getWorldPosition(cameraPosition);

      // Get obelisk position (adjust for height)
      const obeliskPosition = new THREE.Vector3(
        initialPositionRef.current[0],
        initialPositionRef.current[1],
        initialPositionRef.current[2],
      );

      // Only compare XZ distance (horizontal plane)
      cameraPosition.y = obeliskPosition.y;

      // Check if player is within collision radius
      const distance = cameraPosition.distanceTo(obeliskPosition);
      if (distance < collisionRadiusRef.current) {
        console.log('Player walked into obelisk!');
        openResume();
      }
    }
  });

  return (
    <group>
      {/* Base (on the ground) */}
      <mesh
        ref={baseRef}
        position={[
          initialPositionRef.current[0],
          initialPositionRef.current[1] + 0.05,
          initialPositionRef.current[2],
        ]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.5, 2, 32]} /> {/* Larger, more detailed ring */}
        <meshBasicMaterial
          color="#FFFFFF"
          transparent={true}
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Additional ground decoration */}
      <mesh
        position={[
          initialPositionRef.current[0],
          initialPositionRef.current[1] + 0.02,
          initialPositionRef.current[2],
        ]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0, 0.5, 16]} />
        <meshBasicMaterial
          color="#80FFFF"
          transparent={true}
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Obelisk */}
      <group
        ref={obeliskRef}
        position={[
          initialPositionRef.current[0],
          initialPositionRef.current[1] + 2,
          initialPositionRef.current[2],
        ]} // Increased height
      >
        {/* Main obelisk body */}
        <mesh castShadow>
          <coneGeometry args={[0.8, 4, 4]} /> {/* Larger obelisk */}
          <meshStandardMaterial
            color="#FFFFFF"
            emissive="#FFFFFF"
            emissiveIntensity={1.0} // Increased brightness
            metalness={0.7}
            roughness={0.2}
          />
        </mesh>

        {/* Glow effect */}
        <mesh ref={glowRef}>
          <coneGeometry args={[1.2, 4.5, 4]} /> {/* Larger glow */}
          <meshBasicMaterial
            color="#FFFFFF"
            transparent={true}
            opacity={0.8} // Increased opacity
            side={THREE.BackSide}
          />
        </mesh>

        {/* Additional decorative rings */}
        <mesh position={[0, -1.5, 0]}>
          <torusGeometry args={[1, 0.1, 16, 32]} />
          <meshStandardMaterial
            color="#AADDFF"
            emissive="#88CCFF"
            emissiveIntensity={0.8}
          />
        </mesh>

        {/* Text group that counter-rotates as a whole */}
        <group ref={textGroupRef} position={[0, 0, 0.9]}>
          {/* Title text */}
          <Text
            position={[0, 0, 0]}
            fontSize={0.3}
            color="#00AAFF"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
            outlineWidth={0.03}
            outlineColor="#FFFFFF"
          >
            Ty's Resume
          </Text>

          {/* Instruction text */}
          <Text
            position={[0, -0.5, 0]}
            fontSize={0.2}
            color="#FFFFFF"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
            outlineWidth={0.02}
            outlineColor="#00AAFF"
          >
            Touch obelisk to read
          </Text>
        </group>
      </group>

      {/* Point light for glow */}
      <pointLight
        position={[
          initialPositionRef.current[0],
          initialPositionRef.current[1] + 2,
          initialPositionRef.current[2],
        ]}
        color="#FFFFFF"
        intensity={2} // Increased intensity
        distance={10} // Increased range
      />

      {/* Additional atmospheric light */}
      <pointLight
        position={[
          initialPositionRef.current[0],
          initialPositionRef.current[1] + 0.1,
          initialPositionRef.current[2],
        ]}
        color="#80FFFF"
        intensity={1.5}
        distance={5}
      />
    </group>
  );
};

export default Obelisk;
