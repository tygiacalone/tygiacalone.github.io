import React, { useEffect, useRef, useState } from 'react';
import nipplejs from 'nipplejs';
import { isMobile } from 'react-device-detect';
import { usePlayerControlsContext } from '../contexts/PlayerControlsContext';

const Controls = () => {
  const moveJoystickRef = useRef(null);
  const moveJoystickInstanceRef = useRef(null);
  const lookJoystickRef = useRef(null);
  const lookJoystickInstanceRef = useRef(null);
  const [movementValues, setMovementValues] = useState({
    forward: 0,
    right: 0,
  });

  const {
    moveForward,
    moveBackward,
    moveLeft,
    moveRight,
    updateCameraRotation,
  } = usePlayerControlsContext();

  // Initialize joysticks for mobile devices
  useEffect(() => {
    if (!isMobile) return;

    if (moveJoystickRef.current && !moveJoystickInstanceRef.current) {
      // Movement joystick (left side)
      moveJoystickInstanceRef.current = nipplejs.create({
        zone: moveJoystickRef.current,
        mode: 'semi', // Fixed position with defined zone
        position: { left: '25%', bottom: '25%' },
        color: 'rgba(255, 255, 255, 0.8)',
        size: 120,
        fadeTime: 100,
        restOpacity: 0.4,
        restJoystick: true,
        lockX: false,
        lockY: false,
        dynamicPage: true,
      });

      // Handle movement joystick with analog control
      moveJoystickInstanceRef.current.on('move', (evt, data) => {
        const forward = Math.cos(data.angle.radian) * Math.min(data.force, 1);
        const right = Math.sin(data.angle.radian) * Math.min(data.force, 1);

        // Store normalized vectors for movement
        setMovementValues({ forward, right });

        // Apply movement based on joystick direction and force
        if (forward > 0.1) moveForward(forward);
        else if (forward < -0.1) moveBackward(Math.abs(forward));
        else {
          moveForward(0);
          moveBackward(0);
        }

        if (right > 0.1) moveRight(right);
        else if (right < -0.1) moveLeft(Math.abs(right));
        else {
          moveRight(0);
          moveLeft(0);
        }
      });

      moveJoystickInstanceRef.current.on('end', () => {
        // Reset movement when joystick is released
        setMovementValues({ forward: 0, right: 0 });
        moveForward(0);
        moveBackward(0);
        moveLeft(0);
        moveRight(0);
      });
    }

    if (lookJoystickRef.current && !lookJoystickInstanceRef.current) {
      // Camera/look joystick (right side)
      lookJoystickInstanceRef.current = nipplejs.create({
        zone: lookJoystickRef.current,
        mode: 'semi', // Fixed position with defined zone
        position: { right: '25%', bottom: '25%' },
        color: 'rgba(200, 200, 255, 0.8)',
        size: 120,
        fadeTime: 100,
        restOpacity: 0.4,
        restJoystick: true,
        lockX: false,
        lockY: false,
        dynamicPage: true,
      });

      // Handle camera rotation with analog control
      lookJoystickInstanceRef.current.on('move', (evt, data) => {
        // Calculate rotation based on joystick position and force
        const deltaX =
          Math.sin(data.angle.radian) * Math.min(data.force * 0.05, 0.05);
        const deltaY =
          -Math.cos(data.angle.radian) * Math.min(data.force * 0.03, 0.03);

        // Update camera rotation
        updateCameraRotation(deltaX, deltaY);
      });
    }

    return () => {
      // Clean up joystick instances
      if (moveJoystickInstanceRef.current) {
        moveJoystickInstanceRef.current.destroy();
        moveJoystickInstanceRef.current = null;
      }

      if (lookJoystickInstanceRef.current) {
        lookJoystickInstanceRef.current.destroy();
        lookJoystickInstanceRef.current = null;
      }
    };
  }, [
    isMobile,
    moveForward,
    moveBackward,
    moveLeft,
    moveRight,
    updateCameraRotation,
  ]);

  if (isMobile) {
    return (
      <div className="fixed inset-0 pointer-events-none z-50">
        {/* Movement joystick container */}
        <div
          ref={moveJoystickRef}
          className="absolute left-0 bottom-0 w-1/2 h-1/2 z-50"
          style={{
            pointerEvents: 'auto',
            touchAction: 'none',
          }}
        >
          {/* Visual indicator for joystick base */}
          <div className="absolute left-[25%] bottom-[25%] w-32 h-32 rounded-full bg-black bg-opacity-20 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-white opacity-50"></div>
          </div>
        </div>

        {/* Look/camera joystick container */}
        <div
          ref={lookJoystickRef}
          className="absolute right-0 bottom-0 w-1/2 h-1/2 z-50"
          style={{
            pointerEvents: 'auto',
            touchAction: 'none',
          }}
        >
          {/* Visual indicator for joystick base */}
          <div className="absolute right-[25%] bottom-[25%] w-32 h-32 rounded-full bg-black bg-opacity-20 transform translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-white opacity-50"></div>
          </div>
        </div>

        {/* Mobile controls info */}
        <div className="absolute bottom-4 left-4 p-3 bg-white bg-opacity-80 rounded-lg shadow-lg z-20 pointer-events-auto">
          <h3 className="text-md font-semibold mb-1 text-center">
            Mobile Controls
          </h3>
          <div className="flex justify-between gap-4 text-xs text-center">
            <div>
              <div className="mb-1">Left Joystick</div>
              <div>Movement</div>
            </div>
            <div>
              <div className="mb-1">Right Joystick</div>
              <div>Look/Camera</div>
            </div>
          </div>
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
