"use client";

import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, useGLTF, Loader } from "@react-three/drei";
import { useRef, useEffect, useState, useMemo } from "react";
import { useScroll } from "framer-motion";
import { useTheme } from "next-themes";
import { SkeletonUtils } from "three-stdlib";

function HumanoidRobot({ scrollYProgress, currentTheme }) {
  const groupRef = useRef(null);
  const { scene } = useGLTF('/models/xbot.glb');
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const bonesRef = useRef({});
  const meshesRef = useRef([]);

  useEffect(() => {
    const meshes = [];
    // 1. Traverse and store bone references and meshes
    clone.traverse((child) => {
      if (child.isMesh && child.material) {
        meshes.push(child);
      }
      if (child.isBone) {
        const name = child.name.toLowerCase();
        if (name.includes('spine')) bonesRef.current.spine = child;
        if (name.includes('head')) bonesRef.current.head = child;
        if (name.includes('neck')) bonesRef.current.neck = child;
        
        if (name.includes('leftarm') && !name.includes('fore')) bonesRef.current.leftArm = child;
        if (name.includes('leftforearm')) bonesRef.current.leftForeArm = child;
        if (name.includes('rightarm') && !name.includes('fore')) bonesRef.current.rightArm = child;
        if (name.includes('rightforearm')) bonesRef.current.rightForeArm = child;
        
        if (name.includes('leftupleg')) bonesRef.current.leftUpLeg = child;
        if (name.includes('rightupleg')) bonesRef.current.rightUpLeg = child;
        if (name.includes('leftleg') && !name.includes('up')) bonesRef.current.leftLeg = child;
        if (name.includes('rightleg') && !name.includes('up')) bonesRef.current.rightLeg = child;
      }
    });
    meshesRef.current = meshes;
  }, [scene]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    
    // --- 0. Bulletproof Theme & Material Interpolation ---
    const isLightMode = currentTheme === 'light';
    
    meshesRef.current.forEach((child) => {
      // Target values based on theme
        const targetR = isLightMode ? 0.95 : 0.02; // Slightly off-white for better specular highlights
        const targetG = isLightMode ? 0.95 : 0.02;
        const targetB = isLightMode ? 0.95 : 0.02;
        const targetMetalness = isLightMode ? 0.4 : 1.0; // Increased metalness for harsher shadows
        const targetRoughness = isLightMode ? 0.1 : 0.1; 
        const targetEnv = isLightMode ? 1.0 : 4.0; // Drastically reduce env map so directional shadows dominate

        // Smoothly Lerp current material properties to target (creates an awesome fade effect)
        child.material.color.r += (targetR - child.material.color.r) * 0.05;
        child.material.color.g += (targetG - child.material.color.g) * 0.05;
        child.material.color.b += (targetB - child.material.color.b) * 0.05;
        
        if (child.material.metalness !== undefined) {
          child.material.metalness += (targetMetalness - child.material.metalness) * 0.05;
          child.material.roughness += (targetRoughness - child.material.roughness) * 0.05;
          child.material.envMapIntensity += (targetEnv - child.material.envMapIntensity) * 0.05;
        }
    });

    // --- 1. Global Floating & Scroll Rotation ---
    if (groupRef.current) {
      const targetRotation = scrollYProgress.get() * Math.PI * 4;
      groupRef.current.rotation.y += (targetRotation - groupRef.current.rotation.y) * 0.05;
      
      // Heavier, grand floating effect
      groupRef.current.rotation.x = Math.sin(t * 0.4) * 0.02;
      groupRef.current.position.y = -5.5 + Math.sin(t * 2.0) * 0.15; 
    }

    // --- 2. Procedural Bone Animation (Action / Dash Pose) ---
    const b = bonesRef.current;
    
    if (b.spine) b.spine.rotation.x = 0.45 + Math.sin(t * 2.0) * 0.02;
    
    if (b.head) {
      b.head.rotation.x = -0.3 + Math.sin(t * 1.5) * 0.02;
      b.head.rotation.y = Math.sin(t * 0.5) * 0.1; 
    }
    
    if (b.leftUpLeg) { b.leftUpLeg.rotation.x = -0.8; b.leftUpLeg.rotation.z = -0.1; }
    if (b.leftLeg) { b.leftLeg.rotation.x = 0.8; }
    
    if (b.rightUpLeg) { b.rightUpLeg.rotation.x = 0.5; b.rightUpLeg.rotation.z = 0.1; }
    if (b.rightLeg) { b.rightLeg.rotation.x = 0.2; }
    
    if (b.rightArm) {
      b.rightArm.rotation.x = -0.8;
      b.rightArm.rotation.z = 0.2;
    }
    if (b.rightForeArm) {
      b.rightForeArm.rotation.x = -1.5; 
      b.rightForeArm.rotation.z = 0;
    }
    
    if (b.leftArm) {
      b.leftArm.rotation.x = 1.0;
      b.leftArm.rotation.z = -0.2;
    }
    if (b.leftForeArm) {
      b.leftForeArm.rotation.x = -0.5; 
      b.leftForeArm.rotation.z = 0;
    }
  });

  return (
    <group ref={groupRef} position={[0, -5.5, 0]}>
      <Float speed={2.0} rotationIntensity={0.1} floatIntensity={0.2}>
        <primitive object={clone} scale={4.0} />
      </Float>
    </group>
  );
}

export default function RobotCanvas() {
  const { scrollYProgress } = useScroll();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted ? resolvedTheme : 'dark';

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '600px', position: 'relative' }}>
      <Canvas 
        camera={{ position: [0, 0, 8], fov: 45 }}
        dpr={[1, 1.5]} /* Cap pixel ratio at 1.5x to massively save GPU on retina displays */
        performance={{ min: 0.5 }} /* Allow framerate scaling if device struggles */
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        {/* Drastically lower ambient light to force deep, dark shadows in light mode */}
        <ambientLight intensity={currentTheme === 'light' ? 0.1 : 0.5} />
        
        {/* Harsh Key Light for dramatic contrast */}
        <directionalLight 
          position={[8, 10, 6]} 
          intensity={currentTheme === 'light' ? 4.5 : 2} 
          color="#ffffff" 
        />
        
        {/* Dark Rim/Fill Light for shading */}
        <directionalLight 
          position={[-10, -5, -5]} 
          intensity={currentTheme === 'light' ? 1.0 : 3} 
          color={currentTheme === 'light' ? "#556677" : "#00e5ff"} 
        />
        
        {/* Force environment update based on theme: City provides better contrast than studio */}
        <Environment preset="city" />
        
        <HumanoidRobot scrollYProgress={scrollYProgress} currentTheme={currentTheme} />
      </Canvas>
    </div>
  );
}

useGLTF.preload('/models/xbot.glb');
