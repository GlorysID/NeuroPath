"use client";

import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export default function TiltCard({ children, className }) {
  const ref = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  // Spotlight position
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Tilt values
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const mouseXSpring = useSpring(mouseX, { stiffness: 500, damping: 50 });
  const mouseYSpring = useSpring(mouseY, { stiffness: 500, damping: 50 });

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], ["10deg", "-10deg"]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], ["-10deg", "10deg"]), { stiffness: 300, damping: 30 });

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // For spotlight
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);

    // For tilt (-0.5 to 0.5)
    const xPct = (e.clientX - rect.left) / width - 0.5;
    const yPct = (e.clientY - rect.top) / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={className}
      initial={{ perspective: 1000 }}
    >
      {/* Spotlight background */}
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 z-0"
        style={{
          opacity: isHovered ? 1 : 0,
          background: useTransform(
            () => `radial-gradient(600px circle at ${mouseXSpring.get()}px ${mouseYSpring.get()}px, rgba(255,255,255,0.1), transparent 40%)`
          ),
        }}
      />
      
      {/* Inner content wrapper (pops out slightly due to 3d) */}
      <div 
        style={{ transform: "translateZ(30px)", transformStyle: "preserve-3d", position: 'relative', zIndex: 1, width: '100%', height: '100%' }}
      >
        {children}
      </div>
    </motion.div>
  );
}
