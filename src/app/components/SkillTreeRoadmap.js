import styles from "./SkillTreeRoadmap.module.css";
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

export default function SkillTreeRoadmap({ className, milestones }) {
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [schedulingIndex, setSchedulingIndex] = useState(null);

  const handleSchedule = async (node, index) => {
    setSchedulingIndex(index);
    try {
      const res = await fetch("/api/generate-learning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          topic: `${node.title}: ${node.desc || node.description}`
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.open(data.url, '_blank');
        }
      }
    } catch (err) {
      console.error("Failed to fetch learning URL:", err);
    }
    setSchedulingIndex(null);
  };

  useEffect(() => {
    setMounted(true);
    if (!containerRef.current) return;
    
    // Track exact pixel dimensions to avoid ANY SVG scaling bugs
    const observer = new ResizeObserver((entries) => {
      setSize({ 
        w: entries[0].contentRect.width, 
        h: entries[0].contentRect.height 
      });
    });
    observer.observe(containerRef.current);
    
    return () => observer.disconnect();
  }, []);

  const nodes = milestones && milestones.length > 0 ? milestones : [
    { title: "Foundation", desc: "Data Analysis Basics" },
    { title: "Specialization", desc: "Machine Learning" },
    { title: "Advanced", desc: "AI Architecture" },
    { title: "Target Role", description: "AI Strategist" },
  ];

  // Generates flawless mathematical Bezier curves in absolute pixels
  const generatePixelPath = () => {
    if (size.w === 0 || size.h === 0) return "";
    
    const isMobile = size.w <= 768;
    const cx = isMobile ? 20 : size.w / 2;
    // DRAMATICALLY increased offset. The curve will now sweep deep into the left/right areas,
    // diving elegantly behind the glassmorphism cards and emerging from the blur.
    const offset = isMobile ? 0 : Math.min(size.w * 0.22, 300); 
    const step = size.h / nodes.length;

    let d = `M ${cx} 0 `;
    let prevX = cx;
    let prevY = 0;

    for (let i = 0; i < nodes.length; i++) {
      const y = (i + 0.5) * step; // Extremity Y (center of the card)
      const x = cx + (i % 2 === 0 ? -offset : offset); // Extremity X
      
      // Control points are exactly halfway vertically, pulling straight down/up.
      // This creates a mathematically perfect, ultra-smooth spline!
      const cpY = prevY + (y - prevY) / 2;
      
      d += `C ${prevX} ${cpY}, ${x} ${cpY}, ${x} ${y} `;
      
      prevX = x;
      prevY = y;
    }
    
    // Final curve to the bottom center
    const endY = size.h;
    const endX = cx;
    const cpY = prevY + (endY - prevY) / 2;
    d += `C ${prevX} ${cpY}, ${endX} ${cpY}, ${endX} ${endY}`;
    
    return d;
  };

  return (
    <div className={className} style={{ width: "100%", padding: "40px", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "64px", zIndex: 2 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "1.2rem", fontFamily: "var(--font-display)", fontWeight: 500, letterSpacing: "0.05em", color: "var(--text-main)" }}>NEURAL PATHWAY</h3>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {milestones && milestones.length > 0 ? "Target Acquired" : "Simulation Blueprint"}
          </span>
        </div>
      </div>
      
      <div className={styles.timelineContainer} ref={containerRef}>
        {/* Exact Pixel SVG Overlay - No aspect ratio bugs! */}
        {mounted && size.h > 0 && (
          <div className={styles.svgWrapper}>
            <svg 
              width={size.w} 
              height={size.h} 
              viewBox={`0 0 ${size.w} ${size.h}`} 
              style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}
            >
              <path 
                d={generatePixelPath()} 
                fill="none" 
                stroke="var(--text-main)" 
                strokeWidth="4" 
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: 'drop-shadow(0px 0px 8px rgba(255,255,255,0.4))' }}
              />
            </svg>
          </div>
        )}
        
        <div className={styles.nodesWrapper}>
          {nodes.map((node, i) => {
            const isLeft = i % 2 === 0;
            return (
              <div key={`node-${i}`} className={`${styles.timelineNode} ${isLeft ? styles.left : styles.right}`}>
                <div className={styles.timelineEmpty} />
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: false, margin: "-100px" }}
                  transition={{ duration: 0.6, delay: i * 0.2 }}
                  className={styles.glassCard}
                >
                  <div className={styles.nodeHeader}>
                    <div className={styles.nodeNumber}>{i + 1}</div>
                    <p className={styles.nodeTitle}>{node.title}</p>
                  </div>
                  <p className={styles.nodeDesc}>{node.desc || node.description}</p>
                  <div style={{ marginTop: "16px", zIndex: 10, position: "relative" }}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleSchedule(node, i); }}
                      disabled={schedulingIndex === i}
                      style={{
                        padding: "8px 16px",
                        background: "var(--bg-color)",
                        border: "1px solid var(--text-muted)",
                        borderRadius: "100px",
                        color: "var(--text-main)",
                        fontSize: "0.8rem",
                        cursor: schedulingIndex === i ? "wait" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        transition: "all 0.2s",
                        opacity: schedulingIndex === i ? 0.7 : 1
                      }}
                      onMouseOver={(e) => { if(schedulingIndex !== i) e.target.style.background = 'var(--surface-color-dark)'; }}
                      onMouseOut={(e) => { if(schedulingIndex !== i) e.target.style.background = 'var(--bg-color)'; }}
                    >
                      {schedulingIndex === i ? "Mengarahkan..." : "Mulai Belajar"}
                    </button>
                  </div>
                  <div className={styles.glowEffect} />
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
