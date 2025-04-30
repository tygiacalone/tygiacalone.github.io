import React, { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';

const Ground = ({ size = 100 }) => {
  const meshRef = useRef();
  const mountainLeftRef = useRef();
  const mountainRightRef = useRef();

  // Create procedural texture for the ground
  const groundTexture = useRef();
  const rockTexture = useRef();

  // Create a ravine floor with a slight depression in the middle
  const ravineGeometry = useMemo(() => {
    const segments = 128;
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    const positions = geometry.attributes.position.array;

    const ravineWidth = size * 0.15; // Narrower ravine (was 0.2)
    const ravineDepth = 4; // Deeper depression (was 2)
    const mountainHeight = 25; // Height of mountains
    const mountainWidth = size * 0.35; // Width of the mountain area

    // Create a function to calculate steeper slopes
    const calculateSlopeHeight = (distance, width, depth) => {
      // Use a steeper curve for the transitions
      const normalizedDist = distance / width;
      // Use cubic function for steeper edges
      return -depth * Math.pow(1 - normalizedDist, 3);
    };

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];

      // Distance from center line
      const distFromCenter = Math.abs(x);

      // Create the ravine depression in the middle
      if (distFromCenter < ravineWidth) {
        // Ravine floor with slight variations for texture
        positions[i + 2] = -ravineDepth + Math.random() * 0.3 - 0.15;
      }
      // Create steeper transition between ravine and mountains
      else if (distFromCenter < mountainWidth) {
        const t =
          (distFromCenter - ravineWidth) / (mountainWidth - ravineWidth);

        // Steeper slope with cubic function
        if (t < 0.4) {
          // First section of slope is steeper
          positions[i + 2] =
            calculateSlopeHeight(t * 2.5, 1, ravineDepth) +
            Math.random() * 0.4 -
            0.2;
        } else {
          // Transition to flatter ground as we move away from ravine
          const flatTransition = (t - 0.4) / 0.6;
          positions[i + 2] =
            -ravineDepth * 0.1 * (1 - flatTransition) +
            Math.random() * 0.5 -
            0.25;
        }
      }
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
    return geometry;
  }, [size]);

  useEffect(() => {
    // Create a canvas for the ground texture
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const context = canvas.getContext('2d');

    // Fill base color - darker for ravine
    context.fillStyle = '#3c5a32';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Add noise and variation
    for (let i = 0; i < 40000; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = Math.random() * 2 + 0.5;

      // Random grass/dirt color
      const colorVariation = Math.random();
      if (colorVariation < 0.6) {
        // Darker grass variations for ravine floor
        context.fillStyle = `rgb(
          ${60 + Math.random() * 40},
          ${90 + Math.random() * 30},
          ${40 + Math.random() * 30}
        )`;
      } else {
        // More dirt/stone variations
        context.fillStyle = `rgb(
          ${90 + Math.random() * 30},
          ${80 + Math.random() * 20},
          ${60 + Math.random() * 20}
        )`;
      }

      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }

    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(size / 10, size / 10);

    // Create bump map for slight texture
    const bumpMap = new THREE.CanvasTexture(canvas);
    bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
    bumpMap.repeat.set(size / 10, size / 10);

    groundTexture.current = { texture, bumpMap };

    // Update material if mesh is available
    if (meshRef.current) {
      meshRef.current.material.map = texture;
      meshRef.current.material.bumpMap = bumpMap;
      meshRef.current.material.bumpScale = 0.05;
      meshRef.current.material.needsUpdate = true;
    }

    // Create a canvas for the mountain/rock texture
    const rockCanvas = document.createElement('canvas');
    rockCanvas.width = 1024;
    rockCanvas.height = 1024;
    const rockContext = rockCanvas.getContext('2d');

    // Fill base color - stone/mountain
    rockContext.fillStyle = '#555555';
    rockContext.fillRect(0, 0, rockCanvas.width, rockCanvas.height);

    // Add rock texture
    for (let i = 0; i < 60000; i++) {
      const x = Math.random() * rockCanvas.width;
      const y = Math.random() * rockCanvas.height;
      const radius = Math.random() * 3 + 0.5;

      // Random rock/stone color
      const rockVariation = Math.random();
      if (rockVariation < 0.6) {
        // Darker rock variations
        rockContext.fillStyle = `rgb(
          ${60 + Math.random() * 40},
          ${60 + Math.random() * 40},
          ${60 + Math.random() * 40}
        )`;
      } else {
        // Lighter rock variations with some moss
        rockContext.fillStyle = `rgb(
          ${80 + Math.random() * 40},
          ${80 + Math.random() * 40},
          ${70 + Math.random() * 30}
        )`;
      }

      rockContext.beginPath();
      rockContext.arc(x, y, radius, 0, Math.PI * 2);
      rockContext.fill();
    }

    // Create texture from canvas
    const rockTextureMap = new THREE.CanvasTexture(rockCanvas);
    rockTextureMap.wrapS = rockTextureMap.wrapT = THREE.RepeatWrapping;
    rockTextureMap.repeat.set(8, 8);

    // Create bump map for rock texture
    const rockBumpMap = new THREE.CanvasTexture(rockCanvas);
    rockBumpMap.wrapS = rockBumpMap.wrapT = THREE.RepeatWrapping;
    rockBumpMap.repeat.set(8, 8);

    rockTexture.current = { texture: rockTextureMap, bumpMap: rockBumpMap };

    // Update mountain materials if available
    if (mountainLeftRef.current) {
      mountainLeftRef.current.material.map = rockTextureMap;
      mountainLeftRef.current.material.bumpMap = rockBumpMap;
      mountainLeftRef.current.material.bumpScale = 0.2;
      mountainLeftRef.current.material.needsUpdate = true;
    }

    if (mountainRightRef.current) {
      mountainRightRef.current.material.map = rockTextureMap;
      mountainRightRef.current.material.bumpMap = rockBumpMap;
      mountainRightRef.current.material.bumpScale = 0.2;
      mountainRightRef.current.material.needsUpdate = true;
    }
  }, [size]);

  return (
    <group>
      {/* Ravine floor */}
      <mesh
        ref={meshRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1, 0]} // Lower the floor to create ravine
        receiveShadow
        geometry={ravineGeometry}
      >
        <meshStandardMaterial
          color="#3c5a32"
          roughness={0.9}
          metalness={0.1}
          receiveShadow
        />
      </mesh>

      {/* Left Mountain */}
      <mesh
        ref={mountainLeftRef}
        position={[-size * 0.3, 10, 0]} // Position left of center
        receiveShadow
        castShadow
      >
        <coneGeometry args={[size * 0.3, 30, 64, 4]} />
        <meshStandardMaterial
          color="#555555"
          roughness={0.8}
          metalness={0.2}
          receiveShadow
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Right Mountain */}
      <mesh
        ref={mountainRightRef}
        position={[size * 0.3, 12, 0]} // Position right of center
        rotation={[0, Math.PI / 5, 0]} // Slight rotation for variety
        receiveShadow
        castShadow
      >
        <coneGeometry args={[size * 0.35, 35, 64, 5]} />
        <meshStandardMaterial
          color="#5d5d5d"
          roughness={0.8}
          metalness={0.2}
          receiveShadow
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

export default Ground;
