"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function DataTicker() {
  const [count, setCount] = useState(1204593);

  useEffect(() => {
    // Increase count randomly every 30-100ms
    const interval = setInterval(() => {
      setCount((prev) => prev + Math.floor(Math.random() * 5) + 1);
    }, 80);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.5 }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginTop: "32px",
        padding: "12px 20px",
        backgroundColor: "var(--surface-color)",
        border: "1px solid var(--surface-color-dark)",
        borderRadius: "8px",
        width: "fit-content",
        fontFamily: "monospace",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)"
      }}
    >
      <div style={{
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        backgroundColor: "#00e5ff",
        boxShadow: "0 0 10px #00e5ff",
        animation: "blink 1.5s infinite"
      }} />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: "0.65rem", letterSpacing: "0.1em", color: "var(--text-muted)", textTransform: "uppercase" }}>
          Career Trajectories Simulated
        </span>
        <span style={{ fontSize: "1.2rem", fontWeight: "bold", color: "var(--text-main)", letterSpacing: "2px" }}>
          {count.toLocaleString()}
        </span>
      </div>
    </motion.div>
  );
}
