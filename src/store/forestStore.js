import { create } from 'zustand';

const useForestStore = create((set) => ({
  // Tree data
  trees: [],

  // Set all trees at once
  setTrees: (treeData) => set({ trees: treeData }),

  // Clear all trees
  clearTrees: () => set({ trees: [] }),

  // Check collision with all trees
  checkTreeCollision: (position, radius = 0.5) => {
    const { trees } = useForestStore.getState();

    // For each tree, check if the player is within collision distance
    for (const tree of trees) {
      const treePos = tree.position;
      // Tree trunk radius (based on scale)
      const treeRadius = 0.3 * tree.scale * 5; // Base radius * scale * global scale factor

      // Calculate horizontal distance between player and tree
      const dx = position.x - treePos[0];
      const dz = position.z - treePos[2];
      const distance = Math.sqrt(dx * dx + dz * dz);

      // If distance is less than combined radii, there's a collision
      if (distance < radius + treeRadius) {
        return {
          collision: true,
          treePosition: treePos,
          normal: [dx / distance, 0, dz / distance], // Normalized direction from tree to player
          penetration: radius + treeRadius - distance, // How far the player penetrated the tree
        };
      }
    }

    // No collisions found
    return { collision: false };
  },
}));

export default useForestStore;
