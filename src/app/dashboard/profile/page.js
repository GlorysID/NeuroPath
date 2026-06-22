"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";
import { motion } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import LanguageToggle from "../../components/LanguageToggle";
import ThemeToggle from "../../components/ThemeToggle";
import RadarChart from "../../components/RadarChart";
import styles from "./page.module.css";

const DIMENSION_COLORS = [
  { key: "communicationScore", label: "Communication", color: "#4fc3f7" },
  { key: "technicalScore", label: "Technical", color: "#81c784" },
  { key: "logicScore", label: "Logic", color: "#ffb74d" },
  { key: "creativityScore", label: "Creativity", color: "#ce93d8" },
  { key: "leadershipScore", label: "Leadership", color: "#e57373" },
  { key: "adaptabilityScore", label: "Adaptability", color: "#4dd0e1" },
];

// Calculates the average cognitive score for a single session
const calculateAverageScore = (extracted) => {
  if (!extracted) return 0;
  let total = 0;
  let count = 0;
  DIMENSION_COLORS.forEach(dim => {
    if (extracted[dim.key] !== undefined) {
      total += extracted[dim.key];
      count++;
    }
  });
  return count > 0 ? Math.round(total / count) : 0;
};

function ProgressChart({ history }) {
  const dataPoints = history
    .filter(h => h.extracted)
    .map((h, i) => ({
      index: i,
      date: h.date,
      average: calculateAverageScore(h.extracted)
    }));

  if (dataPoints.length < 1) {
    return <div className={styles.noChartData}>Belum ada data perkembangan skor.</div>;
  }

  const padding = { top: 30, right: 30, bottom: 40, left: 50 };
  const W = 600;
  const H = 280;
  const chartW = W - padding.left - padding.right;
  const chartH = H - padding.top - padding.bottom;
  const maxPoints = dataPoints.length;
  const xStep = maxPoints > 1 ? chartW / (maxPoints - 1) : chartW / 2;
  const yScale = (val) => padding.top + chartH - (val / 100) * chartH;
  const xScale = (i) => padding.left + (maxPoints > 1 ? i * xStep : chartW / 2);

  // Path for the area fill
  let areaPath = "";
  if (dataPoints.length > 0) {
    const pointsStr = dataPoints.map((dp, i) => `${xScale(i)},${yScale(dp.average)}`).join(" L ");
    areaPath = `M ${xScale(0)},${yScale(0)} L ${pointsStr} L ${xScale(dataPoints.length - 1)},${yScale(0)} Z`;
  }

  const points = dataPoints.map((dp, i) => `${xScale(i)},${yScale(dp.average)}`).join(" ");

  return (
    <div className={styles.chartContainer}>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.chartSvg} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--text-main)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="var(--text-main)" stopOpacity="0" />
          </linearGradient>
          <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Grid lines (Y-axis) */}
        {[0, 25, 50, 75, 100].map(v => (
          <g key={v}>
            <line x1={padding.left} y1={yScale(v)} x2={W - padding.right} y2={yScale(v)}
              stroke="var(--surface-color-dark)" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
            <text x={padding.left - 15} y={yScale(v) + 4} textAnchor="end"
              fill="var(--text-muted)" fontSize="11" fontWeight="500" fontFamily="var(--font-sans)">{v}</text>
          </g>
        ))}
        
        {/* Grid lines (X-axis) */}
        {dataPoints.map((dp, i) => (
          <g key={`x-${i}`}>
            <text x={xScale(i)} y={H - 10} textAnchor="middle"
              fill="var(--text-muted)" fontSize="12" fontWeight="600" fontFamily="var(--font-sans)">Sesi {i + 1}</text>
          </g>
        ))}

        {/* Area Fill */}
        {areaPath && (
          <motion.path d={areaPath} fill="url(#areaGradient)"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }} />
        )}

        {/* Main Line */}
        <motion.polyline points={points} fill="none" stroke="var(--text-main)" strokeWidth="3"
          strokeLinecap="round" strokeLinejoin="round" filter="url(#lineGlow)"
          initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }} />
          
        {/* Data point circles */}
        {dataPoints.map((dp, i) => (
          <g key={`dot-${i}`}>
            <motion.circle cx={xScale(i)} cy={yScale(dp.average)} r="5"
              fill="var(--bg-color)" stroke="var(--text-main)" strokeWidth="2.5"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.8 + i * 0.1 }} />
            
            {/* Value Label */}
            <motion.text x={xScale(i)} y={yScale(dp.average) - 15} textAnchor="middle"
              fill="var(--text-main)" fontSize="11" fontWeight="600" fontFamily="var(--font-sans)"
              initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 + i * 0.1 }}>
              {dp.average}
            </motion.text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [interviewHistory, setInterviewHistory] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const router = useRouter();
  const { lang } = useLanguage();

  const t = {
    welcome: lang === 'id' ? "Selamat datang kembali," : "Welcome back,",
    subtitle: lang === 'id' ? "Kelola riwayat, pantau perkembangan, dan atur akun Anda." : "Manage history, track progress, and configure your account.",
    historyLabel: lang === 'id' ? "Riwayat Wawancara" : "Interview History",
    progressLabel: lang === 'id' ? "Perkembangan Skor" : "Score Progression",
    settingsLabel: lang === 'id' ? "Pengaturan" : "Settings",
    noHistory: lang === 'id' ? "Belum ada riwayat wawancara." : "No interview history yet.",
    email: lang === 'id' ? "Email" : "Email",
    language: lang === 'id' ? "Bahasa" : "Language",
    languageDesc: lang === 'id' ? "Antarmuka dan wawancara" : "Interface and interview",
    theme: lang === 'id' ? "Tema" : "Theme",
    themeDesc: lang === 'id' ? "Gelap atau terang" : "Dark or light",
    joined: lang === 'id' ? "Bergabung" : "Joined",
    logout: lang === 'id' ? "Keluar dari Akun" : "Sign Out",
  };

  useEffect(() => {
    let unsubSnapshot = null;
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const docRef = doc(db, "users", currentUser.uid);
        unsubSnapshot = onSnapshot(docRef, (snap) => {
          if (snap.exists()) {
            setInterviewHistory(snap.data().interviewHistory || []);
          }
          setLoading(false);
        });
      } else {
        router.push("/login");
        setLoading(false);
      }
    });
    return () => { unsubAuth(); if (unsubSnapshot) unsubSnapshot(); };
  }, [router]);

  const handleLogout = async () => {
    try { await signOut(auth); router.push("/"); } catch (e) { console.error(e); }
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const formatDate = (isoStr) => {
    try {
      return new Date(isoStr).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch { return isoStr; }
  };

  const getTypeLabel = (type) => {
    if (!type) return lang === 'id' ? 'Profilisasi Awal' : 'Initial Profiling';
    
    // Map of known raw types to readable formats
    const typeMapId = {
      'Initial Profiling': 'Profilisasi Awal',
      'TECHNICAL_DEEP_DIVE': 'Eksplorasi Teknis Mendalam',
      'BEHAVIORAL': 'Wawancara Perilaku',
      'SYSTEM_DESIGN': 'Desain Sistem',
      'LOGICAL_REASONING': 'Penalaran Logis',
      'CULTURE_FIT': 'Kecocokan Budaya',
      'LEADERSHIP': 'Kepemimpinan'
    };

    const typeMapEn = {
      'Initial Profiling': 'Initial Profiling',
      'TECHNICAL_DEEP_DIVE': 'Technical Deep Dive',
      'BEHAVIORAL': 'Behavioral Interview',
      'SYSTEM_DESIGN': 'System Design',
      'LOGICAL_REASONING': 'Logical Reasoning',
      'CULTURE_FIT': 'Culture Fit',
      'LEADERSHIP': 'Leadership'
    };

    const map = lang === 'id' ? typeMapId : typeMapEn;
    
    // If it's in our map, return the mapped value
    if (map[type]) return map[type];
    if (map[type.toUpperCase()]) return map[type.toUpperCase()];

    // Fallback: convert SNAKE_CASE to Title Case
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const creationDate = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  return (
    <>
      {/* Preloader Curtain */}
      <motion.div
        initial={{ y: 0 }} animate={{ y: loading ? 0 : '-100vh' }}
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
          <motion.div initial={{ x: '-100%' }} animate={{ x: '100%' }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
            style={{ position: 'absolute', top: 0, left: 0, width: '40%', height: '100%', background: 'var(--text-main)' }} />
        </div>
      </motion.div>

      <div className={styles.profileWrapper}>
        {/* Header — same as dashboard */}
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

        {/* Bento Grid — same system as dashboard */}
        <div className={styles.bentoGrid}>

          {/* Row 1: Interview History (span 2) + Settings (span 1) */}
          <motion.div
            className={`${styles.bentoCard} ${styles.span2}`}
            initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.1 }}
          >
            <div className={styles.cardHeader}>{t.historyLabel}</div>
            {interviewHistory.length > 0 ? (
              <div className={styles.historyList}>
                {[...interviewHistory].reverse().map((session, i) => {
                  const realIndex = interviewHistory.length - 1 - i;
                  const isExpanded = expandedIndex === realIndex;
                  return (
                    <div key={realIndex}>
                      <motion.div
                        className={`${styles.historyItem} ${isExpanded ? styles.historyItemExpanded : ''}`}
                        onClick={() => setExpandedIndex(isExpanded ? null : realIndex)}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <div className={styles.historyItemLeft}>
                          <div className={styles.historyNumber}>#{interviewHistory.length - i}</div>
                          <div className={styles.historyMeta}>
                            <span className={styles.historyType}>{getTypeLabel(session.type)}</span>
                            <span className={styles.historyDate}>{formatDate(session.date)}</span>
                          </div>
                        </div>
                        <svg className={styles.historyChevron} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </motion.div>
                      {isExpanded && session.transcript && (
                        <motion.div className={styles.transcriptContainer}
                          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                          transition={{ duration: 0.3 }}>
                          <div style={{ height: '10px' }} />
                          {session.transcript.map((msg, mi) => (
                            <div key={mi} className={`${styles.transcriptBubble} ${msg.sender === 'user' ? styles.transcriptBubbleUser : styles.transcriptBubbleAi}`}>
                              <span className={styles.transcriptSender}>
                                {msg.sender === 'user' ? (lang === 'id' ? 'Anda' : 'You') : 'NeuroPath AI'}
                              </span>
                              <div className={styles.transcriptText}>{msg.text}</div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.emptyHistory}>{t.noHistory}</div>
            )}
          </motion.div>

          {/* Settings Card (span 1) */}
          <motion.div
            className={styles.bentoCard}
            initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.2 }}
          >
            <div className={styles.cardHeader}>{t.settingsLabel}</div>
            <div className={styles.settingsList}>
              <div className={styles.settingRow}>
                <div className={styles.settingLabel}>
                  <span className={styles.settingTitle}>{t.email}</span>
                </div>
                <span className={styles.settingChip}>{user?.email || '—'}</span>
              </div>
              <div className={styles.settingRow}>
                <div className={styles.settingLabel}>
                  <span className={styles.settingTitle}>{t.language}</span>
                  <span className={styles.settingDesc}>{t.languageDesc}</span>
                </div>
                <span className={styles.settingChip}>{lang === 'id' ? '🇮🇩 ID' : '🇬🇧 EN'}</span>
              </div>
              <div className={styles.settingRow}>
                <div className={styles.settingLabel}>
                  <span className={styles.settingTitle}>{t.theme}</span>
                  <span className={styles.settingDesc}>{t.themeDesc}</span>
                </div>
                <ThemeToggle />
              </div>
              <div className={styles.settingRow}>
                <div className={styles.settingLabel}>
                  <span className={styles.settingTitle}>{t.joined}</span>
                </div>
                <span className={styles.settingChip}>{creationDate}</span>
              </div>
            </div>
            <button className={styles.logoutBtn} onClick={handleLogout}>
              <svg className={styles.logoutIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              {t.logout}
            </button>
          </motion.div>

          {/* Row 2: Progress Chart (span 2) + Radar Chart (span 1) */}
          <motion.div
            className={`${styles.bentoCard} ${styles.span2}`}
            initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.3 }}
          >
            <div className={styles.cardHeader}>{t.progressLabel}</div>
            <ProgressChart history={interviewHistory} />
          </motion.div>

          <motion.div
            className={styles.bentoCard}
            initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.4 }}
          >
            <div className={styles.cardHeader}>{lang === 'id' ? 'Dimensi Kognitif' : 'Cognitive Dimensions'}</div>
            {interviewHistory.length > 0 && interviewHistory[interviewHistory.length - 1].extracted ? (
              <div style={{ transform: 'scale(0.85)', transformOrigin: 'top center', marginTop: '-20px' }}>
                <RadarChart 
                  scores={{
                    communication: interviewHistory[interviewHistory.length - 1].extracted.communicationScore || 0,
                    technical: interviewHistory[interviewHistory.length - 1].extracted.technicalScore || 0,
                    logic: interviewHistory[interviewHistory.length - 1].extracted.logicScore || 0,
                    creativity: interviewHistory[interviewHistory.length - 1].extracted.creativityScore || 0,
                    leadership: interviewHistory[interviewHistory.length - 1].extracted.leadershipScore || 0,
                    adaptability: interviewHistory[interviewHistory.length - 1].extracted.adaptabilityScore || 0,
                  }} 
                />
              </div>
            ) : (
              <div className={styles.emptyHistory}>—</div>
            )}
          </motion.div>

        </div>
      </div>
    </>
  );
}
