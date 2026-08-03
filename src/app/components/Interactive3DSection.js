"use client";

import { motion } from "framer-motion";
import RobotCanvas from "./RobotCanvas";
import { useLanguage } from "../context/LanguageContext";
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
  const { lang } = useLanguage();

  const t = {
    cogTitle: lang === 'id' ? 'Analisis Kognitif' : 'Cognitive Analysis',
    cogDesc: lang === 'id'
      ? 'Pemetaan nada suara dan ekspresi secara real-time selama wawancaramu. Kami memahami cara berpikirmu.'
      : 'Real-time vocal tonality and micro-expression mapping during your interview. We understand how you think.',
    predTitle: lang === 'id' ? 'Pemodelan Prediktif' : 'Predictive Modeling',
    predDesc: lang === 'id'
      ? 'Inti kami mensimulasikan 10.000 lintasan karier berdasarkan profil unikmu untuk menemukan kecocokan yang paling tepat.'
      : 'Our core simulates 10,000 career trajectories based on your unique profile to find the absolute perfect match.',
    neuralTitle: lang === 'id' ? 'Pemetaan Neural' : 'Neural Mapping',
    neuralDesc: lang === 'id'
      ? 'Menghubungkan keterampilan terpendammu dengan industri baru dan peran masa depan yang belum ada.'
      : 'Connecting your latent skills to emerging industries and future roles that don\'t even exist yet.',
    roadTitle: lang === 'id' ? 'Roadmap Dinamis' : 'Dynamic Roadmap',
    roadDesc: lang === 'id'
      ? 'Menghasilkan panduan langkah demi langkah yang sangat personal dan terus diperbarui menuju karier impianmu.'
      : 'Generates a hyper-personalized, continuously updating step-by-step guide to your ultimate dream career.',
  };

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
            <h3>{t.cogTitle}</h3>
            <p>{t.cogDesc}</p>
          </motion.div>
          <motion.div 
            className={styles.infoCard}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, margin: "-100px" }}
            variants={slideInLeft}
          >
            <h3>{t.predTitle}</h3>
            <p>{t.predDesc}</p>
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
            <h3>{t.neuralTitle}</h3>
            <p>{t.neuralDesc}</p>
          </motion.div>
          <motion.div 
            className={styles.infoCard}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, margin: "-100px" }}
            variants={slideInRight}
          >
            <h3>{t.roadTitle}</h3>
            <p>{t.roadDesc}</p>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
