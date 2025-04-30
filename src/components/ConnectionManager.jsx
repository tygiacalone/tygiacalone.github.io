import React, { useState, useEffect } from 'react';
import usePeerConnection from '../hooks/usePeerConnection';
import useGameStore from '../store/gameStore';

const ConnectionManager = () => {
  const [playerCount, setPlayerCount] = useState(1); // Start with 1 (self)
  const [showDebug, setShowDebug] = useState(false);

  const { isConnected, connections } = usePeerConnection();
  const { playerId, players } = useGameStore();

  // Update player count when connections change
  useEffect(() => {
    if (connections) {
      setPlayerCount(Object.keys(connections).length + 1); // +1 for self
    }
  }, [connections]);

  return (
    <div className="absolute top-4 right-4 p-4 bg-white bg-opacity-80 rounded-lg shadow-lg max-w-xs z-10">
      <h3 className="text-lg font-semibold mb-2">Multiplayer Forest</h3>

      <div className="mb-3">
        <p className="text-sm">
          Status:{' '}
          <span
            className={
              isConnected
                ? 'text-green-600 font-semibold'
                : 'text-yellow-600 font-semibold'
            }
          >
            {isConnected ? 'Connected' : 'Connecting...'}
          </span>
        </p>
        <p className="text-sm">
          Players: <span className="font-semibold">{playerCount}</span> online
        </p>
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="text-xs bg-gray-200 hover:bg-gray-300 py-1 px-2 rounded mt-2"
        >
          {showDebug ? 'Hide Debug' : 'Show Debug'}
        </button>
      </div>

      {/* Debug info to help diagnose player visibility issues */}
      {showDebug && (
        <div className="text-xs mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-60">
          <p className="font-semibold">Local Player ID: {playerId}</p>
          <p className="font-semibold mt-1">Players in world:</p>
          <ul className="mt-1">
            {Object.entries(players).map(([id, player]) => (
              <li key={id} className="mb-1">
                <p className="font-medium">
                  {id === playerId ? 'You' : 'Player'} ({id.substring(0, 6)}...)
                </p>
                <p>Pos: {JSON.stringify(player.position)}</p>
                <p>Flashlight: {player.flashlightOn ? 'ON' : 'OFF'}</p>
              </li>
            ))}
          </ul>

          <p className="font-semibold mt-2">Connected Peers:</p>
          <ul className="mt-1">
            {Object.keys(connections).map((id) => (
              <li key={id} className="mb-1">
                {id.substring(0, 10)}...
              </li>
            ))}
            {Object.keys(connections).length === 0 && (
              <li>
                <em>No connections yet</em>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ConnectionManager;
