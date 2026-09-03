"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GoogleAuthProvider, signInWithPopup, getAdditionalUserInfo, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import styles from "./page.module.css";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";

function LoginContent() {
  const [isLogin, setIsLogin] = useState(true);
  const [showGoogleNameForm, setShowGoogleNameForm] = useState(false);
  const [pendingGoogleUser, setPendingGoogleUser] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams ? searchParams.get('redirect') : null;
  const { lang } = useLanguage();

  const getRedirectTarget = (hasProfile) => {
    if (redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')) {
      return redirectParam;
    }
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('auth_redirect');
      if (stored && stored.startsWith('/') && !stored.startsWith('//')) {
        sessionStorage.removeItem('auth_redirect');
        return stored;
      }
    }
    return hasProfile ? "/dashboard" : "/interview";
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && currentUser.emailVerified) {
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          const hasProfile = docSnap.exists() && !!docSnap.data()?.profile;
          router.push(getRedirectTarget(hasProfile));
        } catch {
          router.push(getRedirectTarget(false));
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const t = {
    titleSignIn: lang === 'id' ? 'Temukan Potensi Kognitif Sejatimu' : 'Discover Your True Cognitive Potential',
    subSignIn: lang === 'id' 
      ? 'Bimbingan karier untuk siswa SMA. Temukan minat dan bakatmu lewat wawancara AI, dan mulailah merancang masa depanmu.' 
      : 'Career guidance for high school students. Discover your interests and aptitudes through an AI interview, and start shaping your future.',
    btnSignIn: lang === 'id' ? 'Buat Akun' : 'Create an Account',
    
    titleSignUp: lang === 'id' ? 'Selamat Datang, Arsitek Masa Depan' : 'Welcome Back, Future Architect',
    subSignUp: lang === 'id' 
      ? 'Peta kognitif Anda telah menanti. Masuk untuk melanjutkan merancang peta karir personal Anda.' 
      : 'Your cognitive map is waiting. Sign in to continue building your personalized career roadmap.',
    btnSignUp: lang === 'id' ? 'Masuk Sebagai Gantinya' : 'Sign In Instead',
    
    mockupText: lang === 'id' ? '"Mari kita bahas tentang subjek yang paling membuatmu bersemangat..."' : '"Let\'s talk about the subjects that energize you the most..."',
    
    formTitleSignIn: lang === 'id' ? 'Selamat Datang Kembali' : 'Welcome Back',
    formSubSignIn: lang === 'id' ? 'Masuk untuk melanjutkan perjalanan karirmu.' : 'Sign in to continue your career journey.',
    formTitleSignUp: lang === 'id' ? 'Buat Akun' : 'Create Account',
    formSubSignUp: lang === 'id' ? 'Mulai perjalananmu untuk menemukan masa depan idealmu.' : 'Start your journey to discover your ideal future.',
    
    nameLabel: lang === 'id' ? 'Nama Lengkap' : 'Full Name',
    emailLabel: lang === 'id' ? 'Alamat Email' : 'Email Address',
    passwordLabel: lang === 'id' ? 'Kata Sandi' : 'Password',
    submitSignIn: lang === 'id' ? 'Masuk' : 'Sign In',
    submitSignUp: lang === 'id' ? 'Daftar' : 'Sign Up',
    googleSignText: lang === 'id' ? 'Lanjutkan dengan Google' : 'Continue with Google',
    orText: lang === 'id' ? 'ATAU' : 'OR',
    
    emailSentTitle: lang === 'id' ? 'Verifikasi Email Anda' : 'Verify Your Email',
    emailSentDesc: lang === 'id' ? 'Kami telah mengirimkan tautan verifikasi ke email Anda. Silakan klik tautan tersebut untuk mengaktifkan akun Anda sebelum masuk.' : 'We\'ve sent a verification link to your email. Please click the link to activate your account before signing in.',
    emailSentWait: lang === 'id' ? 'Tidak menerima email? Periksa folder spam Anda.' : 'Didn\'t receive it? Check your spam folder.',
    errUnverified: lang === 'id' ? 'Akun Anda belum diverifikasi. Silakan periksa email Anda.' : 'Your account is not verified yet. Please check your email.',
    
    titleGoogleForm: lang === 'id' ? 'Lengkapi Profil Anda' : 'Complete Profile',
    subGoogleForm: lang === 'id' ? 'Silakan masukkan nama lengkap Anda untuk melanjutkan.' : 'Please enter your full name to continue.',
    btnGoogleForm: lang === 'id' ? 'Lanjutkan' : 'Continue',
    
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
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
          await signOut(auth);
          setError(t.errUnverified);
          setLoading(false);
          return;
        }

        const docRef = doc(db, "users", userCredential.user.uid);
        const docSnap = await getDoc(docRef);
        let hasProfile = false;
        if (docSnap.exists() && docSnap.data().profile) {
          hasProfile = true;
        }

        const target = getRedirectTarget(hasProfile);
        router.push(target);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await setDoc(doc(db, "users", user.uid), { 
          name: name,
          email: email 
        }, { merge: true });

        await sendEmailVerification(user);
        await signOut(auth); // Sign them out so they have to verify first
        setEmailSent(true);
      }
    } catch (err) {
      console.error(err);
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

  const handleGoogleAuth = async () => {
    setError("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const additionalInfo = getAdditionalUserInfo(result);

      if (additionalInfo?.isNewUser) {
        // Pre-fill name if it exists from Google, but force them to confirm/edit it
        if (user.displayName) {
          setName(user.displayName);
        }
        setPendingGoogleUser(user);
        setShowGoogleNameForm(true);
      } else {
        // For returning users, check if they have completed the interview
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        let hasProfile = false;
        if (docSnap.exists() && docSnap.data().profile) {
          hasProfile = true;
        }

        await setDoc(docRef, { 
          email: user.email 
        }, { merge: true });

        const target = getRedirectTarget(hasProfile);
        router.push(target);
      }
    } catch (err) {
      console.error("Google Auth Error:", err);
      setError(err.message || t.errNetwork);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleNameSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await setDoc(doc(db, "users", pendingGoogleUser.uid), { 
        name: name,
        email: pendingGoogleUser.email 
      }, { merge: true });
      const target = getRedirectTarget(false);
      router.push(target);
    } catch (err) {
      setError(err.message);
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

  const traits = [lang === 'id' ? 'Pemecahan Masalah Kreatif' : 'Creative Problem Solving', lang === 'id' ? 'Pikiran Analitis' : 'Analytical Mind', lang === 'id' ? 'Berpikir Visual' : 'Visual Thinker'];

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
          <div className={`${styles.visualContent} ${!isLogin ? styles.contentRight : ''}`}>
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

            {/* ---- BACKGROUND ELEMENTS ---- */}

            {/* Background robot image (from landing hero) */}
            <div className={`${styles.heroRobotBg} ${!isLogin ? styles.robotMirrored : ''}`}>
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
              {showGoogleNameForm ? (
                <motion.div
                  key="form-google-name"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.2 }}
                  className={styles.formInner}
                >
                  <div className={styles.formHeader}>
                    <h2 className={styles.formTitle}>{t.titleGoogleForm}</h2>
                    <p className={styles.formSubtitle}>{t.subGoogleForm}</p>
                  </div>

                  {error && <div className={styles.error}>{error}</div>}

                  <form className={styles.form} onSubmit={handleGoogleNameSubmit}>
                    <div className={styles.inputGroup}>
                      <input
                        type="text"
                        className={styles.input}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder=" "
                        id="googleName"
                      />
                      <label htmlFor="googleName" className={styles.floatingLabel}>
                        {t.nameLabel}
                      </label>
                    </div>

                    <button
                      type="submit"
                      className={styles.submitBtn}
                      disabled={loading}
                    >
                      {loading ? (
                        <span className={styles.spinner}></span>
                      ) : (
                        t.btnGoogleForm
                      )}
                    </button>
                  </form>
                </motion.div>
              ) : (
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
                    {emailSent ? t.emailSentTitle : isLogin ? t.formTitleSignIn : t.formTitleSignUp}
                  </h2>
                  <p className={styles.formSubtitle}>
                    {emailSent ? t.emailSentDesc : isLogin ? t.formSubSignIn : t.formSubSignUp}
                  </p>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                {emailSent ? (
                  <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--text-main)" strokeWidth="1.5" style={{ marginBottom: '24px' }}>
                      <path d="M22 12.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round"/><polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <p className={styles.mobileToggle}>{t.emailSentWait}</p>
                    <button type="button" className={styles.submitBtn} onClick={() => { setEmailSent(false); setIsLogin(true); }} style={{ marginTop: '30px', width: '100%' }}>
                      {lang === 'id' ? 'Ke Halaman Masuk' : 'Go to Sign In'}
                    </button>
                  </div>
                ) : (
                  <>
                    <form className={styles.form} onSubmit={handleAuth}>
                      {!isLogin && (
                        <div className={styles.inputGroup}>
                          <input
                            type="text"
                            className={styles.input}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder=" "
                            id="name"
                          />
                          <label htmlFor="name" className={styles.floatingLabel}>
                            {t.nameLabel}
                          </label>
                        </div>
                      )}

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
                      
                      <div className={styles.separator}>{t.orText}</div>
                      
                      <button
                        type="button"
                        onClick={handleGoogleAuth}
                        className={styles.googleBtn}
                        disabled={loading}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        {t.googleSignText}
                      </button>
                    </form>

                    {/* Mobile-only toggle */}
                    <p className={styles.mobileToggle}>
                      {isLogin ? t.noAccount : t.haveAccount}
                      <button
                        type="button"
                        className={styles.mobileToggleLink}
                        onClick={() => setIsLogin(!isLogin)}
                      >
                        {isLogin ? t.toggleSignUp : t.toggleSignIn}
                      </button>
                    </p>
                  </>
                )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </LayoutGroup>
    </main>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<main className={styles.authContainer} />}>
      <LoginContent />
    </Suspense>
  );
}
