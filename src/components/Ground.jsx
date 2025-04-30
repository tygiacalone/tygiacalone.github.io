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

    // Fill base color
    context.fillStyle = '#507a46';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Add noise and variation
    for (let i = 0; i < 40000; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = Math.random() * 2 + 0.5;

      // Random grass/dirt color
      const colorVariation = Math.random();
      if (colorVariation < 0.7) {
        // Grass variations
        context.fillStyle = `rgb(
          ${80 + Math.random() * 40},
          ${110 + Math.random() * 40},
          ${60 + Math.random() * 30}
        )`;
      } else {
        // Dirt/stone variations
        context.fillStyle = `rgb(
          ${100 + Math.random() * 30},
          ${90 + Math.random() * 20},
          ${70 + Math.random() * 20}
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
        color="#5d8c4e"
        roughness={0.9}
        metalness={0.1}
        receiveShadow
      />
    </mesh>
  );
};

export default Ground;
