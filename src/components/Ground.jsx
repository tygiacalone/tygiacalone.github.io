import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';

const Ground = ({ size = 100 }) => {
  const meshRef = useRef();

  // Create procedural texture for the ground
  const groundTexture = useRef();

  useEffect(() => {
    // Create a canvas for the procedural texture
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const context = canvas.getContext('2d');

    // Fill base color - darker for forest floor
    context.fillStyle = '#3a5835';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Add organic patterns
    for (let i = 0; i < 2000; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = Math.random() * 20 + 5;

      // Forest floor patterns - more organic
      const pattern = Math.random();
      context.fillStyle = `rgba(
        ${40 + Math.random() * 30},
        ${45 + Math.random() * 35},
        ${30 + Math.random() * 20},
        ${0.1 + Math.random() * 0.3}
      )`;

      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }

    // Add noise and variation for detailed ground
    for (let i = 0; i < 60000; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = Math.random() * 2 + 0.5;

      // Random forest floor color variations
      const colorVariation = Math.random();
      if (colorVariation < 0.5) {
        // Forest moss/grass variations
        context.fillStyle = `rgb(
          ${60 + Math.random() * 40},
          ${80 + Math.random() * 50},
          ${45 + Math.random() * 30}
        )`;
      } else if (colorVariation < 0.8) {
        // Leaf litter and mulch variations
        context.fillStyle = `rgb(
          ${100 + Math.random() * 40},
          ${80 + Math.random() * 30},
          ${40 + Math.random() * 30}
        )`;
      } else {
        // Dark soil and shadow variations
        context.fillStyle = `rgb(
          ${60 + Math.random() * 20},
          ${50 + Math.random() * 20},
          ${30 + Math.random() * 20}
        )`;
      }

      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }

    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(size / 8, size / 8); // More detailed repeating

    // Create bump map for forest floor texture
    const bumpMap = new THREE.CanvasTexture(canvas);
    bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
    bumpMap.repeat.set(size / 8, size / 8);

    groundTexture.current = { texture, bumpMap };

    // Update material if mesh is available
    if (meshRef.current) {
      meshRef.current.material.map = texture;
      meshRef.current.material.bumpMap = bumpMap;
      meshRef.current.material.bumpScale = 0.08; // Increased for more texture
      meshRef.current.material.needsUpdate = true;
    }
  }, [size]);

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[size, size, 128, 128]} />
      <meshStandardMaterial
        color="#3d5a38"
        roughness={0.95}
        metalness={0.05}
        receiveShadow
      />
    </mesh>
  );
};

export default Ground;
