import React, { useState, useEffect, useRef } from 'react';

const MobileControls = ({ onMove, onLook, onJump, onFlashlight }) => {
  const [showControls, setShowControls] = useState(false);
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
  const [baseJoystickPosition, setBaseJoystickPosition] = useState({
    x: 0,
    y: 0,
  });
  const [lookActive, setLookActive] = useState(false);
  const [lastTouchPosition, setLastTouchPosition] = useState({ x: 0, y: 0 });

  const joystickRef = useRef(null);
  const lookAreaRef = useRef(null);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        );
      setShowControls(isMobile);
    };

    // Check immediately
    checkMobile();

    // Also check on resize in case of device rotation
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Handle joystick touch start
  const handleJoystickStart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    setJoystickActive(true);
    setBaseJoystickPosition({
      x: touch.clientX,
      y: touch.clientY,
    });
    setJoystickPosition({
      x: 0,
      y: 0,
    });
  };

  // Handle joystick movement
  const handleJoystickMove = (e) => {
    if (!joystickActive) return;
    e.preventDefault();

    const touch = e.touches[0];
    const deltaX = touch.clientX - baseJoystickPosition.x;
    const deltaY = touch.clientY - baseJoystickPosition.y;

    // Limit joystick movement radius
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxRadius = 50;
    const scale = distance > maxRadius ? maxRadius / distance : 1;

    const normalizedX = deltaX * scale;
    const normalizedY = deltaY * scale;

    setJoystickPosition({
      x: normalizedX,
      y: normalizedY,
    });

    // Calculate movement values (-1 to 1)
    const moveX = normalizedX / maxRadius;
    const moveY = -normalizedY / maxRadius; // Invert Y for forward/backward

    // Send movement to parent component
    onMove(moveX, moveY);
  };

  // Handle joystick touch end
  const handleJoystickEnd = (e) => {
    e.preventDefault();
    setJoystickActive(false);
    setJoystickPosition({ x: 0, y: 0 });
    // Stop movement
    onMove(0, 0);
  };

  // Handle look area touch start
  const handleLookStart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    setLookActive(true);
    setLastTouchPosition({
      x: touch.clientX,
      y: touch.clientY,
    });
  };

  // Handle look area movement
  const handleLookMove = (e) => {
    if (!lookActive) return;
    e.preventDefault();

    const touch = e.touches[0];
    const deltaX = touch.clientX - lastTouchPosition.x;
    const deltaY = touch.clientY - lastTouchPosition.y;

    // Adjust sensitivity based on device orientation
    const isLandscape = window.innerWidth > window.innerHeight;
    const sensitivityX = isLandscape ? 0.003 : 0.005;
    const sensitivityY = isLandscape ? 0.003 : 0.005;

    // Send look data to parent
    onLook(deltaX * sensitivityX, deltaY * sensitivityY);

    setLastTouchPosition({
      x: touch.clientX,
      y: touch.clientY,
    });
  };

  // Handle look area touch end
  const handleLookEnd = (e) => {
    e.preventDefault();
    setLookActive(false);
  };

  // Handle jump button with haptic feedback if available
  const handleJump = () => {
    // Attempt to trigger haptic feedback if available
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50); // Short vibration
    }
    onJump();
  };

  // Handle flashlight button with haptic feedback
  const handleFlashlight = () => {
    // Attempt to trigger haptic feedback if available
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(100); // Longer vibration for flashlight
    }
    onFlashlight();
  };

  if (!showControls) return null;

  return (
    <div
      className="mobile-controls"
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1000,
        touchAction: 'none', // Prevent browser handling of touch events
      }}
    >
      {/* Joystick area - left side */}
      <div
        ref={joystickRef}
        style={{
          position: 'absolute',
          bottom: '40px',
          left: '40px',
          width: '120px',
          height: '120px',
          borderRadius: '60px',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          pointerEvents: 'auto',
          touchAction: 'none',
        }}
        onTouchStart={handleJoystickStart}
        onTouchMove={handleJoystickMove}
        onTouchEnd={handleJoystickEnd}
        onTouchCancel={handleJoystickEnd}
      >
        {/* Joystick handle */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${joystickPosition.x}px), calc(-50% + ${joystickPosition.y}px))`,
            width: '50px',
            height: '50px',
            borderRadius: '25px',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.3)',
          }}
        />
      </div>

      {/* Action buttons - bottom right */}
      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          right: '40px',
          display: 'flex',
          gap: '20px',
        }}
      >
        {/* Jump button */}
        <button
          style={{
            width: '70px',
            height: '70px',
            borderRadius: '35px',
            backgroundColor: 'rgba(0, 100, 255, 0.7)',
            border: '2px solid rgba(255, 255, 255, 0.5)',
            color: 'white',
            fontSize: '14px',
            fontWeight: 'bold',
            pointerEvents: 'auto',
            touchAction: 'none',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
          }}
          onTouchStart={handleJump}
        >
          JUMP
        </button>

        {/* Flashlight button */}
        <button
          style={{
            width: '70px',
            height: '70px',
            borderRadius: '35px',
            backgroundColor: 'rgba(255, 200, 0, 0.7)',
            border: '2px solid rgba(255, 255, 255, 0.5)',
            color: 'white',
            fontSize: '14px',
            fontWeight: 'bold',
            pointerEvents: 'auto',
            touchAction: 'none',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
          }}
          onTouchStart={handleFlashlight}
        >
          LIGHT
        </button>
      </div>

      {/* Look area - right side */}
      <div
        ref={lookAreaRef}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '65%',
          height: '70%',
          pointerEvents: 'auto',
          touchAction: 'none',
          // Add a subtle indicator in debug mode
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
        }}
        onTouchStart={handleLookStart}
        onTouchMove={handleLookMove}
        onTouchEnd={handleLookEnd}
        onTouchCancel={handleLookEnd}
      />
    </div>
  );
};

export default MobileControls;
