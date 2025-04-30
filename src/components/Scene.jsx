import React, { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stats, Sky } from '@react-three/drei';
import GameWorld from './GameWorld';
import Player from './Player';
import OtherPlayers from './OtherPlayers';
import useNetworking from '../hooks/useNetworking';
import usePlayerControls from '../hooks/usePlayerControls';
import { isMobile } from 'react-device-detect';

// This component contains all the 3D elements and Three.js related hooks
const SceneContent = () => {
  const { players, peerId, connectionStatus, sendPlayerUpdate } =
    useNetworking();
  const { controls, cameraRef, playerRef, playerHeadRef, eyesRef } =
    usePlayerControls(isMobile);

  useEffect(() => {
    const sendPlayerData = () => {
      if (
        playerRef &&
        playerRef.current &&
        playerHeadRef &&
        playerHeadRef.current
      ) {
        const playerPosition = playerRef.current.position.toArray();
        const playerRotation = playerRef.current.rotation.toArray().slice(0, 3);
        const headRotation = playerHeadRef.current.rotation
          .toArray()
          .slice(0, 3);

        sendPlayerUpdate(playerPosition, playerRotation, headRotation);
      }
    };

    // Send position updates 10 times per second
    const intervalId = setInterval(sendPlayerData, 100);

    return () => {
      clearInterval(intervalId);
    };
  }, [sendPlayerUpdate, playerRef, playerHeadRef]);

  return (
    <>
      <Sky sunPosition={[100, 20, 100]} />
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize={1024}
      />
      <Stats />
      <Player
        ref={playerRef}
        headRef={playerHeadRef}
        eyesRef={eyesRef}
        cameraRef={cameraRef}
        controls={controls}
      />
      <OtherPlayers players={players} />
      <GameWorld />
    </>
  );
};

const Scene = () => {
  const canvasRef = useRef(null);
  const { players, peerId, connectionStatus, initNetwork } = useNetworking();

  // Initialize network when component mounts
  useEffect(() => {
    initNetwork();
  }, [initNetwork]);

  // Create and update connection info element
  useEffect(() => {
    // Create connection info element
    const connectionInfo = document.createElement('div');
    connectionInfo.id = 'connection-info';
    connectionInfo.style.position = 'absolute';
    connectionInfo.style.top = '10px';
    connectionInfo.style.right = '10px';
    connectionInfo.style.background = 'rgba(0, 0, 0, 0.7)';
    connectionInfo.style.color = '#fff';
    connectionInfo.style.padding = '10px';
    connectionInfo.style.borderRadius = '5px';
    connectionInfo.style.fontFamily = 'Arial, sans-serif';
    connectionInfo.style.fontSize = '14px';
    connectionInfo.style.zIndex = '1000';
    document.body.appendChild(connectionInfo);

    // Update connection info
    const updateConnectionInfo = () => {
      const connected = Object.keys(players).length;
      let statusColor = '#ff5555'; // Red for disconnected
      let statusText = 'Disconnected';

      if (connectionStatus === 'connected') {
        statusColor = '#55ff55'; // Green for connected
        statusText = 'Connected';
      } else if (connectionStatus === 'connecting') {
        statusColor = '#ffff55'; // Yellow for connecting
        statusText = 'Connecting...';
      }

      connectionInfo.innerHTML = `
        <div style="margin-bottom: 5px;">
          <span style="color: ${statusColor};">● ${statusText}</span>
        </div>
        <div>Players in world: ${connected + 1}</div>
      `;
    };

    // Initial update
    updateConnectionInfo();

    // Update whenever players or connection status changes
    const intervalId = setInterval(updateConnectionInfo, 1000);

    // Cleanup
    return () => {
      clearInterval(intervalId);
      document.body.removeChild(connectionInfo);
    };
  }, [players, peerId, connectionStatus]);

  return (
    <div ref={canvasRef} style={{ width: '100vw', height: '100vh' }}>
      <Canvas
        camera={{
          position: [0, 1.6, 0],
          fov: 70,
          near: 0.1,
          far: 1000,
        }}
        style={{ background: '#87CEEB' }} // Sky blue background
        shadows
      >
        <SceneContent />
      </Canvas>
    </div>
  );
};

export default Scene;
