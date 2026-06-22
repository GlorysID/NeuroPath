"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase";
import styles from "./page.module.css";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { lang } = useLanguage();

  const t = {
    titleSignIn: lang === 'id' ? 'Temukan Potensi Kognitif Sejatimu' : 'Discover Your True Cognitive Potential',
    subSignIn: lang === 'id' 
      ? 'Bergabunglah dengan jaringan profesional elit yang memetakan jalur saraf mereka menuju lintasan karir yang sempurna.' 
      : 'Join the elite network of professionals mapping their neural pathways to the perfect career trajectory.',
    btnSignIn: lang === 'id' ? 'Buat Akun' : 'Create an Account',
    
    titleSignUp: lang === 'id' ? 'Selamat Datang Kembali, Arsitek' : 'Welcome Back, Architect',
    subSignUp: lang === 'id' 
      ? 'Peta kognitifmu sudah menunggu. Masuk untuk melanjutkan membangun peta karirmu.' 
      : 'Your cognitive map is waiting. Sign in to continue building your career roadmap.',
    btnSignUp: lang === 'id' ? 'Masuk Sebagai Gantinya' : 'Sign In Instead',
    
    mockupText: lang === 'id' ? '"Mari kita bahas tentang subjek yang paling membuatmu bersemangat..."' : '"Let\'s talk about the subjects that energize you the most..."',
    
    formTitleSignIn: lang === 'id' ? 'Selamat Datang Kembali' : 'Welcome Back',
    formSubSignIn: lang === 'id' ? 'Masuk untuk melanjutkan perjalanan karirmu.' : 'Sign in to continue your career journey.',
    formTitleSignUp: lang === 'id' ? 'Buat Akun' : 'Create Account',
    formSubSignUp: lang === 'id' ? 'Mulai perjalananmu untuk menemukan masa depan idealmu.' : 'Start your journey to discover your ideal future.',
    
    emailLabel: lang === 'id' ? 'Alamat Email' : 'Email Address',
    passwordLabel: lang === 'id' ? 'Kata Sandi' : 'Password',
    submitSignIn: lang === 'id' ? 'Masuk' : 'Sign In',
    submitSignUp: lang === 'id' ? 'Daftar' : 'Sign Up',
    
    noAccount: lang === 'id' ? 'Belum punya akun?' : 'Don\'t have an account?',
    haveAccount: lang === 'id' ? 'Sudah punya akun?' : 'Already have an account?',
    toggleSignUp: lang === 'id' ? 'Daftar' : 'Sign up',
    toggleSignIn: lang === 'id' ? 'Masuk' : 'Sign in',
    
    // Error messages
    errInvalidCred: lang === 'id' ? 'Email atau kata sandi salah.' : 'Invalid email or password.',
    errEmailInUse: lang === 'id' ? 'Email ini sudah terdaftar. Silakan pindah ke tab Masuk.' : 'This email is already registered. Please switch to Sign In.',
    errWeakPwd: lang === 'id' ? 'Kata sandi terlalu lemah. Gunakan minimal 6 karakter.' : 'Password is too weak. Use at least 6 characters.',
    errInvalidEmail: lang === 'id' ? 'Format email tidak valid.' : 'Invalid email format.',
    errNetwork: lang === 'id' ? 'Koneksi jaringan terputus. Silakan periksa internet Anda.' : 'Network connection lost. Please check your internet.',
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        router.push("/dashboard");
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        router.push("/interview");
      }
    } catch (err) {
      let friendlyMessage = err.message;
      if (err.code === 'auth/invalid-credential') {
        friendlyMessage = t.errInvalidCred;
      } else if (err.code === 'auth/email-already-in-use') {
        friendlyMessage = t.errEmailInUse;
      } else if (err.code === 'auth/weak-password') {
        friendlyMessage = t.errWeakPwd;
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = t.errInvalidEmail;
      } else if (err.code === 'auth/network-request-failed') {
        friendlyMessage = t.errNetwork;
      }
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const springTransition = {
    type: "spring",
    stiffness: 180,
    damping: 28,
    mass: 1,
  };

  const traits = ["Creative Problem Solving", "Analytical Mind", "Visual Thinker"];

  return (
    <main className={styles.authContainer}>
      <LayoutGroup>
        {/* ===== BRANDING PANEL ===== */}
        <motion.div
          className={styles.brandingPanel}
          layout
          transition={springTransition}
          style={{ order: isLogin ? 0 : 1 }}
        >
          <div className={styles.visualContent}>
            <Link href="/" className={styles.logo}>NeuroPath</Link>

            <div className={styles.brandBody}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={isLogin ? "brand-signin" : "brand-signup"}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.25 }}
                  className={styles.brandTextWrap}
                >
                  {isLogin ? (
                    <>
                      <h1 className={styles.brandTitle}>
                        {t.titleSignIn}
                      </h1>
                      <p className={styles.brandSub}>
                        {t.subSignIn}
                      </p>
                    </>
                  ) : (
                    <>
                      <h1 className={styles.brandTitle}>
                        {t.titleSignUp}
                      </h1>
                      <p className={styles.brandSub}>
                        {t.subSignUp}
                      </p>
                    </>
                  )}

                  <button
                    type="button"
                    className={styles.panelToggleBtn}
                    onClick={() => setIsLogin(!isLogin)}
                  >
                    {isLogin ? t.btnSignIn : t.btnSignUp}
                  </button>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* ---- BORROWED ELEMENTS FROM LANDING PAGE ---- */}

            {/* Mockup Card (like the TiltCard on the hero) */}
            <motion.div
              className={styles.mockupCard}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <p className={styles.mockupText}>
                {t.mockupText}
              </p>

              {/* Audio wave bars (from landing hero) */}
              <div className={styles.audioWaveContainer}>
                 <motion.div className={styles.waveBar} animate={{ height: ["10px", "30px", "10px"] }} transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }} />
                 <motion.div className={styles.waveBar} animate={{ height: ["15px", "45px", "15px"] }} transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut", delay: 0.2 }} />
                 <motion.div className={styles.waveBar} animate={{ height: ["20px", "50px", "20px"] }} transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut", delay: 0.4 }} />
                 <motion.div className={styles.waveBar} animate={{ height: ["10px", "35px", "10px"] }} transition={{ repeat: Infinity, duration: 1.3, ease: "easeInOut", delay: 0.1 }} />
              </div>

              {/* Live analysis trait tags (from landing hero) */}
              <div className={styles.liveAnalysis}>
                <div className={styles.traitTags}>
                  {traits.map((trait, i) => (
                    <motion.span
                      key={trait}
                      className={styles.traitTag}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.2 + i * 1.2 }}
                    >
                      {trait}
                    </motion.span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Background robot image (from landing hero) */}
            <div className={styles.heroRobotBg}>
              <Image
                src="/images/hero-side-robot.png"
                alt=""
                fill
                style={{ objectFit: 'contain', objectPosition: 'right bottom' }}
                priority
              />
            </div>

            {/* Decorative orbs */}
            <div className={styles.abstractArt}>
              <motion.div
                className={styles.orb1}
                animate={{ scale: [1, 1.15, 1], rotate: [0, 60, 0] }}
                transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
              />
              <motion.div
                className={styles.orb2}
                animate={{ scale: [1, 1.3, 1], rotate: [0, -50, 0] }}
                transition={{ repeat: Infinity, duration: 22, ease: "linear" }}
              />
            </div>
          </div>
        </motion.div>

        {/* ===== FORM PANEL ===== */}
        <motion.div
          className={styles.formPanel}
          layout
          transition={springTransition}
          style={{ order: isLogin ? 1 : 0 }}
        >
          <div className={styles.formContainer}>
            <AnimatePresence mode="wait">
              <motion.div
                key={isLogin ? "form-signin" : "form-signup"}
                initial={{ opacity: 0, x: isLogin ? 30 : -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isLogin ? -30 : 30 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                className={styles.formInner}
              >
                <div className={styles.formHeader}>
                  <h2 className={styles.formTitle}>
                    {isLogin ? t.formTitleSignIn : t.formTitleSignUp}
                  </h2>
                  <p className={styles.formSubtitle}>
                    {isLogin
                      ? t.formSubSignIn
                      : t.formSubSignUp}
                  </p>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <form className={styles.form} onSubmit={handleAuth}>
                  <div className={styles.inputGroup}>
                    <input
                      type="email"
                      className={styles.input}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder=" "
                      id="email"
                    />
                    <label htmlFor="email" className={styles.floatingLabel}>
                      {t.emailLabel}
                    </label>
                  </div>

                  <div className={styles.inputGroup}>
                    <input
                      type="password"
                      className={styles.input}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder=" "
                      id="password"
                    />
                    <label htmlFor="password" className={styles.floatingLabel}>
                      {t.passwordLabel}
                    </label>
                  </div>

                  <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className={styles.spinner}></span>
                    ) : isLogin ? (
                      t.submitSignIn
                    ) : (
                      t.submitSignUp
                    )}
                  </button>
                </form>

                {/* Mobile-only toggle (branding panel hidden on small screens) */}
                <p className={styles.mobileToggle}>
                  {isLogin
                    ? t.noAccount
                    : t.haveAccount}
                  <button
                    type="button"
                    className={styles.mobileToggleLink}
                    onClick={() => setIsLogin(!isLogin)}
                  >
                    {isLogin ? t.toggleSignUp : t.toggleSignIn}
                  </button>
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </LayoutGroup>
    </main>
  );
}
