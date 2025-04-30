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
        mode: 'static',
        position: { left: '50%', top: '50%' },
        color: 'white',
        size: 100,
        fadeTime: 100, // Smooth fade on release
        restOpacity: 0.5, // Slightly visible when not active
      });

      // Handle joystick events
      joystickInstanceRef.current.on('move', (evt, data) => {
        const angle = data.angle.radian;
        const force = Math.min(data.force, 1);

        // Reset all movement
        moveForward(0);
        moveBackward(0);
        moveLeft(0);
        moveRight(0);

        // Apply movement based on joystick direction
        if (angle >= Math.PI * 0.75 && angle < Math.PI * 1.25) {
          // Left
          moveLeft(force);
        } else if (angle >= Math.PI * 1.25 && angle < Math.PI * 1.75) {
          // Down
          moveBackward(force);
        } else if (angle >= Math.PI * 1.75 || angle < Math.PI * 0.25) {
          // Right
          moveRight(force);
        } else if (angle >= Math.PI * 0.25 && angle < Math.PI * 0.75) {
          // Up
          moveForward(force);
        }
      });

      joystickInstanceRef.current.on('end', () => {
        // Smoothly stop all movement when joystick is released
        moveForward(0);
        moveBackward(0);
        moveLeft(0);
        moveRight(0);

        console.log('Joystick released, stopping movement');
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

    // Check if touch is on joystick area and ignore if it is
    if (isJoystickTouch(event)) return;

    console.log('Look touch start detected');
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

    console.log('Look move: ', { deltaX, deltaY });

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

  const handleTouchEnd = (event) => {
    console.log('Look touch end');
    setLookActive(false);

    // Prevent default to avoid accidental clicks
    event.preventDefault();
  };

  // Helper function to determine if a touch is on the joystick
  const isJoystickTouch = (event) => {
    if (!joystickContainerRef.current) return false;

    const touch = event.touches[0];
    const joystickRect = joystickContainerRef.current.getBoundingClientRect();

    return (
      touch.clientX >= joystickRect.left &&
      touch.clientX <= joystickRect.right &&
      touch.clientY >= joystickRect.top &&
      touch.clientY <= joystickRect.bottom
    );
  };

  // Prevent propagation of touch events from joystick to the look area
  const handleJoystickTouch = (event) => {
    // Stop propagation to prevent the look area from handling this touch
    event.stopPropagation();
  };

  if (isMobile) {
    return (
      <>
        {/* Fullscreen view control area */}
        <div
          ref={lookAreaRef}
          className="fixed inset-0 w-full h-full z-30 touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        />

        <div className="absolute bottom-4 left-4 z-50">
          {/* Joystick container - higher z-index to ensure it receives touches */}
          <div
            ref={joystickContainerRef}
            className="absolute bottom-28 left-4 w-32 h-32 rounded-full bg-white bg-opacity-20 z-50"
            onTouchStart={handleJoystickTouch}
            onTouchMove={handleJoystickTouch}
            onTouchEnd={handleJoystickTouch}
          />

          {/* Mobile controls info */}
          <div className="p-3 bg-white bg-opacity-80 rounded-lg shadow-lg z-20 pointer-events-auto">
            <p>Drag joystick to move</p>
            <p>Drag anywhere to look around</p>
            <p>Tap for flashlight (F)</p>
          </div>
        </div>
      </>
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
