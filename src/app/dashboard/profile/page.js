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
import styles from "./page.module.css";

const DIMENSION_COLORS = [
  { key: "communicationScore", label: "Communication", color: "#4fc3f7" },
  { key: "technicalScore", label: "Technical", color: "#81c784" },
  { key: "logicScore", label: "Logic", color: "#ffb74d" },
  { key: "creativityScore", label: "Creativity", color: "#ce93d8" },
  { key: "leadershipScore", label: "Leadership", color: "#e57373" },
  { key: "adaptabilityScore", label: "Adaptability", color: "#4dd0e1" },
];

function ProgressChart({ history }) {
  const dataPoints = history
    .filter(h => h.extracted)
    .map((h, i) => ({
      index: i,
      scores: DIMENSION_COLORS.map(d => ({
        key: d.key,
        value: h.extracted[d.key] || 0,
      }))
    }));

  if (dataPoints.length < 1) {
    return <div className={styles.noChartData}>—</div>;
  }

  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const W = 800;
  const H = 240;
  const chartW = W - padding.left - padding.right;
  const chartH = H - padding.top - padding.bottom;
  const maxPoints = dataPoints.length;
  const xStep = maxPoints > 1 ? chartW / (maxPoints - 1) : chartW / 2;
  const yScale = (val) => padding.top + chartH - (val / 100) * chartH;
  const xScale = (i) => padding.left + (maxPoints > 1 ? i * xStep : chartW / 2);

  return (
    <div>
      <div className={styles.chartContainer}>
        <svg viewBox={`0 0 ${W} ${H}`} className={styles.chartSvg} preserveAspectRatio="xMidYMid meet">
          {[0, 25, 50, 75, 100].map(v => (
            <g key={v}>
              <line x1={padding.left} y1={yScale(v)} x2={W - padding.right} y2={yScale(v)}
                stroke="var(--surface-color-dark)" strokeWidth="0.5" opacity="0.5" />
              <text x={padding.left - 8} y={yScale(v) + 4} textAnchor="end"
                fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-sans)">{v}</text>
            </g>
          ))}
          {dataPoints.map((dp, i) => (
            <text key={i} x={xScale(i)} y={H - 6} textAnchor="middle"
              fill="var(--text-muted)" fontSize="8" fontFamily="var(--font-sans)">S{i + 1}</text>
          ))}
          {DIMENSION_COLORS.map((dim) => {
            const points = dataPoints.map((dp, i) => {
              const score = dp.scores.find(s => s.key === dim.key)?.value || 0;
              return `${xScale(i)},${yScale(score)}`;
            }).join(" ");
            return (
              <g key={dim.key}>
                <motion.polyline points={points} fill="none" stroke={dim.color} strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round"
                  initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.2, ease: "easeOut" }} />
                {dataPoints.map((dp, i) => {
                  const score = dp.scores.find(s => s.key === dim.key)?.value || 0;
                  return (
                    <motion.circle key={`${dim.key}-${i}`} cx={xScale(i)} cy={yScale(score)} r="3"
                      fill={dim.color} initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.8 + i * 0.1 }} />
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
      <div className={styles.chartLegend}>
        {DIMENSION_COLORS.map(dim => (
          <div key={dim.key} className={styles.legendItem}>
            <div className={styles.legendDot} style={{ background: dim.color }} />
            {dim.label}
          </div>
        ))}
      </div>
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
    if (!type || type === 'Initial Profiling') return lang === 'id' ? 'Profilisasi Awal' : 'Initial Profiling';
    return type;
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

          {/* Row 2: Progress Chart (span 3) */}
          <motion.div
            className={`${styles.bentoCard} ${styles.span3}`}
            initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.3 }}
          >
            <div className={styles.cardHeader}>{t.progressLabel}</div>
            <ProgressChart history={interviewHistory} />
          </motion.div>

        </div>
      </div>
    </>
  );
}
