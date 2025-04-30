import { useEffect, useState, useRef } from 'react';
import Peer from 'peerjs';
import useGameStore from '../store/gameStore';
import { nanoid } from 'nanoid';

// Simple discovery server using broadcast channel for players on the same domain
// This helps discover players without manual connection
const DISCOVERY_CHANNEL = 'forest-game-discovery';
const broadcastChannel =
  typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel(DISCOVERY_CHANNEL)
    : null;

const usePeerConnection = () => {
  const [peer, setPeer] = useState(null);
  const [connections, setConnections] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [tabId] = useState(() => nanoid()); // Generate a unique ID for this tab
  const connectionAttempts = useRef(0);
  const maxConnectionAttempts = 3;
  const discoveredPeers = useRef(new Set());

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

  // Setup broadcast channel for discovery
  useEffect(() => {
    if (!broadcastChannel) return;

    // Announce self when connected
    const announcePresence = () => {
      if (peer && peer.id) {
        console.log('Announcing presence to other tabs/windows');
        broadcastChannel.postMessage({
          type: 'peer-announce',
          peerId: peer.id,
        });
      }
    };

    // Listen for other peer announcements
    const handleDiscovery = (event) => {
      if (event.data.type === 'peer-announce' && peer && peer.id) {
        const discoveredPeerId = event.data.peerId;

        // Don't connect to self or already connected peers
        if (
          discoveredPeerId !== peer.id &&
          !discoveredPeers.current.has(discoveredPeerId)
        ) {
          console.log(`Discovered peer: ${discoveredPeerId}`);
          discoveredPeers.current.add(discoveredPeerId);

          // Connect to the discovered peer after a small random delay
          // This helps prevent connection race conditions
          setTimeout(() => {
            connectToPeer(discoveredPeerId);
          }, Math.random() * 1000);
        }
      }
    };

    // Regularly announce presence to help with discovery
    const announceInterval = setInterval(announcePresence, 5000);
    broadcastChannel.addEventListener('message', handleDiscovery);

    // Initial announcement
    if (peer && peer.id) {
      announcePresence();
    }

    return () => {
      clearInterval(announceInterval);
      broadcastChannel.removeEventListener('message', handleDiscovery);
    };
  }, [peer]);

  // Initialize peer connection with unique tab ID and reconnection logic
  useEffect(() => {
    let newPeer = null;
    let reconnectTimeout = null;

    const initializePeer = () => {
      if (connectionAttempts.current >= maxConnectionAttempts) {
        console.warn('Max connection attempts reached, giving up');
        return;
      }

      connectionAttempts.current += 1;
      const peerIdWithTab = `${playerId}-${tabId}`;

      try {
        // Cleanup previous peer if exists
        if (newPeer) {
          newPeer.destroy();
        }

        // Create new peer with options
        newPeer = new Peer(peerIdWithTab, {
          debug: 2, // Reduce debug level
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' },
            ],
          },
        });

        newPeer.on('open', (id) => {
          console.log('My peer ID is: ', id);
          setPeer(newPeer);
          setIsConnected(true);
          connectionAttempts.current = 0; // Reset counter on successful connection

          // Announce presence when connected
          if (broadcastChannel) {
            broadcastChannel.postMessage({
              type: 'peer-announce',
              peerId: id,
            });
          }
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

    // Start the initial connection
    initializePeer();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }

      if (newPeer) {
        try {
          newPeer.destroy();
        } catch (err) {
          console.error('Error destroying peer on cleanup:', err);
        }
      }
    };
  }, [playerId, tabId]);

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
        if (id !== playerId && id !== conn.peer) {
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
        removePlayer(conn.peer);
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
        addPlayer(senderId, { ...data.player, id: senderId });
        break;
      case 'player-position':
        updatePlayerPosition(senderId, data.position, data.rotation);
        break;
      case 'player-flashlight':
        updatePlayerFlashlightState(senderId, data.flashlightOn);
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
      player: myPlayer,
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
      position,
      rotation,
    });
  };

  // Update and broadcast player flashlight state
  const updateFlashlightState = (flashlightOn) => {
    updatePlayerFlashlightState(playerId, flashlightOn);

    broadcastData({
      type: 'player-flashlight',
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
