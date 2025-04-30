import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';

const Obelisk = ({ position = [0, 0, 0], onExpire }) => {
  const obeliskRef = useRef();
  const baseRef = useRef();
  const glowRef = useRef();
  const textRef = useRef();
  const { camera, raycaster, mouse, scene, gl } = useThree();

  // Track when the obelisk was created
  const creationTimeRef = useRef(Date.now());
  const [timeRemaining, setTimeRemaining] = useState(60); // 60 seconds lifespan
  const [hovered, setHovered] = useState(false);

  // Floating animation values
  const floatOffset = useRef(Math.random() * Math.PI * 2);
  const floatHeight = useRef(0.3 + Math.random() * 0.2);
  const floatSpeed = useRef(0.5 + Math.random() * 0.3);

  // Console log to debug
  useEffect(() => {
    console.log('Obelisk created at position:', position);

    // Add debug sphere to mark position
    const geometry = new THREE.SphereGeometry(0.2, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(position[0], position[1] + 0.2, position[2]);
    scene.add(sphere);

    return () => {
      scene.remove(sphere);
    };
  }, [position, scene]);

  // Handle mouse clicks
  useEffect(() => {
    const handleClick = () => {
      // Raycast to see if obelisk is clicked
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
      const intersects = raycaster.intersectObject(obeliskRef.current, true);

      if (intersects.length > 0) {
        console.log('Obelisk clicked!');
        // Redirect to resume page
        window.open('/resume', '_blank');
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
      onExpire();
      return;
    }

    // Floating animation
    const floatY =
      Math.sin(
        state.clock.elapsedTime * floatSpeed.current + floatOffset.current,
      ) * floatHeight.current;
    obeliskRef.current.position.y = position[1] + floatY + 2; // Increased height

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

    // Scale text with hover
    if (textRef.current) {
      const scale = hovered ? 1.2 : 1;
      textRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group>
      {/* Base (on the ground) */}
      <mesh
        ref={baseRef}
        position={[position[0], position[1] + 0.05, position[2]]}
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
        position={[position[0], position[1] + 0.02, position[2]]}
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
        position={[position[0], position[1] + 2, position[2]]} // Increased height
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

        {/* Text label */}
        <Text
          ref={textRef}
          position={[0, 0, 0.9]} // More forward
          rotation={[0, 0, 0]}
          fontSize={0.3} // Larger text
          color="#00AAFF" // Brighter blue
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
          outlineWidth={0.03} // Add outline
          outlineColor="#FFFFFF"
        >
          Ty's Resume
        </Text>
      </group>

      {/* Point light for glow */}
      <pointLight
        position={[position[0], position[1] + 2, position[2]]}
        color="#FFFFFF"
        intensity={2} // Increased intensity
        distance={10} // Increased range
      />

      {/* Additional atmospheric light */}
      <pointLight
        position={[position[0], position[1] + 0.1, position[2]]}
        color="#80FFFF"
        intensity={1.5}
        distance={5}
      />
    </group>
  );
};

export default Obelisk;
