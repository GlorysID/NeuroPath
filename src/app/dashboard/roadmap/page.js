"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import SkillTreeRoadmap from "../../components/SkillTreeRoadmap";
import styles from "../page.module.css";

export default function RoadmapPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { lang } = useLanguage();

  const [expanding, setExpanding] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().profile) {
            let prof = docSnap.data().profile;
            
            // Auto-expand legacy 3-step roadmaps
            if (prof.milestones && prof.milestones.length <= 3) {
              setExpanding(true);
              try {
                const res = await fetch("/api/expand-roadmap", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ profile: prof, lang })
                });
                const data = await res.json();
                if (data.milestones) {
                  prof.milestones = data.milestones;
                  // Save back to Firestore silently
                  const { updateDoc } = await import("firebase/firestore");
                  await updateDoc(docRef, { "profile.milestones": data.milestones });
                }
              } catch (err) {
                console.error("Expansion failed", err);
              }
              setExpanding(false);
            }
            
            setProfile(prof);
          } else {
            router.push("/dashboard");
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      } else {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('auth_redirect', '/dashboard/roadmap');
        }
        router.push("/login?redirect=/dashboard/roadmap");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, lang]);

  // Remove the early return for loading to allow the curtain to slide up gracefully

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const isScreenLoading = loading || expanding;

  return (
    <>
      {/* Preloader Curtain */}
      <motion.div
        initial={{ y: 0 }} animate={{ y: isScreenLoading ? 0 : '-100vh' }}
        transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
        style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh',
          background: 'var(--bg-color)', zIndex: 999999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-main)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, filter: 'blur(5px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '40px', height: '80px' }}
        >
          <motion.div style={{ width: '4px', background: 'var(--text-main)', borderRadius: '4px' }} animate={{ height: ["20px", "50px", "20px"] }} transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut", delay: 0.0 }} />
          <motion.div style={{ width: '4px', background: 'var(--text-main)', borderRadius: '4px' }} animate={{ height: ["35px", "70px", "35px"] }} transition={{ repeat: Infinity, duration: 1.3, ease: "easeInOut", delay: 0.2 }} />
          <motion.div style={{ width: '4px', background: 'var(--text-main)', borderRadius: '4px' }} animate={{ height: ["50px", "90px", "50px"] }} transition={{ repeat: Infinity, duration: 1.0, ease: "easeInOut", delay: 0.4 }} />
          <motion.div style={{ width: '4px', background: 'var(--text-main)', borderRadius: '4px' }} animate={{ height: ["35px", "70px", "35px"] }} transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut", delay: 0.6 }} />
          <motion.div style={{ width: '4px', background: 'var(--text-main)', borderRadius: '4px' }} animate={{ height: ["20px", "50px", "20px"] }} transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut", delay: 0.8 }} />
        </motion.div>
        
        <div style={{ width: '120px', height: '1px', background: 'var(--text-muted)', overflow: 'hidden', position: 'relative' }}>
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
            style={{ position: 'absolute', top: 0, left: 0, width: '40%', height: '100%', background: 'var(--text-main)' }}
          />
        </div>

        {/* Expanding details text */}
        <AnimatePresence>
          {expanding && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '-20px' }}
            >
              {lang === 'id' ? 'Memperluas Roadmap secara spesifik...' : 'Expanding Roadmap details...'}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      <div className={styles.dashboardWrapper}>
        <header className={styles.header}>
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <h1 className={styles.greeting}>
              {lang === 'id' ? "Peta Jalan Neural" : "Neural Roadmap"}
            </h1>
            <p className={styles.subtitle}>
              {lang === 'id' ? "Rencana aksi terperinci berdasarkan profil kognitif Anda." : "Detailed action plan based on your cognitive profile."}
            </p>
          </motion.div>
        </header>

        <div className={styles.bentoGrid}>
          <motion.div 
            className={styles.bentoCard} style={{ gridColumn: 'span 3', padding: '0', background: 'transparent', boxShadow: 'none', border: 'none' }}
            initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.2 }}
          >
            <SkillTreeRoadmap milestones={profile?.milestones || []} />
          </motion.div>
        </div>
      </div>
    </>
  );
}
