import React, { useMemo, useEffect } from 'react';
import Tree from './Tree';
import useForestStore from '../store/forestStore';

const Forest = ({ treeCount = 50, forestSize = 100 }) => {
  const { setTrees } = useForestStore();

  // Generate random tree data for a ravine setting
  const trees = useMemo(() => {
    const treeData = [];
    const ravineWidth = forestSize * 0.15; // Match the narrower ravine width
    const mountainWidth = forestSize * 0.35; // Match the updated mountain width
    const ravineDepth = 4; // Match the deeper ravine depth

    for (let i = 0; i < treeCount; i++) {
      // Random position calculation
      let x, z;
      const positionType = Math.random();

      if (positionType < 0.7) {
        // 70% of trees on the edges/slopes of the ravine
        const side = Math.random() < 0.5 ? -1 : 1; // Left or right side

        // Avoid placing trees on the steepest parts of slopes
        const minOffset = ravineWidth * 1.1; // Add a small buffer from the edge
        const maxOffset = mountainWidth * 0.9; // Don't go too far to mountain base
        const edgeOffset = minOffset + Math.random() * (maxOffset - minOffset);

        x = side * edgeOffset;
        z = Math.random() * forestSize - forestSize / 2;
      } else {
        // 30% of trees randomly distributed but avoiding the center ravine
        x = Math.random() * forestSize - forestSize / 2;
        // Ensure trees are well away from the ravine edge
        if (Math.abs(x) < ravineWidth * 1.2) {
          x = (x < 0 ? -1 : 1) * (ravineWidth * 1.2 + Math.random() * 5);
        }
        z = Math.random() * forestSize - forestSize / 2;
      }

      // Trees on slopes should appear to be on ground - adjust Y based on position
      let y = 0;

      // Calculate Y position based on ground geometry
      const distFromCenter = Math.abs(x);

      // Inside ravine - place trees slightly above floor level
      if (distFromCenter < ravineWidth) {
        y = -ravineDepth + 0.5; // Lift trees slightly off ravine floor
      }
      // On slopes
      else if (distFromCenter < mountainWidth) {
        const t =
          (distFromCenter - ravineWidth) / (mountainWidth - ravineWidth);

        if (t < 0.4) {
          // On steeper part of slope
          // Use matching formula as ground geometry for consistency
          y = -ravineDepth * Math.pow(1 - t * 2.5, 3) + 0.5; // Add offset to prevent intersection
        } else {
          // On flatter part transitioning to plains
          const flatTransition = (t - 0.4) / 0.6;
          y = -ravineDepth * 0.1 * (1 - flatTransition) + 0.3;
        }
      }
      // On flat plains
      else {
        y = 0.2; // Slight elevation to prevent z-fighting
      }

      // Random tree scale - smaller on slopes
      const scale = 0.7 + Math.random() * 0.5;

      // Reduce scale of trees on slopes
      const finalScale =
        distFromCenter > ravineWidth && distFromCenter < mountainWidth
          ? scale * 0.85 // Smaller on slopes
          : scale;

      // Random tree variant (0, 1, or 2)
      const variant = Math.floor(Math.random() * 3);

      treeData.push({
        id: i,
        position: [x, y, z],
        scale: finalScale,
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
