import React, { useEffect, useRef } from 'react';
import nipplejs from 'nipplejs';
import { isMobile } from 'react-device-detect';
import { usePlayerControlsContext } from '../contexts/PlayerControlsContext';

const Controls = () => {
  const joystickContainerRef = useRef(null);
  const joystickInstanceRef = useRef(null);
  const { moveForward, moveBackward, moveLeft, moveRight } =
    usePlayerControlsContext();

  useEffect(() => {
    if (
      isMobile &&
      joystickContainerRef.current &&
      !joystickInstanceRef.current
    ) {
      // Create joystick for mobile controls
      joystickInstanceRef.current = nipplejs.create({
        zone: joystickContainerRef.current,
        mode: 'static',
        position: { left: '50%', top: '50%' },
        color: 'white',
        size: 100,
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
        // Stop all movement when joystick is released
        moveForward(0);
        moveBackward(0);
        moveLeft(0);
        moveRight(0);
      });
    }

    return () => {
      if (joystickInstanceRef.current) {
        joystickInstanceRef.current.destroy();
        joystickInstanceRef.current = null;
      }
    };
  }, [isMobile, moveForward, moveBackward, moveLeft, moveRight]);

  if (isMobile) {
    return (
      <div className="fixed inset-0 pointer-events-none z-50">
        {/* View control area */}
        <div
          className="absolute top-0 left-0 w-full h-[60%] z-50"
          style={{
            touchAction: 'none',
            pointerEvents: 'auto',
          }}
        />

        {/* Joystick container */}
        <div
          ref={joystickContainerRef}
          className="absolute bottom-16 left-16 w-32 h-32 rounded-full bg-white bg-opacity-20 z-50"
          style={{
            pointerEvents: 'auto',
          }}
        />

        {/* Mobile controls info */}
        <div className="absolute top-4 right-4 p-3 bg-black bg-opacity-50 rounded-lg text-white text-xs z-50 pointer-events-none">
          <p>Drag left side to move</p>
          <p>Drag right side to look</p>
          <p>Tap for flashlight (F)</p>
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
