import React, { useRef, useMemo } from 'react';
import { Plane, Cylinder, Box } from '@react-three/drei';

// Simple tree component
const Tree = ({ position }) => {
  return (
    <group position={position}>
      {/* Tree trunk */}
      <Cylinder
        args={[0.3, 0.5, 2, 8]}
        position={[0, 1, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#8B4513" />
      </Cylinder>

      {/* Tree foliage */}
      <Cylinder
        args={[0, 1.5, 3, 8]}
        position={[0, 3, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#228B22" />
      </Cylinder>
    </group>
  );
};

// Generate trees with completely random placement
const generateTrees = (count) => {
  const trees = [];
  // Very minimal clear space - just enough to prevent trees directly on spawn point
  const minClearance = 0.8;
  const worldSize = 50; // Size of world for tree placement

  // Place trees completely randomly
  for (let i = 0; i < count * 3; i++) {
    // Random position anywhere in the world
    const x = (Math.random() - 0.5) * worldSize;
    const z = (Math.random() - 0.5) * worldSize;

    // Only exclude positions directly at spawn point
    const distFromSpawn = Math.sqrt(x * x + z * z);

    if (distFromSpawn > minClearance) {
      trees.push(<Tree key={`tree-${i}`} position={[x, 0, z]} />);
    }
  }

  return trees;
};

const GameWorld = () => {
  const planeRef = useRef();

  // Use useMemo to generate trees only once, but use more trees for density
  const trees = useMemo(() => generateTrees(25), []);

  return (
    <>
      {/* Ground plane */}
      <Plane
        ref={planeRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        args={[100, 100]}
        receiveShadow
      >
        <meshStandardMaterial color="#307030" />
      </Plane>

      {/* Spawn area marker */}
      <Box args={[3, 0.1, 3]} position={[0, 0.05, 0]} receiveShadow>
        <meshStandardMaterial color="#808080" />
      </Box>

      {/* Render pre-generated trees */}
      {trees}
    </>
  );
};

export default GameWorld;
