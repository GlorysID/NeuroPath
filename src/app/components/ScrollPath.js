"use client";

import { useScroll, useSpring, useMotionValueEvent } from "framer-motion";
import { useEffect, useState, useRef } from "react";

export default function ScrollPath() {
  const containerRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end end"]
  });
  
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 30,
    damping: 25,
    restDelta: 0.001
  });

  const [p, setP] = useState(0);

  // Sync the framer-motion spring value to standard React state
  // This guarantees that the clip-path and marker coordinates are perfectly 1:1 synchronized
  // and avoids any framer-motion transform interpolation bugs.
  useMotionValueEvent(smoothProgress, "change", (latest) => {
    setP(Math.max(0, Math.min(1, latest)));
  });

  // Calculate X based on progress (0 to 1)
  const calculateX = (progressValue) => {
    const angle = progressValue * Math.PI * 3;
    return 50 + Math.sin(angle) * 45; // Wider amplitude (+/- 45%)
  };

  const markerY = `${p * 100}%`;
  const markerX = `${calculateX(p)}%`;
  const clipInset = `inset(0 0 ${100 - (p * 100)}% 0)`;

  const [pathD, setPathD] = useState("");
  useEffect(() => {
    let d = `M ${calculateX(0)} 0`;
    // Create detailed path exactly from 0 to 100
    for (let i = 1; i <= 1000; i += 5) {
      d += ` L ${calculateX(i/1000)} ${i/10}`;
    }
    setPathD(d);
  }, []);

  return (
    <div ref={containerRef} style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      pointerEvents: "none",
      zIndex: 50, // Brought to front so it draws OVER text and backgrounds
      overflow: "hidden",
      mixBlendMode: "difference", // This makes white dynamically invert ANY background/text color!
      // Add gradient mask to smoothly fade out the path at the very top and very bottom
      maskImage: 'linear-gradient(to bottom, transparent 0px, black 150px, black calc(100% - 150px), transparent 100%)',
      WebkitMaskImage: 'linear-gradient(to bottom, transparent 0px, black 150px, black calc(100% - 150px), transparent 100%)',
    }}>
      {/* 1. Background Faint Track */}
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 100 100" 
        preserveAspectRatio="none"
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke="#ffffff" // Pure white for perfect difference blending
            strokeWidth="3"
            vectorEffect="non-scaling-stroke"
            opacity="0.15"
          />
        )}
      </svg>

      {/* 2. Solid Filled Track (Loading Bar Style) */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        clipPath: clipInset,
        WebkitClipPath: clipInset, // Safari support
      }}>
        <svg 
          width="100%" 
          height="100%" 
          viewBox="0 0 100 100" 
          preserveAspectRatio="none"
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#ffffff" // Pure white
              strokeWidth="12"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>
      </div>

      {/* Single Box Marker traveling along the path */}
      <div
        style={{
          position: 'absolute',
          top: markerY,
          left: markerX,
          transform: "translate(-50%, -50%) rotate(45deg)", // Native CSS to guarantee correct transform origin
          width: '28px',
          height: '28px',
          backgroundColor: '#ffffff', // Pure white
          boxShadow: '0 0 20px rgba(255,255,255,0.5)', // Glow effect
          borderRadius: '6px',
        }}
      />
    </div>
  );
}
