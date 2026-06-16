"use client";

import { motion } from "framer-motion";
import RobotCanvas from "./RobotCanvas";
import styles from "./Interactive3DSection.module.css";

const slideInLeft = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
};

const slideInRight = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
};

export default function Interactive3DSection() {
  return (
    <section className={styles.container}>
      <div className={styles.grid}>
        
        {/* Left Side: Features */}
        <div className={styles.sideContent}>
          <motion.div 
            className={styles.infoCard}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, margin: "-100px" }}
            variants={slideInLeft}
          >
            <h3>Cognitive Analysis</h3>
            <p>Real-time vocal tonality and micro-expression mapping during your interview. We understand how you think.</p>
          </motion.div>
          <motion.div 
            className={styles.infoCard}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, margin: "-100px" }}
            variants={slideInLeft}
          >
            <h3>Predictive Modeling</h3>
            <p>Our core simulates 10,000 career trajectories based on your unique profile to find the absolute perfect match.</p>
          </motion.div>
        </div>

        {/* Center: 3D Robot Canvas */}
        <div className={styles.centerCanvas}>
          <div className={styles.stickyWrapper}>
            <RobotCanvas />
          </div>
        </div>

        {/* Right Side: Features */}
        <div className={`${styles.sideContent} ${styles.rightAlign}`}>
          <motion.div 
            className={styles.infoCard}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, margin: "-100px" }}
            variants={slideInRight}
          >
            <h3>Neural Mapping</h3>
            <p>Connecting your latent skills to emerging industries and future roles that don't even exist yet.</p>
          </motion.div>
          <motion.div 
            className={styles.infoCard}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, margin: "-100px" }}
            variants={slideInRight}
          >
            <h3>Dynamic Roadmap</h3>
            <p>Generates a hyper-personalized, continuously updating step-by-step guide to your ultimate dream career.</p>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
