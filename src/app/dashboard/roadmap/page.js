"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";
import { motion } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import SkillTreeRoadmap from "../../components/SkillTreeRoadmap";
import styles from "../page.module.css";

export default function RoadmapPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { lang } = useLanguage();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().profile) {
            setProfile(docSnap.data().profile);
          } else {
            router.push("/dashboard");
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      } else {
        router.push("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <div className={styles.spinner} />
      </div>
    );
  }

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
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
  );
}
