"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CustomCursor() {
  const [isHovering, setIsHovering] = useState(false);
  
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  
  const springConfig = { damping: 25, stiffness: 300, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    const moveCursor = (e) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };
    
    const handleMouseOver = (e) => {
      if (
        e.target.tagName.toLowerCase() === "button" || 
        e.target.tagName.toLowerCase() === "a" ||
        e.target.closest("button") || 
        e.target.closest("a")
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener("mousemove", moveCursor);
    window.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, [cursorX, cursorY]);

  return (
    <>
      {/* Small dot following exactly */}
      <motion.div
        style={{
          position: "fixed",
          left: -4,
          top: -4,
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: "#fff",
          mixBlendMode: "difference",
          pointerEvents: "none",
          zIndex: 9999999,
          x: cursorX, // Removed spring to guarantee perfect 1:1 hitbox accuracy
          y: cursorY, 
        }}
      />
      {/* Larger trailing ring */}
      <motion.div
        style={{
          position: "fixed",
          left: -16,
          top: -16,
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          border: "1px solid #fff",
          mixBlendMode: "difference",
          pointerEvents: "none",
          zIndex: 9999998,
          x: cursorXSpring,
          y: cursorYSpring,
        }}
        animate={{
          scale: isHovering ? 2 : 1,
          opacity: isHovering ? 0.3 : 1,
          backgroundColor: isHovering ? "#fff" : "rgba(255, 255, 255, 0)"
        }}
        transition={{ duration: 0.2 }}
      />
    </>
  );
}
