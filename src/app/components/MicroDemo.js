"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "../page.module.css";
import TiltCard from "./TiltCard";
import { useLanguage } from "../context/LanguageContext";

export default function MicroDemo() {
  const [demoState, setDemoState] = useState("idle"); // idle, recording, analyzing, complete
  const { lang } = useLanguage();

  const t = {
    demo: lang === 'id' ? 'DEMO INTERAKTIF' : 'INTERACTIVE DEMO',
    listening: lang === 'id' ? 'MENDENGARKAN...' : 'LISTENING...',
    analyzing: lang === 'id' ? 'MENGANALISIS...' : 'ANALYZING...',
    result: lang === 'id' ? 'HASIL' : 'RESULT',
    clickSimulate: lang === 'id' ? 'Klik untuk mensimulasikan input suara' : 'Click to simulate voice input',
    sampleAnswer: lang === 'id'
      ? 'Saya lebih menikmati memecahkan teka-teki logika yang rumit daripada berinteraksi dengan banyak orang...'
      : 'I enjoy solving complex logic puzzles more than interacting with large crowds...',
    deepWork: lang === 'id' ? '[Kapasitas Fokus Dalam: 95%]' : '[Deep Work Capacity: 95%]',
    introverted: lang === 'id' ? '[Logika Introvert]' : '[Introverted Logic]',
    recommendedPath: lang === 'id' ? 'Jalur yang Direkomendasikan' : 'Recommended Path',
    systemArchitect: lang === 'id' ? 'Arsitek Sistem' : 'System Architect',
    matchLabel: lang === 'id' ? '98% Kecocokan berdasarkan profil kognitif' : '98% Match based on cognitive profile',
  };

  const handleHoldStart = () => {
    if (demoState !== "idle") return;
    setDemoState("recording");
    
    // Simulate recording for 2 seconds, then analyze
    setTimeout(() => {
      setDemoState("analyzing");
      setTimeout(() => {
        setDemoState("complete");
        // Reset after 5 seconds
        setTimeout(() => setDemoState("idle"), 5000);
      }, 2000);
    }, 3000);
  };

  return (
    <TiltCard className={styles.mockupCard} style={{ cursor: demoState === 'idle' ? 'pointer' : 'default' }}>
      <div 
        onMouseDown={handleHoldStart}
        onTouchStart={handleHoldStart}
        style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", position: "relative" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <span className={styles.mockupLabel}>
            {demoState === "idle" ? t.demo : 
             demoState === "recording" ? t.listening : 
             demoState === "analyzing" ? t.analyzing : t.result}
          </span>
          {demoState === "recording" && <span className={styles.analysisBlinker} />}
        </div>

        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", minHeight: "150px" }}>
          <AnimatePresence mode="wait">
            {demoState === "idle" && (
              <motion.div 
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ textAlign: "center" }}
              >
                <motion.div 
                  animate={{ scale: [1, 1.05, 1] }} 
                  transition={{ repeat: Infinity, duration: 2 }}
                  style={{ 
                    width: "60px", height: "60px", borderRadius: "50%", 
                    border: "2px solid var(--text-main)", display: "flex", 
                    alignItems: "center", justifyContent: "center", margin: "0 auto 16px" 
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="22"></line>
                  </svg>
                </motion.div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{t.clickSimulate}</p>
              </motion.div>
            )}

            {demoState === "recording" && (
              <motion.div 
                key="recording"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ width: "100%" }}
              >
                <TypewriterText text={t.sampleAnswer} />
                <div className={styles.audioWaveContainer} style={{ justifyContent: "center", marginTop: "24px" }}>
                   <motion.div className={styles.waveBar} animate={{ height: ["10px", "40px", "10px"] }} transition={{ repeat: Infinity, duration: 0.5 }} />
                   <motion.div className={styles.waveBar} animate={{ height: ["20px", "50px", "20px"] }} transition={{ repeat: Infinity, duration: 0.6 }} />
                   <motion.div className={styles.waveBar} animate={{ height: ["15px", "60px", "15px"] }} transition={{ repeat: Infinity, duration: 0.4 }} />
                   <motion.div className={styles.waveBar} animate={{ height: ["25px", "45px", "25px"] }} transition={{ repeat: Infinity, duration: 0.7 }} />
                   <motion.div className={styles.waveBar} animate={{ height: ["10px", "35px", "10px"] }} transition={{ repeat: Infinity, duration: 0.5 }} />
                </div>
              </motion.div>
            )}

            {demoState === "analyzing" && (
              <motion.div 
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ width: "100%" }}
              >
                <p className={styles.mockupText} style={{ opacity: 0.5, fontSize: "1.2rem" }}>
                  "{t.sampleAnswer}"
                </p>
                <motion.div 
                  style={{ 
                    position: "absolute", top: "-10%", left: "-10%", width: "120%", height: "4px", 
                    background: "#00e5ff", boxShadow: "0 0 20px #00e5ff", zIndex: 10
                  }}
                  animate={{ y: [0, 200, 0] }}
                  transition={{ duration: 1.5, ease: "linear", repeat: Infinity }}
                />
                <div style={{ display: "flex", gap: "8px", marginTop: "24px", flexWrap: "wrap" }}>
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 }} className={styles.traitTag} style={{ borderColor: "#00e5ff", color: "#00e5ff" }}>{t.deepWork}</motion.span>
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.2 }} className={styles.traitTag} style={{ borderColor: "#00e5ff", color: "#00e5ff" }}>{t.introverted}</motion.span>
                </div>
              </motion.div>
            )}

            {demoState === "complete" && (
              <motion.div 
                key="complete"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                style={{ width: "100%", textAlign: "center" }}
              >
                <div style={{ 
                  display: "inline-block", padding: "16px 24px", borderRadius: "12px", 
                  background: "var(--text-main)", color: "var(--bg-color)" 
                }}>
                  <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.8, marginBottom: "8px" }}>{t.recommendedPath}</p>
                  <p style={{ fontSize: "1.5rem", fontWeight: "bold", fontFamily: "var(--font-display)" }}>{t.systemArchitect}</p>
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "16px" }}>{t.matchLabel}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </TiltCard>
  );
}

function TypewriterText({ text }) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.substring(0, i));
      i++;
      if (i > text.length) clearInterval(interval);
    }, 40); // typing speed
    return () => clearInterval(interval);
  }, [text]);

  return <p className={styles.mockupText} style={{ fontSize: "1.2rem", minHeight: "80px" }}>"{displayedText}"</p>;
}
