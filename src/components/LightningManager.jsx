import React, { useState, useEffect } from 'react';
import useGameStore from '../store/gameStore';
import LightningEffect from './LightningEffect';

const LightningManager = () => {
  const { players } = useGameStore();
  const [lightningEffects, setLightningEffects] = useState([]);
  const [trackingPlayers, setTrackingPlayers] = useState({});

  // Monitor for new players
  useEffect(() => {
    const currentPlayerIds = Object.keys(players);

    // Find players that weren't tracked before
    const newPlayers = currentPlayerIds.filter((id) => !trackingPlayers[id]);

    if (newPlayers.length > 0) {
      // Add new lightning effects
      const newEffects = newPlayers.map((playerId) => {
        const position = players[playerId].position;
        return {
          id: `lightning-${playerId}-${Date.now()}`,
          position,
          timestamp: Date.now(),
        };
      });

      // Update state
      setLightningEffects((prev) => [...prev, ...newEffects]);

      // Mark these players as tracked
      const updatedTracking = { ...trackingPlayers };
      newPlayers.forEach((id) => {
        updatedTracking[id] = true;
      });
      setTrackingPlayers(updatedTracking);
    }
  }, [players, trackingPlayers]);

  // Handle completing a lightning effect
  const handleLightningComplete = (id) => {
    setLightningEffects((prev) => prev.filter((effect) => effect.id !== id));
  };

  return (
    <>
      {lightningEffects.map((effect) => (
        <LightningEffect
          key={effect.id}
          position={effect.position}
          onComplete={() => handleLightningComplete(effect.id)}
        />
      ))}
    </>
  );
};

export default LightningManager;
