import React, { createContext, useContext, useState, useRef } from 'react';
import { isMobile } from 'react-device-detect';

const PlayerControlsContext = createContext(null);

export const PlayerControlsProvider = ({ children }) => {
  const [movement, setMovement] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    run: false,
  });

  // For mobile controls
  const mobileMovement = useRef({ x: 0, y: 0 });

  // Additional functions for joystick control in Controls component
  const moveForward = (force) => {
    if (force > 0) {
      mobileMovement.current.y = force;
    } else if (mobileMovement.current.y > 0) {
      mobileMovement.current.y = 0;
    }
  };

  const moveBackward = (force) => {
    if (force > 0) {
      mobileMovement.current.y = -force;
    } else if (mobileMovement.current.y < 0) {
      mobileMovement.current.y = 0;
    }
  };

  const moveLeft = (force) => {
    if (force > 0) {
      mobileMovement.current.x = -force;
    } else if (mobileMovement.current.x < 0) {
      mobileMovement.current.x = 0;
    }
  };

  const moveRight = (force) => {
    if (force > 0) {
      mobileMovement.current.x = force;
    } else if (mobileMovement.current.x > 0) {
      mobileMovement.current.x = 0;
    }
  };

  // Handle keyboard controls
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent default behavior for game controls
      if (['w', 'a', 's', 'd', ' ', 'Shift'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }

      switch (e.key.toLowerCase()) {
        case 'w':
          setMovement((m) => ({ ...m, forward: true }));
          break;
        case 's':
          setMovement((m) => ({ ...m, backward: true }));
          break;
        case 'a':
          setMovement((m) => ({ ...m, left: true }));
          break;
        case 'd':
          setMovement((m) => ({ ...m, right: true }));
          break;
        case ' ':
          setMovement((m) => ({ ...m, jump: true }));
          break;
        case 'shift':
          setMovement((m) => ({ ...m, run: true }));
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (e) => {
      switch (e.key.toLowerCase()) {
        case 'w':
          setMovement((m) => ({ ...m, forward: false }));
          break;
        case 's':
          setMovement((m) => ({ ...m, backward: false }));
          break;
        case 'a':
          setMovement((m) => ({ ...m, left: false }));
          break;
        case 'd':
          setMovement((m) => ({ ...m, right: false }));
          break;
        case ' ':
          setMovement((m) => ({ ...m, jump: false }));
          break;
        case 'shift':
          setMovement((m) => ({ ...m, run: false }));
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Process mobile joystick input
  React.useEffect(() => {
    if (!isMobile) return;

    // Update movement based on mobile joystick
    const updateMovement = () => {
      // Calculate forward/backward movement
      if (mobileMovement.current.y > 0.2) {
        setMovement((m) => ({ ...m, forward: true, backward: false }));
      } else if (mobileMovement.current.y < -0.2) {
        setMovement((m) => ({ ...m, forward: false, backward: true }));
      } else {
        setMovement((m) => ({ ...m, forward: false, backward: false }));
      }

      // Calculate left/right movement
      if (mobileMovement.current.x < -0.2) {
        setMovement((m) => ({ ...m, left: true, right: false }));
      } else if (mobileMovement.current.x > 0.2) {
        setMovement((m) => ({ ...m, left: false, right: true }));
      } else {
        setMovement((m) => ({ ...m, left: false, right: false }));
      }
    };

    const interval = setInterval(updateMovement, 16); // 60fps update rate

    return () => clearInterval(interval);
  }, []);

  const controls = {
    movement,
    moveForward,
    moveBackward,
    moveLeft,
    moveRight,
    mobileMovement: mobileMovement.current,
  };

  return (
    <PlayerControlsContext.Provider value={controls}>
      {children}
    </PlayerControlsContext.Provider>
  );
};

export const usePlayerControlsContext = () => {
  const context = useContext(PlayerControlsContext);
  if (!context) {
    throw new Error(
      'usePlayerControlsContext must be used within a PlayerControlsProvider',
    );
  }
  return context;
};
