"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, Sphere, Ring } from "@react-three/drei";
import { useTheme } from "next-themes";
import * as THREE from "three";

function ElegantCore({ theme }) {
  const coreRef = useRef();
  const ring1Ref = useRef();
  const ring2Ref = useRef();
  
  const isLight = theme === 'light';
  
  // High contrast colors:
  // Light mode = Obsidian Black Sphere with Vibrant Cyan Rings
  // Dark mode = Platinum White Sphere with Vibrant Cyan Rings
  const sphereColor = isLight ? "#050505" : "#ffffff";
  const glowColor = "#00e5ff"; // Keep the AI Cyan consistent

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (coreRef.current) {
      // Gentle pulsing effect
      const scale = 1 + Math.sin(time * 1.5) * 0.02;
      coreRef.current.scale.set(scale, scale, scale);
    }
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = time * 0.2;
      ring1Ref.current.rotation.y = time * 0.3;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x = -time * 0.15;
      ring2Ref.current.rotation.y = -time * 0.25;
    }
  });

  return (
    <group>
      <Float speed={2} rotationIntensity={0.2} floatIntensity={1}>
        {/* Core Sphere (High Contrast) */}
        <Sphere ref={coreRef} args={[1.8, 64, 64]}>
          <meshPhysicalMaterial 
            color={sphereColor}
            roughness={0.1}
            metalness={0.9}
            clearcoat={1}
            clearcoatRoughness={0.05}
            envMapIntensity={isLight ? 2 : 1.5}
          />
        </Sphere>

        {/* Minimalist Orbiting Ring 1 */}
        <Ring ref={ring1Ref} args={[2.4, 2.45, 64]}>
          <meshBasicMaterial color={glowColor} transparent opacity={0.6} side={THREE.DoubleSide} />
        </Ring>

        {/* Minimalist Orbiting Ring 2 */}
        <Ring ref={ring2Ref} args={[2.8, 2.83, 64]}>
          <meshBasicMaterial color={glowColor} transparent opacity={0.3} side={THREE.DoubleSide} />
        </Ring>
      </Float>
    </group>
  );
}

export default function CognitiveCore3D() {
  const { resolvedTheme } = useTheme();

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
      <Canvas camera={{ position: [0, 0, 7], fov: 45 }}>
        <ambientLight intensity={resolvedTheme === 'light' ? 1.5 : 0.5} />
        <directionalLight position={[10, 10, 10]} intensity={resolvedTheme === 'light' ? 2 : 1.5} />
        <directionalLight position={[-10, -10, -10]} color={resolvedTheme === 'light' ? "#ffffff" : "#00e5ff"} intensity={1} />
        <Environment preset="city" />
        <ElegantCore theme={resolvedTheme} />
      </Canvas>
    </div>
  );
}
