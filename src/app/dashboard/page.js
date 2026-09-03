"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import LanguageToggle from "../components/LanguageToggle";
import ThemeToggle from "../components/ThemeToggle";
import RadarChart from "../components/RadarChart";
import ProgressionStepper from "../components/ProgressionStepper";
import SkillBadge from "../components/SkillBadge";
import SearchPanel from "../components/SearchPanel";
import styles from "./page.module.css";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasRoadmap, setHasRoadmap] = useState(false);
  const [profile, setProfile] = useState(null);
  const [interviewState, setInterviewState] = useState(null);
  const [credentials, setCredentials] = useState([]);
  const [feed, setFeed] = useState("");

  const [modalType, setModalType] = useState(null); // 'portfolio' | 'jobs' | null
  const [modalLoading, setModalLoading] = useState(false);
  const [modalContent, setModalContent] = useState(null);


  const [generatingCoverLetter, setGeneratingCoverLetter] = useState(null);
  const [coverLetters, setCoverLetters] = useState({});

  const router = useRouter();
  const { lang } = useLanguage();

  const t = {
    welcome: lang === 'id' ? "Selamat datang kembali," : "Welcome back,",
    subtitle: lang === 'id' ? "Berikut adalah tinjauan kognitif dan rencana aksi Anda." : "Here is your cognitive overview and action plan.",
    archetypeLabel: lang === 'id' ? "Arketipe Utama" : "Primary Archetype",
    radarTitle: lang === 'id' ? "Peta Kognitif" : "Cognitive Map",
    actions: lang === 'id' ? "Aksi Cepat" : "Quick Actions",
    viewRoadmap: lang === 'id' ? "Lihat Peta Jalan Karir" : "View Career Roadmap",
    genPortfolio: lang === 'id' ? "Generate Portfolio" : "Generate Portfolio",
    findJobs: lang === 'id' ? "Cari Pekerjaan via AI" : "Find AI-Matched Jobs",
    liveAi: lang === 'id' ? "Agen AI Langsung" : "Live AI Agent",
    analyzing: lang === 'id' ? "Menganalisis lintasan baru untuk pengguna..." : "Analyzing new trajectory for user...",
    noData: lang === 'id' ? "Tidak Ada Data Terdeteksi" : "No Data Detected",
    noDataDesc: lang === 'id' ? "Anda belum menyelesaikan sesi pemetaan saraf Anda. AI kami perlu menganalisis suara Anda untuk menghasilkan peta jalan yang dipersonalisasi." : "You haven't completed your neural mapping session yet. Our AI needs to analyze your voice to generate a personalized roadmap.",
    initiateBtn: lang === 'id' ? "Mulai Pemindaian" : "Initiate Scan",
    generating: lang === 'id' ? "Menganalisis dan merumuskan..." : "Generating targeted outputs...",
    close: lang === 'id' ? "Tutup" : "Close",
    openLinkedin: lang === 'id' ? "Buka di LinkedIn" : "Open on LinkedIn",
    apply: lang === 'id' ? "Lamar" : "Apply",
    portfolioTitle: lang === 'id' ? "Portfolio Anda" : "Your Portfolio",
    jobsTitle: lang === 'id' ? "Pekerjaan yang Cocok" : "Matched Jobs",
    recommended: lang === 'id' ? "Rekomendasi AI" : "AI Recommended",
    liveListings: lang === 'id' ? "Lowongan Aktif" : "Live Listings",
  };

  useEffect(() => {
    let unsubscribeSnapshot = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);


        const docRef = doc(db, "users", currentUser.uid);
        unsubscribeSnapshot = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.profile) {
              setProfile({ ...data.profile, name: data.name });
              setHasRoadmap(true);
            } else if (data.name) {
              // If they haven't finished the interview but have a name
              setProfile({ name: data.name });
            }
            if (data.interviewState) {
              setInterviewState(data.interviewState);
            }
            if (data.credentials) {
              setCredentials(data.credentials);
            }
            if (data.aiFeed) {
              setFeed(data.aiFeed);
            }
          } else {
            setHasRoadmap(false);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching profile snapshot:", error);
          setLoading(false);
        });
      } else {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('auth_redirect', '/dashboard');
        }
        router.push("/login?redirect=/dashboard");
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, [router]);


  useEffect(() => {

    if (profile && !feed && user) {
      fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "feed", profile, lang })
      }).then(res => res.json()).then(async data => {
        if (data.result) {
          setFeed(data.result);

          try {
            await setDoc(doc(db, "users", user.uid), { aiFeed: data.result }, { merge: true });
          } catch (e) {
            console.error("Failed to cache feed:", e);
          }
        }
      }).catch(console.error);
    }
  }, [profile, lang, feed, user]);


  const handlePortfolio = async () => {
    setModalType("portfolio");
    setModalLoading(true);
    setModalContent(null);
    try {
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, lang })
      });
      const data = await res.json();
      setModalContent({ text: data.result });
    } catch (e) {
      setModalContent({ text: "Failed to generate portfolio." });
    }
    setModalLoading(false);
  };


  const handleJobs = async () => {
    setModalType("jobs");
    setModalLoading(true);
    setModalContent(null);
    setCoverLetters({}); // Reset when opening modal
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "jobs", profile, lang })
      });
      const data = await res.json();
      setModalContent({
        analysis: data.result,
        jobTitles: data.jobTitles || [],
        reasoning: data.reasoning || [],
        linkedinUrl: data.linkedinUrl || "",
        listings: data.listings || []
      });
    } catch (e) {
      setModalContent({ analysis: "Failed to find jobs." });
    }
    setModalLoading(false);
  };


  useEffect(() => {
    if (!profile) return; // Wait until profile is loaded
    

    const triggerJobs = () => handleJobs();
    const triggerPortfolio = () => handlePortfolio();
    
    window.addEventListener("openJobModal", triggerJobs);
    window.addEventListener("openPortfolioModal", triggerPortfolio);


    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const actionParam = searchParams.get("action");
      
      if (actionParam === "openJobModal") {
        handleJobs();
        window.history.replaceState({}, "", "/dashboard");
      } else if (actionParam === "openPortfolioModal") {
        handlePortfolio();
        window.history.replaceState({}, "", "/dashboard");
      }
    }

    return () => {
      window.removeEventListener("openJobModal", triggerJobs);
      window.removeEventListener("openPortfolioModal", triggerPortfolio);
    };
  }, [profile, lang]); // Dependencies needed for handleJobs and handlePortfolio fetch

  const closeModal = () => {
    setModalType(null);
    setGeneratingCoverLetter(null);
  };

  const handleGenerateCoverLetter = async (index, job) => {
    setGeneratingCoverLetter(index);
    try {
      const res = await fetch("/api/generate-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: job.title,
          company: job.company,
          profile: profile,
          lang: lang
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCoverLetters(prev => ({ ...prev, [index]: data.coverLetter }));
      }
    } catch (err) {
      console.error("Failed to generate cover letter:", err);
    }
    setGeneratingCoverLetter(null);
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const radarScores = profile ? {
    communication: profile.communicationScore || 50,
    technical: profile.technicalScore || profile.analyticalScore || 50,
    logic: profile.logicScore || profile.analyticalScore || 50,
    creativity: profile.creativityScore || profile.creativeScore || 50,
    leadership: profile.leadershipScore || 30,
    adaptability: profile.adaptabilityScore || 40,
  } : {};

  return (
    <>
      {/* Fixed Preloader Curtain */}
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: loading ? 0 : '-100vh' }}
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
      </motion.div>

      <div className={styles.dashboardWrapper}>
        <header className={styles.header}>
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <h1 className={styles.greeting}>
              {t.welcome} <span className={styles.accent}>{profile?.name || user?.email?.split('@')[0] || 'Architect'}</span>
            </h1>
            <p className={styles.subtitle}>{t.subtitle}</p>
          </motion.div>

          <div className={styles.headerToggles}>
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </header>

        {hasRoadmap ? (
          <div className={styles.bentoGrid}>
            {/* Row 1: Hero Card (Span 3) */}
            <motion.div
              className={styles.bentoHero}
              initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.1 }}
            >
              <div className={styles.heroContent}>
                <h2>{t.archetypeLabel}</h2>
                <h1>{profile?.archetype || 'Uncalibrated'}</h1>
              </div>
              <div className={styles.heroSubtitleWrap}>
                <p className={styles.heroSubtitleText}>
                  {profile?.readinessLevel || 'Unknown'} Â· {lang === 'id' ? 'Peta kognitif Anda telah dianalisis.' : 'Your cognitive map has been analyzed.'}
                </p>
              </div>
            </motion.div>

            {/* Row 2: RadarChart (Span 2) + Live Feed (Span 1) */}
            <motion.div
              className={`${styles.bentoCard} ${styles.span2} ${styles.card420}`}
              initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.2 }}
            >
              <div className={styles.cardHeader}>{t.radarTitle}</div>
              <RadarChart scores={radarScores} />
            </motion.div>

            <motion.div
              className={`${styles.bentoCard} ${styles.agentCard} ${styles.card420}`}
              initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.6 }}
            >
              <div className={styles.agentHeader}>
                <div className={styles.agentTitleWrap}>
                  <span className={styles.agentDot} />
                  <span className={styles.agentTitle}>{t.liveAi || t.liveAgent}</span>
                </div>
                <span className={styles.agentStatus}>
                  {feed
                    ? (lang === 'id' ? 'Sinkron' : 'In Sync')
                    : (lang === 'id' ? 'Merambat' : 'Streaming')}
                </span>
              </div>
              <div className={styles.agentRule} />
              <div className={styles.agentFeed}>
                {feed ? (
                  feed.split('\n\n').map((para, i) => (
                    <p key={i} className={styles.agentPara} style={{ animationDelay: `${i * 150}ms` }}>
                      {para}
                    </p>
                  ))
                ) : (
                  <div className={styles.agentWaiting}>
                    <span className={styles.typingDot} />
                    <span className={styles.typingDot} style={{ animationDelay: '0.15s' }} />
                    <span className={styles.typingDot} style={{ animationDelay: '0.3s' }} />
                    <p className={styles.agentWaitingText}>{t.analyzing}</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Row 3: Actions (Span 1) + ProgressionStepper (Span 1) + SkillBadge (Span 1) */}
            <motion.div
              className={styles.bentoCard}
              initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.4 }}
            >
              <div className={styles.cardHeader}>{t.actions}</div>
              <div className={styles.actionStack}>
                <Link href="/dashboard/roadmap" className={styles.actionBtn}>
                  <span className={styles.actionIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" /><line x1="9" y1="3" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="21" /></svg>
                  </span>
                  <span>{t.viewRoadmap}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </Link>
                <button onClick={handlePortfolio} className={styles.actionBtn}>
                  <span className={styles.actionIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                  </span>
                  <span>{t.genPortfolio}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </button>
                <button onClick={handleJobs} className={styles.actionBtn}>
                  <span className={styles.actionIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                  </span>
                  <span>{t.findJobs}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </button>
              </div>
            </motion.div>

            <motion.div
              className={styles.bentoCard}
              initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.3 }}
            >
              <ProgressionStepper interviewState={interviewState || {}} />
            </motion.div>

            <motion.div
              className={`${styles.bentoCard} ${styles.badgeCard}`}
              initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.5 }}
            >
              <SkillBadge
                archetype={profile?.archetype || 'Uncalibrated'}
                currentPhase={interviewState?.currentState || 'PROFILING'}
                interviewState={interviewState || {}}
                credentials={credentials}
                userId={user?.uid}
                hasRoadmap={hasRoadmap}
              />
            </motion.div>

            {/* Row 4: Unified Search (full width) */}
            <motion.div
              className={`${styles.bentoCard} ${styles.span3} ${styles.card420}`}
              initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.55 }}
            >
              <SearchPanel userId={user?.uid} />
            </motion.div>
          </div>
        ) : (
          <motion.section
            className={styles.emptyState}
            initial="hidden" animate="visible" variants={fadeUp}
          >
            <div className={styles.emptyStateIcon}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h2>{t.noData}</h2>
            <p>{t.noDataDesc}</p>
            <Link href="/interview" className={styles.primaryBtn}>{t.initiateBtn}</Link>
          </motion.section>
        )}

        {/* === MODAL OVERLAY === */}
        {modalType && (
          <div className={styles.modalOverlay} onClick={closeModal}>
            <motion.div
              className={styles.modal}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className={styles.modalHeader}>
                <h3>{modalType === 'portfolio' ? t.portfolioTitle : t.jobsTitle}</h3>
                <button onClick={closeModal} className={styles.modalClose}>âœ•</button>
              </div>

              {modalLoading ? (
                <div className={styles.modalLoading}>
                  <div className={styles.spinner} style={{ width: '24px', height: '24px', borderWidth: '2px' }} />
                  <p>{t.generating}</p>
                </div>
              ) : modalType === 'portfolio' ? (

                <div className={styles.modalBody}>
                  <pre className={styles.portfolioText}>{modalContent?.text}</pre>
                </div>
              ) : (

                <div className={styles.modalBody}>
                  {/* AI Analysis */}
                  <p className={styles.jobAnalysis}>{modalContent?.analysis}</p>

                  {/* AI Recommended Titles */}
                  {modalContent?.jobTitles?.length > 0 && (
                    <div className={styles.jobSection}>
                      <h4 className={styles.jobSectionTitle}>{t.recommended}</h4>
                      {modalContent.jobTitles.map((title, i) => {
                        const recIndex = `rec-${i}`;
                        return (
                          <div key={i} className={styles.jobListingContainer}>
                            <div className={styles.jobRecommendation} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div>
                                <span className={styles.jobTitleText}>{title}</span>
                                {modalContent.reasoning?.[i] && (
                                  <span className={styles.jobReason} style={{ display: 'block', marginTop: '4px' }}>{modalContent.reasoning[i]}</span>
                                )}
                              </div>
                              <div className={styles.jobActions} style={{ marginTop: '4px' }}>
                                <button
                                  onClick={() => handleGenerateCoverLetter(recIndex, { title: title, company: "[Nama Perusahaan Tujuan]" })}
                                  disabled={generatingCoverLetter === recIndex}
                                  className={styles.coverLetterBtn}
                                >
                                  {generatingCoverLetter === recIndex ? (lang === 'id' ? "Menyusun..." : "Writing...") : "Buat Draf Cover Letter"}
                                </button>
                              </div>
                            </div>
                            {coverLetters[recIndex] && (
                              <div className={styles.coverLetterPanel}>
                                <div className={styles.clHeader}>
                                  <span className={styles.clBadge}>{lang === 'id' ? 'Disusun AI' : 'AI Tailored'}</span>
                                  <button
                                    onClick={() => navigator.clipboard.writeText(coverLetters[recIndex])}
                                    className={styles.copyBtn}
                                    title={lang === 'id' ? 'Salin ke clipboard' : 'Copy to clipboard'}
                                  >
                                    {lang === 'id' ? 'Salin Teks' : 'Copy Text'}
                                  </button>
                                </div>
                                <pre className={styles.clText}>{coverLetters[recIndex]}</pre>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Live Listings from JSearch or Fallback */}
                  {modalContent?.listings?.length > 0 ? (
                    <div className={styles.jobSection}>
                      <h4 className={styles.jobSectionTitle}>{t.liveListings}</h4>
                      {modalContent.listings.map((job, i) => (
                        <div key={i} className={styles.jobListingContainer}>
                          <div className={styles.jobListing}>
                            <div>
                              <span className={styles.jobListingTitle}>{job.title}</span>
                              <span className={styles.jobListingMeta}>{job.company} Â· {job.location}</span>
                            </div>
                            <div className={styles.jobActions}>
                              <button
                                onClick={() => handleGenerateCoverLetter(i, job)}
                                disabled={generatingCoverLetter === i}
                                className={styles.coverLetterBtn}
                              >
                                {generatingCoverLetter === i ? (lang === 'id' ? "Menyusun..." : "Writing...") : "Buat Cover Letter"}
                              </button>
                              <a href={job.url} target="_blank" rel="noopener noreferrer" className={styles.applyBtn}>
                                {t.apply} â†’
                              </a>
                            </div>
                          </div>
                          {coverLetters[i] && (
                            <div className={styles.coverLetterPanel}>
                              <div className={styles.clHeader}>
                                <span className={styles.clBadge}>AI Tailored</span>
                                <button
                                  onClick={() => navigator.clipboard.writeText(coverLetters[i])}
                                  className={styles.copyBtn}
                                  title="Copy to clipboard"
                                >
                                  Salin Teks
                                </button>
                              </div>
                              <pre className={styles.clText}>{coverLetters[i]}</pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.jobSection} style={{ padding: '15px', background: 'var(--subtle-fill)', borderRadius: '10px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                      <h4 className={styles.jobSectionTitle} style={{ marginBottom: '8px', color: 'var(--text-main)' }}>{lang === 'id' ? 'Peluang Karir Tersirat' : 'Implied Opportunities'}</h4>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                        {lang === 'id'
                          ? 'Saat ini belum ada lowongan dengan judul persis di database langsung kami. Namun jangan khawatir! AI telah merangkai tautan pencarian LinkedIn khusus berdasarkan kata kunci keahlian (skill) Anda di bawah ini.'
                          : 'There are no exact title matches in our live database right now. Don\'t worry! The AI has constructed a specialized LinkedIn search link based on your core skill keywords below.'}
                      </p>
                    </div>
                  )}

                  {/* LinkedIn Button */}
                  {modalContent?.linkedinUrl && (
                    <a
                      href={modalContent.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.linkedinBtn}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                      {t.openLinkedin}
                    </a>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </>
  );
}
