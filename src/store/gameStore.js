import { create } from 'zustand';
import { nanoid } from 'nanoid';

const useGameStore = create((set, get) => ({
  // Player state
  playerId: nanoid(),
  players: {},

  // Add a new player to the game
  addPlayer: (id, playerData) => {
    console.log(`Adding player: ${id}`, playerData);
    set((state) => ({
      players: {
        ...state.players,
        [id]: {
          ...playerData,
          // Default flashlight to false if not provided
          flashlightOn:
            playerData.flashlightOn !== undefined
              ? playerData.flashlightOn
              : false,
          // Ensure position and rotation are present
          position: playerData.position || { x: 0, y: 1, z: 0 },
          rotation: playerData.rotation || { x: 0, y: 0, z: 0 },
        },
      },
    }));
  },

  // Update a player's position
  updatePlayerPosition: (id, position, rotation) => {
    if (!get().players[id]) {
      console.warn(`Trying to update position for non-existent player: ${id}`);
      // Initialize the player if they don't exist
      get().addPlayer(id, { id, position, rotation });
      return;
    }

    set((state) => ({
      players: {
        ...state.players,
        [id]: {
          ...state.players[id],
          position,
          rotation,
        },
      },
    }));
  },

  // Update a player's flashlight state
  updatePlayerFlashlightState: (id, flashlightOn) => {
    console.log(
      `Updating flashlight state for player ${id} to ${flashlightOn}`,
    );

    if (!get().players[id]) {
      console.warn(
        `Trying to update flashlight state for non-existent player: ${id}`,
      );
      // Initialize the player if they don't exist
      get().addPlayer(id, { id, flashlightOn });
      return;
    }

    set((state) => ({
      players: {
        ...state.players,
        [id]: {
          ...state.players[id],
          flashlightOn,
        },
      },
    }));
  },

  // Remove a player from the game
  removePlayer: (id) =>
    set((state) => {
      const newPlayers = { ...state.players };
      delete newPlayers[id];
      return { players: newPlayers };
    }),
}));

export default useGameStore;
