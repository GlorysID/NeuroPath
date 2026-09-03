"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useLanguage } from "./context/LanguageContext";
import { useState, useEffect } from "react";
import LanguageToggle from "./components/LanguageToggle";
import ThemeToggle from "./components/ThemeToggle";
import MagneticButton from "./components/MagneticButton";
import TiltCard from "./components/TiltCard";
import ScrollPath from "./components/ScrollPath";
import InfiniteMarquee from "./components/InfiniteMarquee";
import TextReveal from "./components/TextReveal";
import Interactive3DSection from "./components/Interactive3DSection";
import SkillTreeRoadmap from "./components/SkillTreeRoadmap";
import styles from "./page.module.css";

const fadeUpVariant = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
};

export default function Home() {
  const { lang } = useLanguage();
  const [appState, setAppState] = useState('loading'); // 'loading' | 'ready' | 'entering' | 'entered'
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Artificial load time
    const timer = setTimeout(() => {
      setAppState('ready');
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Lock scrolling while in loading/entering states
    if (appState !== 'entered') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [appState]);

  const handleEnter = () => {
    if (appState === 'ready') {
      setAppState('entering');
      // Wait for the 1.2s slide-up animation to finish before triggering internal hero animations
      setTimeout(() => {
        setAppState('entered');
      }, 1200);
    }
  };

  const handleAuthRedirect = (e, path) => {
    e.preventDefault();
    const activeUser = auth.currentUser || user;
    if (activeUser) {
      router.push(path);
    } else {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('auth_redirect', path);
      }
      router.push('/login');
    }
  };

  // Parallax scale down effect for Hero
  const { scrollY } = useScroll();
  const heroScale = useTransform(scrollY, [0, 800], [1, 0.85]);
  const heroOpacity = useTransform(scrollY, [0, 800], [1, 0.5]);

  const t = {
    signIn: lang === 'id' ? 'Masuk' : 'Sign In',
    dashboard: 'Dashboard',
    title1: lang === 'id' ? 'Temukan' : 'Discover your',
    title2: lang === 'id' ? 'masa depan idealmu.' : 'ideal future.',
    subtitle: lang === 'id'
      ? 'Berhenti menebak-nebak masa depan setelah lulus SMA. NeuroPath adalah layanan bimbingan konseling (BK) karier digital: wawancara suara real-time dengan AI untuk menganalisis minat dan bakatmu, lalu dapatkan roadmap karier yang konkret langkah demi langkah.'
      : 'Stop guessing about what comes after high school. NeuroPath is a digital career guidance (BK) service: a real-time voice interview with our AI to analyze your interests and aptitudes, then get a concrete, step-by-step career roadmap.',
    startBtn: lang === 'id' ? 'Mulai Wawancara AI' : 'Start AI Interview',
    viewRoadmap: lang === 'id' ? 'Eksplorasi Fitur Dashboard' : 'Explore Dashboard Features',
    mockLabel: lang === 'id' ? 'Wawancara Berlangsung' : 'Interview In Progress',
    mockText: lang === 'id' ? '"Mari kita bahas tentang subjek yang paling membuatmu bersemangat..."' : '"Let\'s talk about the subjects that energize you the most..."',
    problemHeading: lang === 'id'
      ? 'Kelulusan SMA seharusnya tidak terasa seperti berjalan dengan mata tertutup ke dalam labirin.'
      : 'High school graduation shouldn\'t feel like walking blindfolded into a maze.',
    problemDesc: lang === 'id'
      ? 'Tes karir tradisional sudah usang dan kaku. NeuroPath mengganti pilihan ganda dengan percakapan alami. Kami mendengarkan cara berpikirmu, apa yang kamu pedulikan, dan di mana kelebihanmu, lalu kami buatkan petanya, lengkap dengan jurnal bimbingan yang membantumu mencatat setiap langkah.'
      : 'Traditional career tests are rigid and outdated. NeuroPath replaces multiple-choice questions with a natural conversation. We listen to how you think, what you care about, and where you excel, then we build the map, complete with a counseling journal to track every step.',
    howTitle: lang === 'id' ? 'Cara Kerja NeuroPath' : 'How NeuroPath Works',
    howSubtitle: lang === 'id' ? 'Jalur terstruktur dari kebingungan menuju kejelasan, seperti sesi bimbingan bersama guru BK, tapi tersedia 24 jam.' : 'A structured path from confusion to clarity, like a counseling session with your school advisor, available 24/7.',
    f1Title: lang === 'id' ? 'Wawancara AI Suara' : 'Voice AI Interview',
    f1Desc: lang === 'id' ? 'Lakukan percakapan alami dan real-time dengan agen cerdas kami. Ia mengajukan pertanyaan yang tepat untuk mengungkap kekuatan tersembunyimu.' : 'Have a natural, real-time conversation with our intelligent agent. It asks the right questions to uncover your hidden strengths.',
    f2Title: lang === 'id' ? 'Analisis Mendalam' : 'Deep Analysis',
    f2Desc: lang === 'id' ? 'Kami menganalisis jawabanmu, mengidentifikasi pola minat, keterampilan, dan nilai-nilaimu untuk menemukan karir yang paling cocok.' : 'We analyze your responses, identifying patterns in your interests, skills, and values to find the perfect career match.',
    f3Title: lang === 'id' ? 'Roadmap Konkret' : 'Concrete Roadmap',
    f3Desc: lang === 'id' ? 'Dapatkan rencana aksi yang dipersonalisasi. Mulai dari keterampilan yang harus dipelajari, hingga universitas atau bootcamp yang harus dilamar.' : 'Receive a personalized, step-by-step action plan. From what skills to learn, to which universities or bootcamps to apply to.',
    testimonial: lang === 'id' ? '"Saya benar-benar tersesat setelah lulus. NeuroPath tidak hanya memberi saya tes kepribadian, ia berbicara dengan saya, memahami saya, dan memberi saya jalan yang jelas ke depan."' : '"I was completely lost after graduation. NeuroPath didn\'t just give me a personality test, it talked to me, understood me, and gave me a clear path forward."',
    testRole: lang === 'id' ? 'Menemukan jalannya di UX Design' : 'Found her path in UX Design',
    faqTitle: lang === 'id' ? 'Pertanyaan Umum' : 'Common Questions',
    q1: lang === 'id' ? 'Apakah saya harus menggunakan suara saya?' : 'Do I have to use my voice?',
    a1: lang === 'id' ? 'Meskipun suara memberikan alur paling alami, Anda juga dapat berinteraksi dengan AI melalui teks jika Anda berada di lingkungan yang bising.' : 'While voice allows for the most natural flow, you can also interact with the AI via text if you prefer a quieter environment.',
    q2: lang === 'id' ? 'Berapa lama wawancara berlangsung?' : 'How long does an interview take?',
    a2: lang === 'id' ? 'Biasanya sekitar 10 hingga 15 menit. AI akan mengajukan pertanyaan lanjutan sampai memiliki konteks yang cukup untuk menghasilkan roadmap Anda.' : 'Typically around 10 to 15 minutes. The AI will ask follow-up questions until it has enough context to generate your roadmap.',
    q3: lang === 'id' ? 'Apakah roadmap-nya benar-benar dipersonalisasi?' : 'Is the roadmap really personalized?',
    a3: lang === 'id' ? 'Ya. Alih-alih mengategorikan Anda ke dalam keranjang yang sudah ditentukan, AI kami secara dinamis menyusun rencana aksi berdasarkan sepenuhnya pada nuansa wawancara Anda.' : 'Yes. Instead of categorizing you into predefined buckets, our AI dynamically constructs an action plan based entirely on the nuances of your interview.',
    ctaTitle: lang === 'id' ? 'Siap menemukan arah tujuanmu?' : 'Ready to find your direction?',
    ctaBtn: lang === 'id' ? 'Mulai Wawancara' : 'Start Your Interview',
    footerTagline: lang === 'id' ? 'Temukan masa depan idealmu.' : 'Discover your ideal future.',
  };

  return (
    <>
      {/* Fixed Preloader Curtain */}
      <motion.div
        onClick={handleEnter}
        initial={{ y: 0 }}
        animate={{ y: appState === 'entering' || appState === 'entered' ? '-100vh' : 0 }}
        transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
        style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh',
          background: 'var(--bg-color)', zIndex: 999999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-main)',
          cursor: appState === 'ready' ? 'pointer' : 'default',
          userSelect: 'none'
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

        {appState === 'loading' ? (
          <div style={{ width: '120px', height: '1px', background: 'var(--text-muted)', overflow: 'hidden', position: 'relative' }}>
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
              style={{ position: 'absolute', top: 0, left: 0, width: '40%', height: '100%', background: 'var(--text-main)' }}
            />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
            style={{ fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)' }}
          >
            Klik Dimana Saja Untuk Masuk
          </motion.div>
        )}
      </motion.div>

      <main className={styles.main}>
        <nav className={styles.navbar}>
          <div className={styles.logo}>
            NeuroPath
          </div>
          <div className={styles.navLinks}>
            <ThemeToggle />
            <LanguageToggle />
            <MagneticButton>
              {user ? (
                <Link href="/dashboard" className={styles.loginBtn}>{t.dashboard}</Link>
              ) : (
                <Link href="/login" className={styles.loginBtn}>{t.signIn}</Link>
              )}
            </MagneticButton>
          </div>
        </nav>

        {/* Hero Section */}
        <motion.section
          className={styles.hero}
          style={{ scale: heroScale, opacity: heroOpacity }}
        >
          {/* Transparent Watermark Background */}
          <div className={styles.heroBackgroundRobot}>
            <Image
              src="/images/hero-side-robot.png"
              alt={lang === 'id' ? 'Robot Futuristik' : 'Futuristic Robot'}
              fill
              style={{ objectFit: 'contain', objectPosition: 'left center' }}
              priority
            />
          </div>

          <motion.div
            className={styles.heroContent}
            initial="hidden"
            animate={appState === 'entered' ? "visible" : "hidden"}
            variants={staggerContainer}
          >
            <motion.h1 className={styles.title} variants={fadeUpVariant}>
              {t.title1} <br />
              <span className="italic-emphasis">{t.title2}</span>
            </motion.h1>
            <motion.p className={styles.subtitle} variants={fadeUpVariant}>
              {t.subtitle}
            </motion.p>

            <motion.div className={styles.ctaGroup} variants={fadeUpVariant}>
              <MagneticButton>
                <a href={user ? "/interview" : "/login"} onClick={(e) => handleAuthRedirect(e, '/interview')} className={styles.primaryCta}>
                  {t.startBtn}
                </a>
              </MagneticButton>
              <MagneticButton>
                <a href={user ? "/dashboard" : "/login"} onClick={(e) => handleAuthRedirect(e, '/dashboard')} className={styles.secondaryCta}>
                  {t.viewRoadmap}
                </a>
              </MagneticButton>
            </motion.div>
          </motion.div>

          <motion.div
            className={styles.heroVisual}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={appState === 'entered' ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          >
            {/* Animated Voice Bubbles */}
            <motion.div
              className={`${styles.voiceBubble} ${styles.bubbleLeft}`}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              "I feel lost..."
            </motion.div>
            <motion.div
              className={`${styles.voiceBubble} ${styles.bubbleRight}`}
              animate={{ y: [0, 15, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              "What do you enjoy doing?"
            </motion.div>

            <TiltCard className={styles.mockupCard}>
              <span className={styles.mockupLabel}>{t.mockLabel}</span>
              <p className={styles.mockupText}>{t.mockText}</p>

              {/* Audio Wave Animation inside card */}
              <div className={styles.audioWaveContainer}>
                <motion.div className={styles.waveBar} animate={{ height: ["10px", "30px", "10px"] }} transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }} />
                <motion.div className={styles.waveBar} animate={{ height: ["15px", "45px", "15px"] }} transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut", delay: 0.2 }} />
                <motion.div className={styles.waveBar} animate={{ height: ["20px", "50px", "20px"] }} transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut", delay: 0.4 }} />
                <motion.div className={styles.waveBar} animate={{ height: ["10px", "35px", "10px"] }} transition={{ repeat: Infinity, duration: 1.3, ease: "easeInOut", delay: 0.1 }} />
              </div>

              {/* Live Analysis UI to fill the empty bottom space */}
              <div className={styles.liveAnalysisContainer}>
                <div className={styles.traitTags}>
                  <motion.span
                    className={styles.traitTag}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1 }}
                  >{lang === 'id' ? 'Pemecahan Masalah Kreatif' : 'Creative Problem Solving'}</motion.span>
                  <motion.span
                    className={styles.traitTag}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.5 }}
                  >{lang === 'id' ? 'Empati Tinggi' : 'High Empathy'}</motion.span>
                  <motion.span
                    className={styles.traitTag}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 4 }}
                  >{lang === 'id' ? 'Berpikir Visual' : 'Visual Thinker'}</motion.span>
                </div>
                <div className={styles.scanningBox}>
                  <motion.div
                    className={styles.scanLine}
                    animate={{ left: ["-10%", "110%"] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  />
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    Mapping to Design cluster...
                  </motion.span>
                </div>
              </div>
            </TiltCard>
          </motion.div>
        </motion.section>

        {/* Problem Statement Section (BLACK BACKGROUND) */}
        <div className={styles.contentWrapper}>
          <div className={styles.scrollPathMobileHide}>
            <ScrollPath />
          </div>

          {/* Infinite scrolling career paths as a transition from Hero */}
          <InfiniteMarquee />

          <motion.section
            className={`${styles.problemSection} ${styles.sectionDark}`}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, margin: "-100px" }}
            variants={staggerContainer}
          >
            {/* Scroll-Triggered Text Reveal for the large heading */}
            <TextReveal
              text={t.problemHeading}
              className={styles.problemHeading}
            />
            <motion.p className={styles.problemDesc} variants={fadeUpVariant}>
              {t.problemDesc}
            </motion.p>
          </motion.section>

          {/* Features Section */}
          <motion.section
            className={styles.features}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div className={styles.featuresHeader} variants={fadeUpVariant}>
              <TextReveal
                text={t.howTitle}
                className={styles.featuresTitle}
              />
              <p className={styles.featuresSubtitle}>{t.howSubtitle}</p>
            </motion.div>

            <motion.div className={styles.featureGrid} variants={staggerContainer}>
              <motion.div variants={fadeUpVariant}>
                <TiltCard className={styles.featureCard}>
                  <div className={styles.featureNumber}>01</div>
                  <h3 className={styles.featureName}>{t.f1Title}</h3>
                  <p className={styles.featureDesc}>{t.f1Desc}</p>
                </TiltCard>
              </motion.div>
              <motion.div variants={fadeUpVariant}>
                <TiltCard className={styles.featureCard}>
                  <div className={styles.featureNumber}>02</div>
                  <h3 className={styles.featureName}>{t.f2Title}</h3>
                  <p className={styles.featureDesc}>{t.f2Desc}</p>
                </TiltCard>
              </motion.div>
              <motion.div variants={fadeUpVariant}>
                <TiltCard className={styles.featureCard}>
                  <div className={styles.featureNumber}>03</div>
                  <h3 className={styles.featureName}>{t.f3Title}</h3>
                  <p className={styles.featureDesc}>{t.f3Desc}</p>
                </TiltCard>
              </motion.div>

              <motion.div variants={fadeUpVariant} style={{ gridColumn: "1 / -1" }}>
                <SkillTreeRoadmap />
              </motion.div>
            </motion.div>
          </motion.section>

          {/* 3D Interactive Core Section */}
          <div className={styles.desktopOnly}>
            <Interactive3DSection />
          </div>

          {/* Testimonials Section */}
          <motion.section
            className={styles.testimonials}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, margin: "-100px" }}
            variants={fadeUpVariant}
          >
            <div className={styles.testimonialContent}>
              <TextReveal
                text={t.testimonial}
                className={styles.testimonialTitle}
              />
              <div className={styles.authorGroup}>
                <div className={styles.authorAvatar}>S</div>
                <div className={styles.authorInfo}>
                  <span className={styles.authorName}>Sarah L.</span>
                  <span className={styles.authorRole}>{t.testRole}</span>
                </div>
              </div>
            </div>
          </motion.section>

          {/* FAQ Section */}
          <motion.section
            className={styles.faq}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div className={styles.faqHeader} variants={fadeUpVariant}>
              <TextReveal
                text={t.faqTitle}
                className={styles.faqTitle}
              />
            </motion.div>
            <div className={styles.faqList}>
              <motion.div className={styles.faqItem} variants={fadeUpVariant}>
                <h3 className={styles.faqQuestion}>{t.q1}</h3>
                <p className={styles.faqAnswer}>{t.a1}</p>
              </motion.div>
              <motion.div className={styles.faqItem} variants={fadeUpVariant}>
                <h3 className={styles.faqQuestion}>{t.q2}</h3>
                <p className={styles.faqAnswer}>{t.a2}</p>
              </motion.div>
              <motion.div className={styles.faqItem} variants={fadeUpVariant}>
                <h3 className={styles.faqQuestion}>{t.q3}</h3>
                <p className={styles.faqAnswer}>{t.a3}</p>
              </motion.div>
            </div>
          </motion.section>

          {/* Final CTA (BLACK BACKGROUND) */}
          <motion.section
            className={`${styles.finalCta} ${styles.sectionDark}`}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, margin: "-100px" }}
            variants={fadeUpVariant}
          >
            <TextReveal
              text={t.ctaTitle}
              className={styles.finalCtaTitle}
            />
            <MagneticButton>
              <a href={user ? "/interview" : "/login"} onClick={(e) => handleAuthRedirect(e, '/interview')} className={styles.finalCtaBtn}>
                {t.ctaBtn}
              </a>
            </MagneticButton>
          </motion.section>

          {/* Footer */}
          <footer className={styles.footer}>
            <div className={styles.footerInner}>
              <div className={styles.footerBrand}>
                <span className={styles.footerLogo}>NeuroPath</span>
                <p className={styles.footerTagline}>{t.footerTagline}</p>
                <p className={styles.footerTagline} style={{ marginTop: '8px', fontSize: '0.85rem' }}>
                  &copy; {new Date().getFullYear()} NeuroTeam &middot; SMK Bina Mandiri Multimedia
                </p>
              </div>
              <div className={styles.footerLinks}>
                {user ? (
                  <Link href="/dashboard" className={styles.footerLink}>{t.dashboard}</Link>
                ) : (
                  <Link href="/login" className={styles.footerLink}>{t.signIn}</Link>
                )}
                <a href={user ? "/interview" : "/login"} onClick={(e) => handleAuthRedirect(e, '/interview')} className={styles.footerLink}>{t.startBtn}</a>
                <Link href="/verify" className={styles.footerLink}>{lang === 'id' ? 'Verifikasi Sertifikat' : 'Verify Certificate'}</Link>
                <span className={styles.footerLink}>{lang === 'id' ? 'Ditenagai NeuroPath AI' : 'Powered by NeuroPath AI'}</span>
              </div>
            </div>
          </footer>
        </div>
      </main>
    </>
  );
}
