"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase";
import styles from "./page.module.css";
import Link from "next/link";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
        router.push("/interview"); // New users go straight to interview
      }
    } catch (err) {
      let friendlyMessage = err.message;
      if (err.code === 'auth/invalid-credential') {
        friendlyMessage = "Email atau password salah.";
      } else if (err.code === 'auth/email-already-in-use') {
        friendlyMessage = "Email ini sudah terdaftar. Silakan pindah ke tab 'Sign In' untuk masuk.";
      } else if (err.code === 'auth/weak-password') {
        friendlyMessage = "Password terlalu lemah. Gunakan minimal 6 karakter.";
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = "Format email tidak valid.";
      } else if (err.code === 'auth/network-request-failed') {
        friendlyMessage = "Koneksi jaringan terputus. Silakan periksa internet Anda.";
      }
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.loginCard}>
        <div className={styles.header}>
          <Link href="/" className={styles.logoLink}>
            NeuroPath
          </Link>
          <h2 className={styles.title}>{isLogin ? "Welcome Back" : "Create Account"}</h2>
          <p className={styles.subtitle}>
            {isLogin ? "Sign in to continue your career journey." : "Start your journey to discover your ideal future."}
          </p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form className={styles.form} onSubmit={handleAuth}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Email</label>
            <input 
              type="email" 
              className={styles.input} 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label className={styles.label}>Password</label>
            <input 
              type="password" 
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Processing..." : (isLogin ? "Sign In" : "Sign Up")}
          </button>
        </form>

        <p className={styles.toggleText}>
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button 
            type="button" 
            className={styles.toggleLink}
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </main>
  );
}
