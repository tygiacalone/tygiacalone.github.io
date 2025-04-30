import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const LightningEffect = ({ position, onComplete }) => {
  const lightRef = useRef();
  const lineRef = useRef();
  const timeRef = useRef(0);
  const durationRef = useRef(1.5); // Total effect duration in seconds
  const isActiveRef = useRef(true);
  const hasPlayedSound = useRef(false);

  // Create lightning bolt geometry
  const [lineGeometry, lineMaterial, points] = useMemo(() => {
    // Create line segments for lightning bolt
    const segmentCount = 10;
    const points = [];

    // Start from sky
    points.push(new THREE.Vector3(0, 100, 0));

    // Create jagged path down
    for (let i = 1; i < segmentCount; i++) {
      const t = i / segmentCount;
      points.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 5 * t, // More jagged as it gets closer to ground
          100 - 100 * t,
          (Math.random() - 0.5) * 5 * t,
        ),
      );
    }

    // End at target position
    points.push(new THREE.Vector3(0, 0, 0));

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0xffffff,
      linewidth: 3,
      opacity: 0.8,
      transparent: true,
    });

    return [geometry, material, points];
  }, []);

  // Thunder sound effect
  useEffect(() => {
    // Create audio for thunder
    const thunderSound = new Audio();

    // Random thunder sound (could have multiple options)
    thunderSound.src =
      'https://freesound.org/data/previews/275/275645_5003039-lq.mp3';
    thunderSound.volume = 0.7;

    // Preload the sound
    thunderSound.load();

    // Play the sound with a slight delay after the visual effect starts
    const soundTimeout = setTimeout(() => {
      thunderSound.play().catch((e) => console.log('Audio play failed:', e));
      hasPlayedSound.current = true;
    }, 100);

    return () => {
      clearTimeout(soundTimeout);
      // Stop sound if component unmounts
      thunderSound.pause();
      thunderSound.currentTime = 0;
    };
  }, []);

  // Position the lightning bolt at the target position
  useEffect(() => {
    if (lineRef.current && position) {
      lineRef.current.position.set(position.x, 0, position.z);
    }
  }, [position]);

  // Lightning animation
  useFrame(({ clock }) => {
    if (!isActiveRef.current) return;

    const elapsed = timeRef.current;
    timeRef.current += 0.016; // ~60fps

    if (elapsed < durationRef.current) {
      // Flash intensity based on time
      if (lightRef.current) {
        // Create flickering effect with intensity
        const flicker = Math.random() * 0.4;
        const fadeOut = Math.max(0, 1 - elapsed / durationRef.current);
        const flash = Math.sin(elapsed * 20) * 0.5 + 0.5;

        lightRef.current.intensity = 3 * flash * fadeOut + flicker;
      }

      // Update lightning bolt
      if (lineRef.current) {
        // Randomly adjust midpoints of the lightning to create crackling effect
        const positions = lineRef.current.geometry.attributes.position.array;

        for (let i = 1; i < points.length - 1; i++) {
          // Don't move first and last points
          const jitter =
            Math.min(0.5, elapsed / durationRef.current) *
            (Math.random() - 0.5) *
            2;

          positions[i * 3] = points[i].x + jitter;
          positions[i * 3 + 2] = points[i].z + jitter;
        }

        lineRef.current.geometry.attributes.position.needsUpdate = true;

        // Opacity fade out
        const fadeOut = Math.max(0, 1 - elapsed / durationRef.current);
        lineRef.current.material.opacity = fadeOut;
      }
    } else {
      // Effect complete
      isActiveRef.current = false;
      if (onComplete) onComplete();
    }
  });

  // Create impact effect at ground level
  const impactRef = useRef();
  const impactEffect = useMemo(() => {
    const geometry = new THREE.RingGeometry(0, 2, 16);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    return { geometry, material };
  }, []);

  // Animate impact ring
  useFrame(() => {
    if (impactRef.current && isActiveRef.current) {
      const elapsed = timeRef.current;

      // Scale the ring outward
      const scale = Math.min(3, elapsed * 2);
      impactRef.current.scale.set(scale, scale, 1);

      // Fade out
      if (impactRef.current.material) {
        impactRef.current.material.opacity = Math.max(0, 0.6 - elapsed * 0.4);
      }
    }
  });

  return (
    <group>
      {/* Lightning flash light */}
      <pointLight
        ref={lightRef}
        position={
          position ? [position.x, position.y + 10, position.z] : [0, 10, 0]
        }
        color="#C9F0FF"
        intensity={2}
        distance={50}
        decay={2}
      />

      {/* Lightning bolt */}
      <line ref={lineRef} geometry={lineGeometry} material={lineMaterial} />

      {/* Impact at ground level */}
      {position && (
        <mesh
          ref={impactRef}
          position={[position.x, 0.05, position.z]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0, 2, 16]} />
          <meshBasicMaterial
            color="#FFFFFF"
            transparent={true}
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
};

export default LightningEffect;
