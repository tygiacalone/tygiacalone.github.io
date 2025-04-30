import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';

// Static counter to generate unique IDs and track created obelisks
const createdObelisks = new Set();

// Resume URL - Google Docs link
const RESUME_URL =
  'https://docs.google.com/document/d/1yArxUS0Yo0nNJ6fuuolZ6AsEmuvF0XITGVp6HdU1mVA/edit?usp=sharing';

// Spawn position coordinates - center of the world
const SPAWN_POSITION = new THREE.Vector3(0, 0, 0);

const Obelisk = ({ position = [0, 0, 0] }) => {
  const bookRef = useRef();
  const baseRef = useRef();
  const glowRef = useRef();
  const pagesRef = useRef();
  const coverRef = useRef();
  const textGroupRef = useRef();
  const particlesRef = useRef();
  const collisionRadiusRef = useRef(1.5); // Collision radius for "walking into" functionality
  const { camera, raycaster, mouse, scene, gl } = useThree();

  // Store the initial position in a ref to avoid reacting to prop changes
  const initialPositionRef = useRef(position);

  // Generate a unique ID for this book instance
  const obeliskId = useRef(`book-${initialPositionRef.current.join(',')}`);

  // Track when the book was created
  const creationTimeRef = useRef(Date.now());
  const [hovered, setHovered] = useState(false);
  const [lastCollisionCheck, setLastCollisionCheck] = useState(0); // Prevent too frequent collision checks
  const [bookOpened, setBookOpened] = useState(false);

  // Floating animation values
  const floatOffset = useRef(Math.random() * Math.PI * 2);
  const floatHeight = useRef(0.3 + Math.random() * 0.2);
  const floatSpeed = useRef(0.5 + Math.random() * 0.3);

  // Particle system for magical effect
  const particles = useRef([]);

  // Setup particles
  useEffect(() => {
    if (!particlesRef.current) return;

    // Create particle system
    particles.current = Array(50)
      .fill()
      .map(() => ({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 3,
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02,
        ),
        size: Math.random() * 0.08 + 0.02,
        color: new THREE.Color(
          0.5 + Math.random() * 0.5,
          0.8 + Math.random() * 0.2,
          0.9 + Math.random() * 0.1,
        ),
      }));

    // Create geometry and material
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particles.current.length * 3);
    const colors = new Float32Array(particles.current.length * 3);
    const sizes = new Float32Array(particles.current.length);

    // Setup initial positions
    for (let i = 0; i < particles.current.length; i++) {
      const i3 = i * 3;
      positions[i3] = particles.current[i].position.x;
      positions[i3 + 1] = particles.current[i].position.y;
      positions[i3 + 2] = particles.current[i].position.z;

      colors[i3] = particles.current[i].color.r;
      colors[i3 + 1] = particles.current[i].color.g;
      colors[i3 + 2] = particles.current[i].color.b;

      sizes[i] = particles.current[i].size;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    const pointsSystem = new THREE.Points(geometry, material);
    particlesRef.current.add(pointsSystem);
  }, []);

  // Function to teleport player to spawn point
  const teleportToSpawn = () => {
    console.log('Teleporting player to spawn point...');
    setBookOpened(true);

    // Get current player position to calculate teleport effect direction
    const playerPosition = new THREE.Vector3();
    camera.getWorldPosition(playerPosition);

    // Update camera position to spawn point
    camera.position.copy(SPAWN_POSITION);

    // Reset book state after a delay
    setTimeout(() => setBookOpened(false), 1000);
  };

  // Console log to debug - only run once per unique position
  useEffect(() => {
    // Check if this book was already created
    if (createdObelisks.has(obeliskId.current)) {
      return; // Skip if already created
    }

    // Add to set of created books
    createdObelisks.add(obeliskId.current);

    console.log('Book created at position:', initialPositionRef.current);

    // Debug marker (invisible in production)
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.5,
      visible: false, // Set to true for debugging
    });
    const sphere = new THREE.Mesh(geometry, material);
    const pos = initialPositionRef.current;
    sphere.position.set(pos[0], pos[1] + 0.2, pos[2]);
    scene.add(sphere);

    return () => {
      scene.remove(sphere);
      // Don't remove from createdObelisks to prevent recreation if component remounts
    };
  }, []); // Run only once on mount

  // Handle mouse clicks
  useEffect(() => {
    const handleClick = () => {
      // Raycast to see if book is clicked
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
      const intersects = raycaster.intersectObject(bookRef.current, true);

      if (intersects.length > 0) {
        console.log('Book clicked!');
        teleportToSpawn();
      }
    };

    // Add event listener
    const canvas = gl.domElement;
    canvas.addEventListener('click', handleClick);

    return () => {
      canvas.removeEventListener('click', handleClick);
    };
  }, [camera, raycaster, gl]);

  // Animation and lifecycle
  useFrame((state, delta) => {
    if (!bookRef.current) return;

    // Floating animation
    const floatY =
      Math.sin(
        state.clock.elapsedTime * floatSpeed.current + floatOffset.current,
      ) * floatHeight.current;
    bookRef.current.position.y = initialPositionRef.current[1] + floatY + 1.5;

    // Gentle rotation - rotate faster when hovered
    bookRef.current.rotation.y += delta * (hovered ? 0.5 : 0.1);

    // Add slight wobble
    bookRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;

    // Book opening effect
    if (coverRef.current) {
      // If book is opened, animate the cover
      if (bookOpened) {
        coverRef.current.rotation.y = THREE.MathUtils.lerp(
          coverRef.current.rotation.y,
          -Math.PI * 0.4, // Open position
          0.2,
        );
      } else {
        coverRef.current.rotation.y = THREE.MathUtils.lerp(
          coverRef.current.rotation.y,
          0, // Closed position
          0.1,
        );
      }
    }

    // Pulse glow effect
    if (glowRef.current && glowRef.current.material) {
      const pulseIntensity = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
      glowRef.current.material.opacity = 0.7 * pulseIntensity;

      // Make glow more intense when hovered
      if (hovered) {
        glowRef.current.material.opacity = 0.9;
        glowRef.current.scale.set(1.1, 1.1, 1.1);
      } else {
        glowRef.current.scale.set(1.0, 1.0, 1.0);
      }
    }

    // Animate base ring
    if (baseRef.current) {
      baseRef.current.rotation.z += delta * 0.5;

      // Pulse the base
      const baseScale = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
      baseRef.current.scale.set(baseScale, baseScale, 1);

      // Make base more intense when hovered
      if (hovered) {
        baseRef.current.material.opacity = 0.9;
        baseRef.current.material.emissiveIntensity = 2.0;
      } else {
        baseRef.current.material.opacity = 0.7;
        baseRef.current.material.emissiveIntensity = 1.0;
      }
    }

    // Animate particles
    if (particlesRef.current && particlesRef.current.children.length > 0) {
      const positions =
        particlesRef.current.children[0].geometry.attributes.position;

      for (let i = 0; i < particles.current.length; i++) {
        const i3 = i * 3;
        const particle = particles.current[i];

        // Move particles in small circular orbits around the book
        const angle = state.clock.elapsedTime * 0.5 + i * 0.1;
        const radius = 0.8 + Math.sin(i + state.clock.elapsedTime * 0.2) * 0.3;

        particle.position.x =
          Math.cos(angle) * radius * (i % 3 === 0 ? 1 : 0.7);
        particle.position.y = Math.sin(i * 0.5 + state.clock.elapsedTime) * 0.5;
        particle.position.z =
          Math.sin(angle) * radius * (i % 2 === 0 ? 1 : 0.7);

        positions.array[i3] = particle.position.x;
        positions.array[i3 + 1] = particle.position.y;
        positions.array[i3 + 2] = particle.position.z;
      }

      positions.needsUpdate = true;

      // Make particles more intense when hovered
      const particleSystem = particlesRef.current.children[0];
      if (hovered) {
        particleSystem.material.opacity = 0.9;
        particleSystem.material.size = 0.12;
      } else {
        particleSystem.material.opacity = 0.7;
        particleSystem.material.size = 0.08;
      }
    }

    // Check for hover (center of screen intersection)
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.intersectObject(bookRef.current, true);
    setHovered(intersects.length > 0);

    // Counter-rotate text group to keep all text elements static relative to the camera
    if (textGroupRef.current && bookRef.current) {
      // Apply counter-rotation to the text group
      textGroupRef.current.rotation.y = -bookRef.current.rotation.y;
      textGroupRef.current.rotation.x = -bookRef.current.rotation.x;

      // Scale text with hover
      const scale = hovered ? 1.2 : 1;
      textGroupRef.current.scale.set(scale, scale, scale);

      // Add a floating effect to the text that's independent of the book's movement
      const textFloatY = Math.sin(state.clock.elapsedTime * 0.8) * 0.15;
      textGroupRef.current.position.y = 1.8 + textFloatY;
    }

    // Walk-into collision detection (check every 200ms)
    const now = Date.now();
    if (now - lastCollisionCheck > 200) {
      setLastCollisionCheck(now);

      // Calculate distance between player (camera) and book
      const cameraPosition = new THREE.Vector3();
      camera.getWorldPosition(cameraPosition);

      // Get book position (adjust for height)
      const bookPosition = new THREE.Vector3(
        initialPositionRef.current[0],
        initialPositionRef.current[1],
        initialPositionRef.current[2],
      );

      // Only compare XZ distance (horizontal plane)
      cameraPosition.y = bookPosition.y;

      // Check if player is within collision radius
      const distance = cameraPosition.distanceTo(bookPosition);
      if (distance < collisionRadiusRef.current) {
        console.log('Player walked into book!');
        teleportToSpawn();
      }
    }
  });

  return (
    <group>
      {/* Base (on the ground) */}
      <mesh
        ref={baseRef}
        position={[
          initialPositionRef.current[0],
          initialPositionRef.current[1] + 0.05,
          initialPositionRef.current[2],
        ]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.5, 2, 32]} />
        <meshStandardMaterial
          color="#80FFFF"
          emissive="#40AAFF"
          emissiveIntensity={1.0}
          transparent={true}
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Additional ground decoration - inner circle */}
      <mesh
        position={[
          initialPositionRef.current[0],
          initialPositionRef.current[1] + 0.02,
          initialPositionRef.current[2],
        ]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0, 0.5, 16]} />
        <meshBasicMaterial
          color="#FFFFFF"
          transparent={true}
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Decorative runes in a circle */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const radius = 1.5;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        return (
          <mesh
            key={i}
            position={[
              initialPositionRef.current[0] + x,
              initialPositionRef.current[1] + 0.01,
              initialPositionRef.current[2] + z,
            ]}
            rotation={[-Math.PI / 2, 0, angle]}
          >
            <planeGeometry args={[0.3, 0.3]} />
            <meshBasicMaterial
              color="#40AAFF"
              transparent={true}
              opacity={0.8}
              side={THREE.DoubleSide}
            >
              <Text
                fontSize={0.2}
                color="#FFFFFF"
                anchorX="center"
                anchorY="middle"
              >
                {String.fromCharCode(0x16a0 + i * 3)} {/* Runic characters */}
              </Text>
            </meshBasicMaterial>
          </mesh>
        );
      })}

      {/* Floating Book */}
      <group
        ref={bookRef}
        position={[
          initialPositionRef.current[0],
          initialPositionRef.current[1] + 1.5,
          initialPositionRef.current[2],
        ]}
      >
        {/* Book Cover */}
        <group ref={coverRef}>
          {/* Front cover */}
          <mesh position={[0, 0, 0.1]} castShadow>
            <boxGeometry args={[1.2, 1.6, 0.05]} />
            <meshStandardMaterial
              color="#1E3A8A" // Deep blue
              metalness={0.3}
              roughness={0.4}
              emissive="#3B82F6" // Glowing blue
              emissiveIntensity={0.5}
            />

            {/* Gold trim on cover */}
            <mesh position={[0, 0, 0.03]}>
              <boxGeometry args={[1.1, 1.5, 0.01]} />
              <meshStandardMaterial
                color="#D4AF37" // Gold
                metalness={0.9}
                roughness={0.1}
                emissive="#FFDF00"
                emissiveIntensity={0.3}
              />
            </mesh>
          </mesh>

          {/* Spine */}
          <mesh position={[-0.6, 0, 0]} castShadow>
            <boxGeometry args={[0.1, 1.6, 0.2]} />
            <meshStandardMaterial
              color="#0F2563" // Darker blue
              metalness={0.3}
              roughness={0.6}
              emissive="#2563EB"
              emissiveIntensity={0.3}
            />
          </mesh>
        </group>

        {/* Book Pages */}
        <group ref={pagesRef}>
          {/* Pages block */}
          <mesh position={[-0.25, 0, 0]} castShadow>
            <boxGeometry args={[0.6, 1.5, 0.18]} />
            <meshStandardMaterial
              color="#F8FAFC" // Off-white
              metalness={0.1}
              roughness={0.8}
              emissive="#FFFFFF"
              emissiveIntensity={0.2}
            />

            {/* Page lines for detail */}
            {Array.from({ length: 7 }).map((_, i) => (
              <mesh
                key={i}
                position={[0, (i / 6) * 1.2 - 0.6, 0.1]}
                rotation={[0, 0, 0]}
              >
                <planeGeometry args={[0.55, 0.01]} />
                <meshBasicMaterial color="#CBD5E1" opacity={0.7} transparent />
              </mesh>
            ))}
          </mesh>
        </group>

        {/* Resume icon on cover */}
        <mesh position={[0, 0.1, 0.16]} rotation={[0, 0, 0]}>
          <planeGeometry args={[0.7, 0.8]} />
          <meshBasicMaterial transparent opacity={0.9} color="#FFFFFF">
            {/* Paper icons */}
            <mesh position={[0, 0, 0.01]}>
              <planeGeometry args={[0.6, 0.7]} />
              <meshBasicMaterial color="#DBEAFE" />
            </mesh>
            <mesh position={[0, 0, 0.02]}>
              <planeGeometry args={[0.5, 0.1]} />
              <meshBasicMaterial color="#60A5FA" />
            </mesh>
            <mesh position={[0, -0.15, 0.02]}>
              <planeGeometry args={[0.5, 0.1]} />
              <meshBasicMaterial color="#60A5FA" />
            </mesh>
            <mesh position={[0, -0.3, 0.02]}>
              <planeGeometry args={[0.5, 0.1]} />
              <meshBasicMaterial color="#60A5FA" />
            </mesh>
          </meshBasicMaterial>
        </mesh>

        {/* Glow effect surrounding the book */}
        <mesh ref={glowRef}>
          <boxGeometry args={[1.5, 1.9, 0.6]} />
          <meshBasicMaterial
            color="#60A5FA"
            transparent={true}
            opacity={0.7}
            side={THREE.BackSide}
          />
        </mesh>

        {/* Particle effect system */}
        <group ref={particlesRef} position={[0, 0, 0]} />

        {/* Text group that counter-rotates as a whole */}
        <group ref={textGroupRef} position={[0, 1.8, 0]}>
          {/* Title text */}
          <Text
            position={[0, 0, 0]}
            fontSize={0.25}
            color="#FFFFFF"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
            outlineWidth={0.04}
            outlineColor="#3B82F6"
          >
            Ty's Resume
          </Text>

          {/* Instruction text */}
          <Text
            position={[0, -0.3, 0]}
            fontSize={0.18}
            color="#E0F2FE"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
            outlineWidth={0.02}
            outlineColor="#1D4ED8"
          >
            Touch to read
          </Text>
        </group>
      </group>

      {/* Point light for glow */}
      <pointLight
        position={[
          initialPositionRef.current[0],
          initialPositionRef.current[1] + 1.5,
          initialPositionRef.current[2],
        ]}
        color="#60A5FA"
        intensity={3}
        distance={10}
      />

      {/* Additional atmospheric light */}
      <pointLight
        position={[
          initialPositionRef.current[0],
          initialPositionRef.current[1] + 0.1,
          initialPositionRef.current[2],
        ]}
        color="#DBEAFE"
        intensity={1.5}
        distance={5}
      />

      {/* Spotlight effect */}
      <spotLight
        position={[
          initialPositionRef.current[0],
          initialPositionRef.current[1] + 5,
          initialPositionRef.current[2],
        ]}
        angle={0.3}
        penumbra={0.8}
        intensity={1.5}
        color="#FFFFFF"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        target={bookRef.current}
      />
    </group>
  );
};

export default Obelisk;
