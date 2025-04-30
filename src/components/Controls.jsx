import React, { useEffect, useRef, useState } from 'react';
import nipplejs from 'nipplejs';
import { isMobile } from 'react-device-detect';
import { usePlayerControlsContext } from '../contexts/PlayerControlsContext';

const Controls = () => {
  const joystickContainerRef = useRef(null);
  const joystickInstanceRef = useRef(null);
  const lookAreaRef = useRef(null);
  const [lastTouchPosition, setLastTouchPosition] = useState({ x: 0, y: 0 });
  const [lookActive, setLookActive] = useState(false);

  const {
    moveForward,
    moveBackward,
    moveLeft,
    moveRight,
    updateCameraRotation,
  } = usePlayerControlsContext();

  // Handle joystick for movement controls
  useEffect(() => {
    if (
      isMobile &&
      joystickContainerRef.current &&
      !joystickInstanceRef.current
    ) {
      console.log('Creating mobile joystick');

      // Create joystick for mobile controls
      joystickInstanceRef.current = nipplejs.create({
        zone: joystickContainerRef.current,
        mode: 'dynamic', // Changed from static to dynamic for reset behavior
        position: { left: '50%', top: '50%' },
        color: 'white',
        size: 120, // Increased size for better control
        fadeTime: 100, // Smooth fade on release
        restOpacity: 0.5, // Slightly visible when not active
        restJoystick: true, // Ensures joystick returns to center on release
        lockX: false, // Allow full X-axis movement
        lockY: false, // Allow full Y-axis movement
      });

      // Handle joystick events
      joystickInstanceRef.current.on('move', (evt, data) => {
        const angle = data.angle.radian;
        const force = Math.min(data.force, 1);

        // Calculate directional vectors based on joystick angle
        const forwardAmount = Math.cos(angle - Math.PI / 2) * force;
        const rightAmount = Math.cos(angle) * force;

        // Apply movements with proper vector calculations
        // This allows for diagonal movement by combining directions
        if (forwardAmount > 0) {
          moveForward(forwardAmount);
        } else if (forwardAmount < 0) {
          moveBackward(-forwardAmount);
        } else {
          // Reset forward/backward if not actively moving in that direction
          moveForward(0);
          moveBackward(0);
        }

        if (rightAmount > 0) {
          moveRight(rightAmount);
        } else if (rightAmount < 0) {
          moveLeft(-rightAmount);
        } else {
          // Reset left/right if not actively moving in that direction
          moveLeft(0);
          moveRight(0);
        }
      });

      joystickInstanceRef.current.on('end', () => {
        // Immediately stop all movement when joystick is released
        moveForward(0);
        moveBackward(0);
        moveLeft(0);
        moveRight(0);

        console.log('Joystick released, stopping movement');
      });

      // Handle start event to ensure proper reset
      joystickInstanceRef.current.on('start', () => {
        console.log('Joystick touch started');
      });
    }

    return () => {
      if (joystickInstanceRef.current) {
        joystickInstanceRef.current.destroy();
        joystickInstanceRef.current = null;
      }
    };
  }, [isMobile, moveForward, moveBackward, moveLeft, moveRight]);

  // Handle mobile look controls
  const handleTouchStart = (event) => {
    if (!isMobile) return;

    const touch = event.touches[0];
    setLastTouchPosition({
      x: touch.clientX,
      y: touch.clientY,
    });
    setLookActive(true);

    // Prevent default to avoid scrolling
    event.preventDefault();
  };

  const handleTouchMove = (event) => {
    if (!isMobile || !lookActive) return;

    const touch = event.touches[0];
    const currentX = touch.clientX;
    const currentY = touch.clientY;

    // Calculate movement delta
    const deltaX = (currentX - lastTouchPosition.x) * 0.005; // Adjust sensitivity
    const deltaY = (currentY - lastTouchPosition.y) * 0.005;

    // Update camera rotation through context
    updateCameraRotation(-deltaX, -deltaY);

    // Update last position
    setLastTouchPosition({
      x: currentX,
      y: currentY,
    });

    // Prevent default to avoid scrolling
    event.preventDefault();
  };

  const handleTouchEnd = () => {
    setLookActive(false);
  };

  if (isMobile) {
    return (
      <div className="fixed inset-0 pointer-events-none z-50">
        {/* View control area */}
        <div
          ref={lookAreaRef}
          className="absolute top-0 left-0 w-full h-[60%] z-50"
          style={{
            touchAction: 'none',
            pointerEvents: 'auto',
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        />

        {/* Joystick container */}
        <div
          ref={joystickContainerRef}
          className="absolute bottom-24 left-24 w-40 h-40 rounded-full bg-white bg-opacity-20 z-50"
          style={{
            pointerEvents: 'auto',
          }}
        />

        {/* Mobile controls info */}

        <div className="absolute bottom-4 left-4 p-3 bg-white bg-opacity-80 rounded-lg shadow-lg z-20 pointer-events-auto">
          <h3 className="text-md font-semibold mb-1">Controls:</h3>
          <ul className="text-sm space-y-1">
            <p>Use joystick to move</p>
            <p>Drag anywhere else to look around</p>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute bottom-4 left-4 p-3 bg-white bg-opacity-80 rounded-lg shadow-lg z-20 pointer-events-auto">
      <h3 className="text-md font-semibold mb-1">Controls:</h3>
      <ul className="text-xs space-y-1">
        <li>
          <strong>W/S</strong> - Move forward/backward
        </li>
        <li>
          <strong>A/D</strong> - Rotate player left/right
        </li>
        <li>
          <strong>MOUSE</strong> - Look around (free camera)
        </li>
        <li>
          <strong>SPACE</strong> - Jump
        </li>
        <li>
          <strong>SHIFT</strong> - Run
        </li>
        <li>
          <strong>F</strong> - Toggle flashlight
        </li>
      </ul>
    </div>
  );
};

export default Controls;
