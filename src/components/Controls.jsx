import React, { useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { usePlayerControlsContext } from '../contexts/PlayerControlsContext';

const Controls = () => {
  const lookAreaRef = useRef(null);
  const [lastTouchPosition, setLastTouchPosition] = useState({ x: 0, y: 0 });
  const [lookActive, setLookActive] = useState(false);

  const { moveForward, updateCameraRotation, toggleRun } =
    usePlayerControlsContext();

  // Handle mobile look controls
  const handleTouchStart = (event) => {
    if (!isMobile) return;

    // Check if touch is on walk button area and ignore if it is
    if (isWalkButtonTouch(event) || isRunButtonTouch(event)) return;

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

  // Handle walk button press/release
  const handleWalkButtonPress = () => {
    console.log('Walk button pressed');
    moveForward(1);
  };

  const handleWalkButtonRelease = () => {
    console.log('Walk button released');
    moveForward(0);
  };

  // Handle run button press/release
  const handleRunButtonPress = () => {
    console.log('Run button pressed');
    moveForward(1);
    toggleRun(true);
  };

  const handleRunButtonRelease = () => {
    console.log('Run button released');
    moveForward(0);
    toggleRun(false);
  };

  // Helper function to determine if a touch is on the walk button
  const isWalkButtonTouch = (event) => {
    const walkButtonElement = document.getElementById('walk-button');
    if (!walkButtonElement) return false;

    const touch = event.touches[0];
    const buttonRect = walkButtonElement.getBoundingClientRect();

    return (
      touch.clientX >= buttonRect.left &&
      touch.clientX <= buttonRect.right &&
      touch.clientY >= buttonRect.top &&
      touch.clientY <= buttonRect.bottom
    );
  };

  // Helper function to determine if a touch is on the run button
  const isRunButtonTouch = (event) => {
    const runButtonElement = document.getElementById('run-button');
    if (!runButtonElement) return false;

    const touch = event.touches[0];
    const buttonRect = runButtonElement.getBoundingClientRect();

    return (
      touch.clientX >= buttonRect.left &&
      touch.clientX <= buttonRect.right &&
      touch.clientY >= buttonRect.top &&
      touch.clientY <= buttonRect.bottom
    );
  };

  // Prevent propagation of touch events from walk button to the look area
  const handleWalkButtonTouch = (event) => {
    // Stop propagation to prevent the look area from handling this touch
    event.stopPropagation();
  };

  // Prevent propagation of touch events from run button to the look area
  const handleRunButtonTouch = (event) => {
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
          {/* Run button - smaller and above walk button */}
          <div
            id="run-button"
            className="absolute bottom-56 left-6 w-20 h-20 rounded-full bg-yellow-400 bg-opacity-50 flex items-center justify-center z-50 active:bg-opacity-70 select-none"
            onTouchStart={(e) => {
              handleRunButtonTouch(e);
              handleRunButtonPress();
            }}
            onTouchEnd={(e) => {
              handleRunButtonTouch(e);
              handleRunButtonRelease();
            }}
            onTouchCancel={(e) => {
              handleRunButtonTouch(e);
              handleRunButtonRelease();
            }}
          >
            <span className="text-sm font-bold text-black">RUN</span>
          </div>

          {/* Walk button - higher z-index to ensure it receives touches */}
          <div
            id="walk-button"
            className="absolute bottom-28 left-4 w-24 h-24 rounded-full bg-white bg-opacity-40 flex items-center justify-center z-50 active:bg-opacity-60 select-none"
            onTouchStart={(e) => {
              handleWalkButtonTouch(e);
              handleWalkButtonPress();
            }}
            onTouchEnd={(e) => {
              handleWalkButtonTouch(e);
              handleWalkButtonRelease();
            }}
            onTouchCancel={(e) => {
              handleWalkButtonTouch(e);
              handleWalkButtonRelease();
            }}
          >
            <span className="text-lg font-bold text-black">WALK</span>
          </div>

          {/* Mobile controls info */}

          <div className="p-3 bg-white bg-opacity-80 rounded-lg shadow-lg z-20 pointer-events-auto">
            <h3 className="text-md font-semibold mb-1">Controls:</h3>
            <p>Hold WALK button to move forward</p>
            <p>Hold RUN button to sprint forward</p>
            <p>Drag anywhere to look around</p>
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
