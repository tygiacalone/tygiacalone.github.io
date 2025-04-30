import React, { useMemo, useEffect } from 'react';
import Tree from './Tree';
import useForestStore from '../store/forestStore';

const Forest = ({ treeCount = 50, forestSize = 100 }) => {
  const { setTrees } = useForestStore();

  // Generate random tree data
  const trees = useMemo(() => {
    const treeData = [];

    for (let i = 0; i < treeCount; i++) {
      // Random position within forest boundaries
      const x = Math.random() * forestSize - forestSize / 2;
      const z = Math.random() * forestSize - forestSize / 2;

      // Random tree scale
      const scale = 0.7 + Math.random() * 0.6;

      // Random tree variant (0, 1, or 2)
      const variant = Math.floor(Math.random() * 3);

      treeData.push({
        id: i,
        position: [x, 0, z],
        scale,
        variant,
      });
    }

    return treeData;
  }, [treeCount, forestSize]);

  // Update forest store with tree positions for collision detection
  useEffect(() => {
    setTrees(trees);

    // Clean up tree data when component unmounts
    return () => setTrees([]);
  }, [trees, setTrees]);

  return (
    <group>
      {trees.map((tree) => (
        <Tree
          key={tree.id}
          position={tree.position}
          scale={tree.scale}
          variant={tree.variant}
        />
      ))}
    </group>
  );
};

export default Forest;
