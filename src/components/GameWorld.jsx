import React, { useRef, useMemo } from 'react';
import { Cylinder } from '@react-three/drei';
import Ground from './Ground';

// Simple tree component with size variation
const Tree = ({ position, scale = 1 }) => {
  // Randomize tree colors slightly for natural variation
  const trunkColor = useMemo(() => {
    const r = 139 + Math.floor(Math.random() * 20 - 10);
    const g = 69 + Math.floor(Math.random() * 10 - 5);
    const b = 19 + Math.floor(Math.random() * 10 - 5);
    return `rgb(${r}, ${g}, ${b})`;
  }, []);

  const foliageColor = useMemo(() => {
    const r = 34 + Math.floor(Math.random() * 20 - 10);
    const g = 139 + Math.floor(Math.random() * 30 - 15);
    const b = 34 + Math.floor(Math.random() * 10 - 5);
    return `rgb(${r}, ${g}, ${b})`;
  }, []);

  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Tree trunk */}
      <Cylinder
        args={[0.3, 0.5, 2, 8]}
        position={[0, 1, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={trunkColor} />
      </Cylinder>

      {/* Tree foliage */}
      <Cylinder
        args={[0, 1.5, 3, 8]}
        position={[0, 3, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={foliageColor} />
      </Cylinder>
    </group>
  );
};

// Generate a dense forest with natural clustering
const generateTrees = (count) => {
  const trees = [];
  const worldSize = 50; // Size of world for tree placement
  const clusterCount = 15; // Number of cluster centers
  const treeCount = count * 5; // Significantly more trees for density

  // Create cluster centers, ensuring some clusters near spawn point
  const clusters = [];

  // Add clusters specifically near spawn point
  clusters.push({
    x: 1 + Math.random() * 3,
    z: 1 + Math.random() * 3,
    radius: 3 + Math.random() * 4,
  });

  clusters.push({
    x: -1 - Math.random() * 3,
    z: -1 - Math.random() * 3,
    radius: 3 + Math.random() * 4,
  });

  clusters.push({
    x: 1 + Math.random() * 3,
    z: -1 - Math.random() * 3,
    radius: 3 + Math.random() * 4,
  });

  clusters.push({
    x: -1 - Math.random() * 3,
    z: 1 + Math.random() * 3,
    radius: 3 + Math.random() * 4,
  });

  // Add other clusters throughout the world
  for (let i = 0; i < clusterCount; i++) {
    clusters.push({
      x: (Math.random() - 0.5) * worldSize * 0.8,
      z: (Math.random() - 0.5) * worldSize * 0.8,
      radius: 3 + Math.random() * 7, // Variable cluster sizes
    });
  }

  // Create trees - part in clusters, part random for natural feel
  for (let i = 0; i < treeCount; i++) {
    let x, z, scale;

    if (i < treeCount * 0.7) {
      // 70% of trees are clustered
      const cluster = clusters[Math.floor(Math.random() * clusters.length)];
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * cluster.radius;
      x = cluster.x + Math.cos(angle) * distance;
      z = cluster.z + Math.sin(angle) * distance;
    } else {
      // 30% of trees are completely random for natural spread
      x = (Math.random() - 0.5) * worldSize;
      z = (Math.random() - 0.5) * worldSize;
    }

    // Ensure we also have some trees very close to spawn
    if (i < 10) {
      // Place some trees directly at spawn with varied positions
      const angle = Math.random() * Math.PI * 2;
      const distance = 0.5 + Math.random() * 1.5; // Close to spawn point but not exactly at it
      x = Math.cos(angle) * distance;
      z = Math.sin(angle) * distance;
    }

    // Vary tree sizes for more realism
    scale = 0.7 + Math.random() * 0.6;

    trees.push(<Tree key={`tree-${i}`} position={[x, 0, z]} scale={scale} />);
  }

  return trees;
};

const GameWorld = () => {
  // Use useMemo to generate trees only once
  const trees = useMemo(() => generateTrees(25), []);

  return (
    <>
      {/* Forest floor with detailed texturing */}
      <Ground size={100} />

      {/* Render pre-generated trees */}
      {trees}
    </>
  );
};

export default GameWorld;
