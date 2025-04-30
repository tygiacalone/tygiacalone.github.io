import { useEffect, useState, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

const usePlayerControls = () => {
  const [movement, setMovement] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    run: false,
  });

  // Single camera rotation state with euler angles
  const cameraRotation = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const [cameraAngles, setCameraAngles] = useState({ x: 0, y: 0 });

  // Mouse control state
  const isMouseDown = useRef(false);
  const mousePosition = useRef({ x: 0, y: 0 });
  const isPointerLocked = useRef(false);

  // Mobile controls state
  const mobileMovement = useRef({ x: 0, y: 0 });
  const enableMobileControls = useRef(false);

  const { camera, gl } = useThree();

  // Handle keyboard controls
  useEffect(() => {
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

  // Setup mouse controls for click and drag
  useEffect(() => {
    const canvas = gl.domElement;

    const lockPointer = () => {
      canvas.requestPointerLock =
        canvas.requestPointerLock ||
        canvas.mozRequestPointerLock ||
        canvas.webkitRequestPointerLock;

      canvas.requestPointerLock();
    };

    const unlockPointer = () => {
      document.exitPointerLock =
        document.exitPointerLock ||
        document.mozExitPointerLock ||
        document.webkitExitPointerLock;

      document.exitPointerLock();
    };

    const handleMouseDown = () => {
      isMouseDown.current = true;
      lockPointer();
    };

    const handleMouseUp = () => {
      isMouseDown.current = false;
      unlockPointer();
    };

    const handlePointerLockChange = () => {
      isPointerLocked.current =
        document.pointerLockElement === canvas ||
        document.mozPointerLockElement === canvas ||
        document.webkitPointerLockElement === canvas;

      // If pointer lock is exited, make sure we update our mouse down state
      if (!isPointerLocked.current) {
        isMouseDown.current = false;
      }
    };

    const handleMouseMove = (event) => {
      if (!isPointerLocked.current || !isMouseDown.current) return;

      // Get mouse movement (with sensitivity adjustment)
      const sensitivity = 0.002;
      const movementX =
        event.movementX || event.mozMovementX || event.webkitMovementX || 0;
      const movementY =
        event.movementY || event.mozMovementY || event.webkitMovementY || 0;

      // Update the camera rotation state
      cameraRotation.current.y -= movementX * sensitivity;
      cameraRotation.current.x -= movementY * sensitivity;

      // Clamp the vertical rotation to avoid flipping
      cameraRotation.current.x = Math.max(
        -Math.PI / 2 + 0.01,
        Math.min(Math.PI / 2 - 0.01, cameraRotation.current.x),
      );

      // Update the state for other components to use
      setCameraAngles({
        x: cameraRotation.current.x,
        y: cameraRotation.current.y,
      });
    };

    // Add event listeners
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('mozpointerlockchange', handlePointerLockChange);
    document.addEventListener(
      'webkitpointerlockchange',
      handlePointerLockChange,
    );
    document.addEventListener('mousemove', handleMouseMove);

    // Handle mouse up event outside canvas (in case user drags out of canvas)
    document.addEventListener('mouseup', handleMouseUp);

    // Check if device is mobile
    const checkMobile = () => {
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        );
      enableMobileControls.current = isMobile;
    };

    checkMobile();

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener(
        'pointerlockchange',
        handlePointerLockChange,
      );
      document.removeEventListener(
        'mozpointerlockchange',
        handlePointerLockChange,
      );
      document.removeEventListener(
        'webkitpointerlockchange',
        handlePointerLockChange,
      );
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      // Make sure to unlock pointer when unmounting
      if (isPointerLocked.current) {
        unlockPointer();
      }
    };
  }, [gl]);

  // Apply camera rotation
  useEffect(() => {
    if (camera) {
      camera.rotation.copy(cameraRotation.current);
    }
  }, [cameraAngles, camera]);

  // Process mobile joystick input
  useEffect(() => {
    if (!enableMobileControls.current) return;

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

  // Methods for mobile controls
  const handleMobileMove = (x, y) => {
    mobileMovement.current = { x, y };
  };

  const handleMobileLook = (deltaX, deltaY) => {
    // Update camera rotation based on touch movement
    cameraRotation.current.y -= deltaX;
    cameraRotation.current.x -= deltaY;

    // Clamp vertical rotation
    cameraRotation.current.x = Math.max(
      -Math.PI / 2 + 0.01,
      Math.min(Math.PI / 2 - 0.01, cameraRotation.current.x),
    );

    // Update angles
    setCameraAngles({
      x: cameraRotation.current.x,
      y: cameraRotation.current.y,
    });
  };

  const handleMobileJump = () => {
    setMovement((m) => ({ ...m, jump: true }));
    // Reset jump after a short delay
    setTimeout(() => {
      setMovement((m) => ({ ...m, jump: false }));
    }, 200);
  };

  return {
    movement,
    cameraView: cameraAngles,
    handleMobileMove,
    handleMobileLook,
    handleMobileJump,
    isMobile: enableMobileControls.current,
  };
};

export default usePlayerControls;
