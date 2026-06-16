"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import LanguageToggle from "../components/LanguageToggle";
import ThemeToggle from "../components/ThemeToggle";
import TiltCard from "../components/TiltCard";
import SkillTreeRoadmap from "../components/SkillTreeRoadmap";
import styles from "./page.module.css";

import CognitiveCore3D from "../components/CognitiveCore3D";

// Helper component for animated numbers
function AnimatedCounter({ value }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const end = parseInt(value, 10) || 0;
    if (start === end) return;
    
    let totalDuration = 2000;
    let incrementTime = (totalDuration / end) * 1.5;
    
    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start === end) clearInterval(timer);
    }, incrementTime);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return <>{count}</>;
}

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasRoadmap, setHasRoadmap] = useState(false); 
  const [profile, setProfile] = useState(null);
  const [feed, setFeed] = useState("");
  const [agentResult, setAgentResult] = useState("");
  const [isAgentLoading, setIsAgentLoading] = useState(false);
  const router = useRouter();
  const { lang } = useLanguage();

  const t = {
    welcome: lang === 'id' ? "Selamat datang kembali," : "Welcome back,",
    subtitle: lang === 'id' ? "Berikut adalah tinjauan kognitif dan rencana aksi Anda." : "Here is your cognitive overview and action plan.",
    profile: lang === 'id' ? "Profil Kognitif" : "Cognitive Profile",
    analytical: lang === 'id' ? "Pemikiran Analitis" : "Analytical Thinking",
    creative: lang === 'id' ? "Pemecahan Masalah Kreatif" : "Creative Problem Solving",
    archetypeLabel: lang === 'id' ? "Arketipe Utama" : "Primary Archetype",
    archetypeValue: lang === 'id' ? "Arsitek Sistem" : "System Architect",
    matched: lang === 'id' ? "Cocok" : "Matched",
    actions: lang === 'id' ? "Aksi Cepat" : "Quick Actions",
    refine: lang === 'id' ? "Sempurnakan Jalur Anda" : "Refine Your Path",
    refineDesc: lang === 'id' ? "Ikuti wawancara AI lagi untuk mengkalibrasi ulang peta jalan Anda berdasarkan keterampilan baru." : "Take another AI interview to recalibrate your roadmap based on new skills.",
    startBtn: lang === 'id' ? "Mulai Sesi" : "Start Session",
    noData: lang === 'id' ? "Tidak Ada Data Terdeteksi" : "No Data Detected",
    noDataDesc: lang === 'id' ? "Anda belum menyelesaikan sesi pemetaan saraf Anda. AI kami perlu menganalisis suara Anda untuk menghasilkan peta jalan yang dipersonalisasi." : "You haven't completed your neural mapping session yet. Our AI needs to analyze your voice to generate a personalized roadmap.",
    initiateBtn: lang === 'id' ? "Mulai Pemindaian" : "Initiate Scan",
    agenticActions: lang === 'id' ? "Aksi Agen" : "Agentic Actions",
    autoResume: lang === 'id' ? "Buat Resume Otomatis" : "Auto-Generate Resume",
    findJobs: lang === 'id' ? "Cari Pekerjaan Relevan" : "Find Relevant Jobs",
    verifyBlock: lang === 'id' ? "Verifikasi di Blockchain" : "Verify on Blockchain",
    nextObj: lang === 'id' ? "Tujuan Selanjutnya" : "Next Objective",
    nextObjDesc: lang === 'id' ? "Berdasarkan profil kognitif Anda, AI merekomendasikan sesi wawancara spesialisasi ini untuk membuka kemampuan tingkat lanjut Anda." : "Based on your cognitive profile, the AI recommends taking this specialized interview to further map your capabilities and unlock advanced action plans.",
    initiateSeq: lang === 'id' ? "Mulai Urutan" : "Initiate Sequence",
    liveAi: lang === 'id' ? "Agen AI Langsung" : "Live AI Agent",
    analyzing: lang === 'id' ? "Menganalisis lintasan baru untuk pengguna..." : "Analyzing new trajectory for user...",
    agentOutput: lang === 'id' ? "Keluaran Agen OpenClaw" : "OpenClaw Agent Output",
    generating: lang === 'id' ? "Menganalisis dan merumuskan..." : "Generating targeted outputs...",
    acknowledge: lang === 'id' ? "Mengerti" : "Acknowledge",
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().profile) {
            setProfile(docSnap.data().profile);
            setHasRoadmap(true);
          } else {
            setHasRoadmap(false);
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

  useEffect(() => {
    if (profile && !feed) {
      // Fetch live AI feed
      fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "feed", profile, lang })
      }).then(res => res.json()).then(data => {
        if (data.result) setFeed(data.result);
      }).catch(console.error);
    }
  }, [profile, lang, feed]);

  const handleAgentAction = async (actionType) => {
    if (actionType === 'verify') {
      setAgentResult(lang === 'id' ? "Verifikasi Blockchain disimulasikan. Smart contract dipanggil: 0x98f...a1c" : "Blockchain verification simulated. Smart contract pinged: 0x98f...a1c");
      return;
    }
    
    setIsAgentLoading(true);
    setAgentResult("");
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionType, profile, lang })
      });
      const data = await res.json();
      if (data.result) setAgentResult(data.result);
    } catch (e) {
      setAgentResult("Agent connection failed.");
    }
    setIsAgentLoading(false);
  };

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
            {t.welcome} <span className={styles.accent}>{user?.email?.split('@')[0] || 'Architect'}</span>
          </h1>
          <p className={styles.subtitle}>{t.subtitle}</p>
        </motion.div>
        
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <ThemeToggle />
          <LanguageToggle />
        </div>
      </header>

      {hasRoadmap ? (
        <div className={styles.bentoGrid}>
          {/* Hero Card (Span 3) */}
          <motion.div 
            className={styles.bentoHero}
            initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.1 }}
          >
            <div className={styles.heroContent}>
              <h2>{t.archetypeLabel}</h2>
              <h1>{profile?.archetype || 'Uncalibrated'}</h1>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '300px', lineHeight: '1.6' }}>
                Your cognitive profile has been analyzed. Use your archetype to guide your career decisions and skill development.
              </p>
            </div>
          </motion.div>

          {/* Analytical Score Card */}
          <motion.div 
            className={styles.bentoCard}
            initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.2 }}
          >
            <div className={styles.cardHeader}>{t.analytical}</div>
            <div style={{ marginTop: 'auto' }}>
              <div className={styles.statValue}><AnimatedCounter value={profile?.analyticalScore || 0} />%</div>
              <div className={styles.progressBar}>
                <motion.div className={styles.progressFill} 
                  initial={{ width: 0 }} whileInView={{ width: `${profile?.analyticalScore || 0}%` }} transition={{ duration: 1.5, delay: 0.5 }} 
                />
              </div>
            </div>
          </motion.div>

          {/* Creative Score Card */}
          <motion.div 
            className={styles.bentoCard}
            initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.3 }}
          >
            <div className={styles.cardHeader}>{t.creative}</div>
            <div style={{ marginTop: 'auto' }}>
              <div className={styles.statValue}><AnimatedCounter value={profile?.creativeScore || 0} />%</div>
              <div className={styles.progressBar}>
                <motion.div className={styles.progressFill} 
                  initial={{ width: 0 }} whileInView={{ width: `${profile?.creativeScore || 0}%` }} transition={{ duration: 1.5, delay: 0.7 }} 
                />
              </div>
            </div>
          </motion.div>

          {/* Agentic Action Card */}
          <motion.div 
            className={styles.bentoCard}
            initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.4 }}
          >
            <div className={styles.cardHeader}>{t.agenticActions}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              <button 
                onClick={() => handleAgentAction('resume')}
                className={styles.secondaryBtn}
              >
                {t.autoResume}
              </button>
              <button 
                onClick={() => handleAgentAction('jobs')}
                className={styles.secondaryBtn}
              >
                {t.findJobs}
              </button>
              <button 
                onClick={() => handleAgentAction('verify')}
                className={styles.secondaryBtn}
              >
                {t.verifyBlock}
              </button>
            </div>
          </motion.div>

          {/* Progressive Interview Path (Span 2) */}
          <motion.div 
            className={`${styles.bentoCard} ${styles.span2}`} style={{ gridColumn: 'span 2' }}
            initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.5 }}
          >
            <div className={styles.cardHeader}>{t.nextObj}</div>
            <h3 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', marginBottom: '8px' }}>
              {profile?.nextInterviewType || "Technical Deep Dive"}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: '1.6', maxWidth: '80%' }}>
              {t.nextObjDesc}
            </p>
            <div style={{ display: 'flex', gap: '16px', marginTop: 'auto' }}>
              <Link href={`/interview?type=${encodeURIComponent(profile?.nextInterviewType || 'Deep Dive')}`} className={styles.primaryBtn} style={{ width: 'auto' }}>
                {t.initiateSeq}
              </Link>
            </div>
          </motion.div>

          {/* AI Activity Feed (Span 1) */}
          <motion.div 
            className={styles.bentoCard} style={{ gridColumn: 'span 1', background: 'var(--surface-color-dark)', display: 'flex', flexDirection: 'column' }}
            initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.6 }}
          >
            <div className={styles.cardHeader} style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--text-main)', animation: 'pulse 2s infinite' }} />
              {t.liveAi}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px', flex: 1 }}>
              {feed ? (
                <div style={{ padding: '16px', background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--surface-color-dark)', overflowY: 'auto', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.02)' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                    {feed}
                  </p>
                </div>
              ) : (
                <div style={{ padding: '16px', background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--surface-color-dark)' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                    {t.analyzing}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      ) : (
        <motion.section 
          className={styles.emptyState}
          initial="hidden" animate="visible" variants={fadeUp}
        >
          <div className={styles.emptyIcon}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h2>{t.noData}</h2>
          <p>{t.noDataDesc}</p>
          <Link href="/interview" className={styles.primaryBtn}>{t.initiateBtn}</Link>
        </motion.section>
      )}

      {/* Agent Modal Overlay */}
      {(isAgentLoading || agentResult) && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.8)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'var(--bg-color)', padding: '32px', borderRadius: '16px',
            border: '1px solid var(--surface-color-dark)', width: '90%', maxWidth: '600px',
            maxHeight: '80vh', overflowY: 'auto'
          }}>
            <h3 style={{ marginBottom: '16px', fontFamily: 'var(--font-display)', color: 'var(--text-main)' }}>{t.agentOutput}</h3>
            {isAgentLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className={styles.spinner} style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
                <p>{t.generating}</p>
              </div>
            ) : (
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '0.95rem' }}>
                {agentResult}
              </div>
            )}
            {!isAgentLoading && (
              <button 
                onClick={() => setAgentResult("")}
                className={styles.primaryBtn} style={{ marginTop: '24px', width: 'auto' }}
              >
                {t.acknowledge}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
