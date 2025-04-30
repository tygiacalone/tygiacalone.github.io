import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Forest Ambient Particles (leaves, dust, etc.)
const AmbientParticles = ({ count = 200, radius = 50 }) => {
  const mesh = useRef();
  const { scene } = useThree();

  // Create particle geometry and material
  const [geometry, material, particles] = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const particles = [];

    // Create positions, sizes, and colors for particles
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
      // Random positions within a sphere
      const x = Math.random() * 2 * radius - radius;
      const y = Math.random() * 20 + 1; // Height: 1-21 units above ground
      const z = Math.random() * 2 * radius - radius;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Random color (green to yellow leaf particles)
      const shade = Math.random();
      color.setHSL(0.2 + shade * 0.1, 0.5, 0.5 + shade * 0.3);

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      // Random sizes
      sizes[i] = Math.random() * 0.2 + 0.05;

      // Particle data for animation
      particles.push({
        velocity: new THREE.Vector3(
          Math.random() * 0.01 - 0.005, // gentle x movement
          Math.random() * -0.02 - 0.01, // downward falling
          Math.random() * 0.01 - 0.005, // gentle z movement
        ),
        position: new THREE.Vector3(x, y, z),
        rotation: Math.random() * Math.PI,
        rotationSpeed: (Math.random() - 0.5) * 0.01,
        size: sizes[i],
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Create point material with texture
    const material = new THREE.PointsMaterial({
      size: 0.1,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.6,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
    });

    return [geometry, material, particles];
  }, [count, radius]);

  // Animation loop for particles
  useFrame(({ clock }) => {
    const positions = geometry.attributes.position.array;

    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i];

      // Update position based on velocity
      particle.position.add(particle.velocity);

      // Rotate particle
      particle.rotation += particle.rotationSpeed;

      // Reset particles that fall below ground
      if (particle.position.y < 0.1) {
        particle.position.y = 15 + Math.random() * 5;
        particle.position.x = Math.random() * 2 * radius - radius;
        particle.position.z = Math.random() * 2 * radius - radius;
      }

      // Add slight sine wave movement to simulate wind
      particle.position.x += Math.sin(clock.elapsedTime * 0.5 + i) * 0.01;

      // Update position in geometry
      positions[i * 3] = particle.position.x;
      positions[i * 3 + 1] = particle.position.y;
      positions[i * 3 + 2] = particle.position.z;
    }

    geometry.attributes.position.needsUpdate = true;
  });

  return <points ref={mesh} geometry={geometry} material={material} />;
};

// Footstep dust particles
const FootstepParticles = ({ playerPosition, isMoving, isRunning }) => {
  const particlesRef = useRef();
  const particles = useRef([]);
  const lastEmitTime = useRef(0);
  const lastPosition = useRef(new THREE.Vector3());

  // Create particle system
  const [geometry, material] = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(100 * 3); // 100 particles max
    const opacities = new Float32Array(100);
    const sizes = new Float32Array(100);

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        color: { value: new THREE.Color('#d9c2a0') }, // dust color
      },
      vertexShader: `
        attribute float opacity;
        attribute float size;
        varying float vOpacity;
        
        void main() {
          vOpacity = opacity;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        varying float vOpacity;
        
        void main() {
          float d = length(gl_PointCoord - vec2(0.5, 0.5));
          if (d > 0.5) discard;
          float alpha = smoothstep(0.5, 0.2, d) * vOpacity;
          gl_FragColor = vec4(color, alpha);
        }
      `,
    });

    return [geometry, material];
  }, []);

  // Update particles
  useFrame(({ clock }) => {
    if (!playerPosition) return;

    const currentPosition = new THREE.Vector3(
      playerPosition.x,
      playerPosition.y,
      playerPosition.z,
    );

    // Emit new particles when moving
    if (
      isMoving &&
      clock.elapsedTime - lastEmitTime.current > (isRunning ? 0.2 : 0.4) &&
      lastPosition.current.distanceTo(currentPosition) > 0.3
    ) {
      lastEmitTime.current = clock.elapsedTime;
      lastPosition.current.copy(currentPosition);

      // Add new particles at foot position
      const numParticles = isRunning ? 6 : 3;
      for (let i = 0; i < numParticles; i++) {
        particles.current.push({
          position: new THREE.Vector3(
            currentPosition.x + (Math.random() - 0.5) * 0.2,
            0.05, // just above ground
            currentPosition.z + (Math.random() - 0.5) * 0.2,
          ),
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 0.03,
            Math.random() * 0.05 + 0.02,
            (Math.random() - 0.5) * 0.03,
          ),
          opacity: 0.8,
          size: Math.random() * 0.15 + 0.05,
          age: 0,
          maxAge: 1.0 + Math.random() * 0.5,
        });
      }
    }

    // Update existing particles
    const positions = geometry.attributes.position.array;
    const opacities = geometry.attributes.opacity.array;
    const sizes = geometry.attributes.size.array;

    let i = 0;
    particles.current = particles.current.filter((particle) => {
      particle.age += 0.016; // ~60fps
      if (particle.age >= particle.maxAge) return false;

      // Update particle physics
      particle.position.add(particle.velocity);
      particle.velocity.y -= 0.003; // gravity
      particle.opacity = 0.8 * (1 - particle.age / particle.maxAge);

      // Update buffers
      positions[i * 3] = particle.position.x;
      positions[i * 3 + 1] = particle.position.y;
      positions[i * 3 + 2] = particle.position.z;
      opacities[i] = particle.opacity;
      sizes[i] = particle.size * (1 - particle.age / particle.maxAge);

      i++;
      return true;
    });

    // Update geometry
    geometry.setDrawRange(0, particles.current.length);
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.opacity.needsUpdate = true;
    geometry.attributes.size.needsUpdate = true;
  });

  return <points ref={particlesRef} geometry={geometry} material={material} />;
};

const ParticleEffects = ({ playerPosition, isMoving, isRunning }) => {
  return (
    <group>
      <AmbientParticles count={300} radius={100} />
      <FootstepParticles
        playerPosition={playerPosition}
        isMoving={isMoving}
        isRunning={isRunning}
      />
    </group>
  );
};

export default ParticleEffects;
