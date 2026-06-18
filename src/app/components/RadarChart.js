"use client";

import { motion } from "framer-motion";
import styles from "./RadarChart.module.css";

const LABELS = [
  { key: "communication", label: "Communication" },
  { key: "technical", label: "Technical" },
  { key: "logic", label: "Logic" },
  { key: "creativity", label: "Creativity" },
  { key: "leadership", label: "Leadership" },
  { key: "adaptability", label: "Adaptability" },
];

const CX = 160;
const CY = 160;
const R = 120;
const LEVELS = 4;

function polarToCart(angle, radius) {
  const rad = (Math.PI / 180) * (angle - 90);
  return {
    x: CX + radius * Math.cos(rad),
    y: CY + radius * Math.sin(rad),
  };
}

export default function RadarChart({ scores = {} }) {
  const step = 360 / LABELS.length;

  // Build grid rings
  const rings = [];
  for (let lv = 1; lv <= LEVELS; lv++) {
    const r = (R / LEVELS) * lv;
    const pts = LABELS.map((_, i) => {
      const p = polarToCart(i * step, r);
      return `${p.x},${p.y}`;
    }).join(" ");
    rings.push(pts);
  }

  // Build axis lines
  const axes = LABELS.map((_, i) => {
    const p = polarToCart(i * step, R);
    return { x1: CX, y1: CY, x2: p.x, y2: p.y };
  });

  // Build data polygon
  const dataPoints = LABELS.map((dim, i) => {
    const val = Math.min(100, Math.max(0, scores[dim.key] || 0));
    const r = (val / 100) * R;
    const p = polarToCart(i * step, r);
    return `${p.x},${p.y}`;
  }).join(" ");

  // Label positions (slightly outside)
  const labelPositions = LABELS.map((dim, i) => {
    const p = polarToCart(i * step, R + 24);
    return { ...dim, x: p.x, y: p.y };
  });

  return (
    <div className={styles.container}>
      <svg viewBox="0 0 320 320" className={styles.svg}>
        {/* Grid rings */}
        {rings.map((pts, i) => (
          <polygon
            key={`ring-${i}`}
            points={pts}
            fill="none"
            stroke="var(--surface-color-dark)"
            strokeWidth={i === LEVELS - 1 ? 1.5 : 0.5}
            opacity={0.6}
          />
        ))}

        {/* Axis lines */}
        {axes.map((a, i) => (
          <line
            key={`axis-${i}`}
            x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2}
            stroke="var(--surface-color-dark)"
            strokeWidth={0.5}
            opacity={0.4}
          />
        ))}

        {/* Data polygon (glow layer) */}
        <motion.polygon
          points={dataPoints}
          fill="var(--text-main)"
          fillOpacity={0.06}
          stroke="var(--text-main)"
          strokeWidth={2}
          strokeOpacity={0.15}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        />

        {/* Data polygon (main) */}
        <motion.polygon
          points={dataPoints}
          fill="var(--text-main)"
          fillOpacity={0.12}
          stroke="var(--text-main)"
          strokeWidth={2}
          strokeLinejoin="round"
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          style={{ transformOrigin: `${CX}px ${CY}px` }}
        />

        {/* Data points (dots) */}
        {LABELS.map((dim, i) => {
          const val = Math.min(100, Math.max(0, scores[dim.key] || 0));
          const r = (val / 100) * R;
          const p = polarToCart(i * step, r);
          return (
            <motion.circle
              key={`dot-${i}`}
              cx={p.x} cy={p.y} r={4}
              fill="var(--text-main)"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.6 + i * 0.08 }}
            />
          );
        })}

        {/* Labels */}
        {labelPositions.map((lbl, i) => (
          <text
            key={`label-${i}`}
            x={lbl.x} y={lbl.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="var(--text-muted)"
            fontSize="10"
            fontFamily="var(--font-sans)"
            fontWeight="500"
          >
            {lbl.label}
          </text>
        ))}

        {/* Score values next to dots */}
        {LABELS.map((dim, i) => {
          const val = Math.min(100, Math.max(0, scores[dim.key] || 0));
          const r = (val / 100) * R;
          const p = polarToCart(i * step, r > 30 ? r - 16 : r + 16);
          return (
            <motion.text
              key={`val-${i}`}
              x={p.x} y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="var(--text-main)"
              fontSize="11"
              fontFamily="var(--font-sans)"
              fontWeight="600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ duration: 0.5, delay: 0.8 + i * 0.08 }}
            >
              {val}
            </motion.text>
          );
        })}
      </svg>
    </div>
  );
}
