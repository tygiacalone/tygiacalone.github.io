import React, { useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

const Tree = ({ position, scale = 1, variant = 0 }) => {
  const treeRef = useRef();
  // Apply a 5x scale factor
  const scaleFactor = 5 * scale;

  // Simple tree made of primitives
  return (
    <group position={position} ref={treeRef}>
      {/* Tree trunk */}
      <mesh position={[0, 1 * scaleFactor, 0]} castShadow>
        <cylinderGeometry
          args={[0.2 * scaleFactor, 0.3 * scaleFactor, 2 * scaleFactor, 8]}
        />
        <meshStandardMaterial color="#8B4513" roughness={0.8} />
      </mesh>

      {/* Tree top - different variants */}
      {variant === 0 && (
        <mesh position={[0, 3 * scaleFactor, 0]} castShadow>
          <coneGeometry args={[1 * scaleFactor, 3 * scaleFactor, 8]} />
          <meshStandardMaterial color="#2d4c1e" roughness={0.8} />
        </mesh>
      )}

      {variant === 1 && (
        <>
          <mesh position={[0, 2.5 * scaleFactor, 0]} castShadow>
            <coneGeometry args={[1.2 * scaleFactor, 2 * scaleFactor, 8]} />
            <meshStandardMaterial color="#2d4c1e" roughness={0.8} />
          </mesh>
          <mesh position={[0, 3.5 * scaleFactor, 0]} castShadow>
            <coneGeometry args={[0.8 * scaleFactor, 1.5 * scaleFactor, 8]} />
            <meshStandardMaterial color="#2d4c1e" roughness={0.8} />
          </mesh>
        </>
      )}

      {variant === 2 && (
        <mesh position={[0, 2.5 * scaleFactor, 0]} castShadow>
          <sphereGeometry args={[1.2 * scaleFactor, 16, 16]} />
          <meshStandardMaterial color="#3a5a2c" roughness={0.8} />
        </mesh>
      )}
    </group>
  );
};

export default Tree;
