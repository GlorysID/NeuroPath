"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useLanguage } from "../context/LanguageContext";
import styles from "./ProgressionStepper.module.css";

const STATES = [
  { id: "PROFILING", label: "Profiling", labelId: "Profilisasi", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg> },
  { id: "TECHNICAL_DEEP_DIVE", label: "Technical Deep Dive", labelId: "Pendalaman Teknis", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
  { id: "CASE_STUDY", label: "Case Study", labelId: "Studi Kasus", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> },
  { id: "STRATEGIC_BRANDING", label: "Strategic Branding", labelId: "Strategi Branding", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 3.86-8.86c.88-1.15 2.53-2.01 4.14-2.14 0 0 1 1 1 1s-.13 1.61-1.28 2.5A22 22 0 0 1 12 15Z"/><path d="M15.5 15.5a2.25 2.25 0 0 0 3.18 0l1.22-1.22a2.25 2.25 0 0 0 0-3.18V11"/><path d="M8.5 8.5a2.25 2.25 0 0 0 0-3.18L7.28 4.1a2.25 2.25 0 0 0-3.18 0H4"/></svg> },
];

const SCORE_THRESHOLD = 20;

export default function ProgressionStepper({ interviewState = {} }) {
  const { lang } = useLanguage();
  const currentState = interviewState.currentState || "PROFILING";
  const currentScore = interviewState.currentScore || 0;
  const currentIndex = STATES.findIndex(s => s.id === currentState);

  const getStatus = (index) => {
    // If the state is COMPLETED or the final stage's score is met
    if (currentState === "COMPLETED") return "completed";
    if (index < currentIndex) return "completed";
    if (index === currentIndex) {
      if (index === STATES.length - 1 && currentScore >= SCORE_THRESHOLD) {
        return "completed";
      }
      return "active";
    }
    return "locked";
  };

  return (
    <div className={styles.stepper}>
      <h3 className={styles.title}>
        {lang === 'id' ? 'Progresi Interview' : 'Interview Progression'}
      </h3>

      <div className={styles.steps}>
        {STATES.map((state, i) => {
          const status = getStatus(i);
          return (
            <motion.div
              key={state.id}
              className={`${styles.step} ${styles[status]}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              {/* Connector line */}
              {i > 0 && (
                <div className={`${styles.connector} ${status === "locked" ? styles.connectorLocked : styles.connectorDone}`} />
              )}

              <div className={styles.stepContent}>
                {/* Icon */}
                <div className={`${styles.icon} ${styles[`icon_${status}`]}`}>
                  {status === "completed" ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : status === "locked" ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                  ) : (
                    <span className={styles.pulseRing}>{state.icon}</span>
                  )}
                </div>

                {/* Text */}
                <div className={styles.stepText}>
                  <span className={styles.stepLabel}>
                    {lang === 'id' ? state.labelId : state.label}
                  </span>

                  {status === "active" && (
                    <>
                      <div className={styles.scoreBar}>
                        <motion.div
                          className={styles.scoreFill}
                          initial={{ width: 0 }}
                          animate={{ width: `${(currentScore / SCORE_THRESHOLD) * 100}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                        />
                      </div>
                      <span className={styles.scoreText}>
                        {currentScore}/{SCORE_THRESHOLD} pts
                      </span>
                    </>
                  )}

                  {status === "completed" && (
                    <span className={styles.completedText}>
                      {lang === 'id' ? 'Selesai' : 'Completed'}
                    </span>
                  )}

                  {status === "locked" && (
                    <span className={styles.lockedText}>
                      {lang === 'id' ? 'Terkunci' : 'Locked'}
                    </span>
                  )}
                </div>

                {/* Action button for active state */}
                {status === "active" && (
                  <Link
                    href={`/interview?type=${encodeURIComponent(state.id)}`}
                    className={styles.initiateBtn}
                  >
                    {lang === 'id' ? 'Mulai' : 'Initiate'}
                  </Link>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
