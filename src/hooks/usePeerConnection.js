import { useEffect, useState, useRef } from 'react';
import Peer from 'peerjs';
import useGameStore from '../store/gameStore';
import { nanoid } from 'nanoid';

const usePeerConnection = () => {
  const [peer, setPeer] = useState(null);
  const [connections, setConnections] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [peerId, setPeerId] = useState(null);
  const connectionAttempts = useRef(0);
  const maxConnectionAttempts = 3;
  const discoveredPeers = useRef(new Set());
  const roomId = 'forest-game-main'; // Shared room identifier

  const {
    playerId,
    players,
    addPlayer,
    updatePlayerPosition,
    updatePlayerFlashlightState,
    removePlayer,
  } = useGameStore();

  // Initialize own player in the store
  useEffect(() => {
    // Initialize own player if not already in the store
    if (playerId && !players[playerId]) {
      addPlayer(playerId, {
        id: playerId,
        position: { x: 0, y: 1, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        flashlightOn: true, // Always initialize with flashlight ON
      });
    } else if (
      playerId &&
      players[playerId] &&
      players[playerId].flashlightOn === undefined
    ) {
      // Make sure flashlight state exists
      updatePlayerFlashlightState(playerId, true);
    }
  }, [playerId, players, addPlayer, updatePlayerFlashlightState]);

  // Initialize peer connection with proper ICE servers for NAT traversal
  useEffect(() => {
    let newPeer = null;
    let reconnectTimeout = null;

    const initializePeer = () => {
      if (connectionAttempts.current >= maxConnectionAttempts) {
        console.warn('Max connection attempts reached, giving up');
        return;
      }

      connectionAttempts.current += 1;

      // Generate a unique ID for this peer
      const uniquePeerId = `forest-${playerId}-${nanoid(8)}`;

      try {
        // Cleanup previous peer if exists
        if (newPeer) {
          newPeer.destroy();
        }

        // Create new peer with enhanced options for internet connectivity
        newPeer = new Peer(uniquePeerId, {
          debug: 1,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              { urls: 'stun:stun2.l.google.com:19302' },
              { urls: 'stun:stun3.l.google.com:19302' },
              { urls: 'stun:stun4.l.google.com:19302' },
              { urls: 'stun:stun.global.stun.twilio.com:3478' },
            ],
            iceCandidatePoolSize: 10,
          },
        });

        newPeer.on('open', (id) => {
          console.log('My peer ID is: ', id);
          setPeer(newPeer);
          setPeerId(id);
          setIsConnected(true);
          connectionAttempts.current = 0; // Reset counter on successful connection

          // Connect to the presence server to announce ourselves
          announceToPresenceServer(id);
        });

        newPeer.on('connection', handleConnection);

        newPeer.on('error', (err) => {
          console.error('Peer connection error:', err);
          if (err.type === 'network' || err.type === 'server-error') {
            // Try to reconnect for network or server errors
            cleanupAndReconnect();
          }
        });

        newPeer.on('disconnected', () => {
          console.log('Peer disconnected, attempting to reconnect...');

          // Try to reconnect
          if (newPeer) {
            newPeer.reconnect();
          }

          // If reconnect doesn't work, clean up and try again
          reconnectTimeout = setTimeout(() => {
            if (!isConnected) {
              cleanupAndReconnect();
            }
          }, 5000);
        });
      } catch (err) {
        console.error('Error creating peer:', err);
        cleanupAndReconnect();
      }
    };

    const cleanupAndReconnect = () => {
      setIsConnected(false);

      if (newPeer) {
        try {
          newPeer.destroy();
        } catch (err) {
          console.error('Error destroying peer:', err);
        }
      }

      // Try to reconnect after a delay
      reconnectTimeout = setTimeout(initializePeer, 3000);
    };

    // Announce to the presence server (simplified implementation using localStorage)
    const announceToPresenceServer = (id) => {
      try {
        // Use localStorage as a temporary solution for peer discovery
        // In production, you should use a real presence server or WebSocket
        const existingPeers = JSON.parse(localStorage.getItem(roomId) || '[]');

        // Filter out stale peers (older than 2 minutes)
        const now = Date.now();
        const activePeers = existingPeers.filter(
          (p) => now - p.timestamp < 120000,
        );

        // Add ourselves to the list
        activePeers.push({
          peerId: id,
          timestamp: now,
        });

        // Save the updated list
        localStorage.setItem(roomId, JSON.stringify(activePeers));

        // Connect to all existing peers
        activePeers.forEach((peer) => {
          if (peer.peerId !== id) {
            connectToPeer(peer.peerId);
          }
        });

        // Set up interval to refresh our presence and discover new peers
        const announceInterval = setInterval(() => {
          if (newPeer && newPeer.id) {
            announceToPresenceServer(newPeer.id);
          }
        }, 20000);

        // Cleanup interval on unmount
        return () => clearInterval(announceInterval);
      } catch (err) {
        console.error('Error announcing to presence server:', err);
      }
    };

    // Start the initial connection
    initializePeer();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }

      if (newPeer) {
        try {
          // Before destroying the peer, remove ourselves from the presence server
          if (newPeer.id) {
            try {
              const existingPeers = JSON.parse(
                localStorage.getItem(roomId) || '[]',
              );
              const filteredPeers = existingPeers.filter(
                (p) => p.peerId !== newPeer.id,
              );
              localStorage.setItem(roomId, JSON.stringify(filteredPeers));
            } catch (err) {
              console.error('Error removing peer from presence server:', err);
            }
          }

          newPeer.destroy();
        } catch (err) {
          console.error('Error destroying peer on cleanup:', err);
        }
      }
    };
  }, [playerId]);

  // Handle new connections
  const handleConnection = (conn) => {
    conn.on('open', () => {
      console.log('Connected to peer:', conn.peer);

      // Add to connections
      setConnections((prev) => ({
        ...prev,
        [conn.peer]: conn,
      }));

      // Add to discovered peers
      discoveredPeers.current.add(conn.peer);

      // Send current player data
      sendPlayerData(conn);

      // Send data about all other connected players
      Object.entries(players).forEach(([id, player]) => {
        if (id !== playerId && player.peerId !== conn.peer) {
          conn.send({
            type: 'player-data',
            player,
          });
        }
      });

      // Send peer list to help with discovery
      const otherPeers = Object.keys(connections).filter(
        (id) => id !== conn.peer,
      );
      if (otherPeers.length > 0) {
        conn.send({
          type: 'peer-list',
          peers: otherPeers,
        });
      }

      // Handle incoming data
      conn.on('data', (data) => {
        handleIncomingData(data, conn.peer);
      });

      // Handle disconnection
      conn.on('close', () => {
        console.log('Connection closed with peer:', conn.peer);

        // Find the player associated with this connection
        const playerToRemove = Object.values(players).find(
          (player) => player.peerId === conn.peer,
        );

        if (playerToRemove) {
          removePlayer(playerToRemove.id);
        }

        setConnections((prev) => {
          const newConnections = { ...prev };
          delete newConnections[conn.peer];
          return newConnections;
        });

        // Remove from discovered peers
        discoveredPeers.current.delete(conn.peer);
      });
    });
  };

  // Connect to a peer
  const connectToPeer = (peerId) => {
    if (!peer || peerId === peer.id) return;

    // Don't connect if already connected
    if (connections[peerId]) {
      console.log('Already connected to:', peerId);
      return;
    }

    console.log('Connecting to peer:', peerId);
    try {
      const conn = peer.connect(peerId);
      handleConnection(conn);
    } catch (error) {
      console.error('Error connecting to peer:', error);
    }
  };

  // Handle incoming data
  const handleIncomingData = (data, senderId) => {
    switch (data.type) {
      case 'player-data':
        // Store the peer ID with the player for better connection handling
        addPlayer(data.player.id, {
          ...data.player,
          peerId: senderId,
        });
        break;
      case 'player-position':
        updatePlayerPosition(data.playerId, data.position, data.rotation);
        break;
      case 'player-flashlight':
        updatePlayerFlashlightState(data.playerId, data.flashlightOn);
        break;
      case 'peer-list':
        // Connect to peers we didn't know about
        if (data.peers && Array.isArray(data.peers)) {
          data.peers.forEach((peerId) => {
            if (!connections[peerId] && peerId !== peer.id) {
              // Add a small random delay to avoid connection storms
              setTimeout(() => {
                connectToPeer(peerId);
              }, Math.random() * 1000);
            }
          });
        }
        break;
      default:
        console.log('Unknown data type:', data.type);
    }
  };

  // Send player data to a specific connection
  const sendPlayerData = (conn) => {
    const myPlayer = players[playerId] || {
      id: playerId,
      flashlightOn: true, // Default to flashlight ON if player data is incomplete
    };

    // Log what we're sending
    console.log('Sending player data:', myPlayer);

    conn.send({
      type: 'player-data',
      player: {
        ...myPlayer,
        peerId: peerId, // Include our peer ID
      },
    });
  };

  // Send data to all connections
  const broadcastData = (data) => {
    Object.values(connections).forEach((conn) => {
      if (conn.open) {
        try {
          conn.send(data);
        } catch (err) {
          console.error('Error sending data to peer:', err);
        }
      }
    });
  };

  // Update and broadcast player position
  const updatePosition = (position, rotation) => {
    updatePlayerPosition(playerId, position, rotation);

    broadcastData({
      type: 'player-position',
      playerId: playerId,
      position,
      rotation,
    });
  };

  // Update and broadcast player flashlight state
  const updateFlashlightState = (flashlightOn) => {
    updatePlayerFlashlightState(playerId, flashlightOn);

    broadcastData({
      type: 'player-flashlight',
      playerId: playerId,
      flashlightOn,
    });
  };

  return {
    peer,
    isConnected,
    connectToPeer,
    updatePosition,
    updateFlashlightState,
    connections,
  };
};

export default usePeerConnection;
