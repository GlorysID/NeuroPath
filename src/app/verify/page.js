"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "../context/LanguageContext";
import Link from "next/link";
import styles from "./page.module.css";

function CertImage({ src, holderName }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const xPct = (event.clientX - rect.left) / rect.width - 0.5;
    const yPct = (event.clientY - rect.top) / rect.height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const rotateX = useTransform(y, [-0.5, 0.5], [18, -18]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-18, 18]);

  return (
    <div className={styles.certTiltWrap} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      <motion.img
        src={src}
        alt={`NeuroPath Certificate — ${holderName || "Holder"}`}
        className={styles.certImage}
        style={{ rotateX, rotateY }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ cursor: 'grabbing' }}
      />
    </div>
  );
}

function VerifyContent() {
  const { lang } = useLanguage();
  const searchParams = useSearchParams();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const ranTxRef = useRef(null);

  useEffect(() => {
    const tx = searchParams.get("tx");
    if (!tx || ranTxRef.current === tx) return;
    ranTxRef.current = tx;

    setInput(tx);
    setLoading(true);
    setError(null);
    setResult(null);
    fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: tx })
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setResult(data);
      })
      .catch(() => setError("Kesalahan jaringan."))
      .finally(() => setLoading(false));
  }, [searchParams]);

  const t = {
    title: lang === 'id' ? 'Verifikasi NeuroPath' : 'Verify NeuroPath',
    subtitle: lang === 'id'
      ? 'Ketuk kode transaksi atau Wallet Address untuk membuktikan kredensial kognitif ini asli dari blockchain Sepolia.'
      : 'Enter a transaction hash or wallet address to prove this cognitive credential is authentic on the Sepolia blockchain.',
    placeholder: lang === 'id' ? 'Tx Hash atau Wallet Address…' : 'Transaction Hash or Wallet Address…',
    verify: lang === 'id' ? 'Verifikasi' : 'Verify',
    loading: lang === 'id' ? 'Menganalisis jaringan…' : 'Analyzing the blockchain…',
    success: lang === 'id' ? 'TERVERIFIKASI' : 'VERIFIED',
    failure: lang === 'id' ? 'TIDAK VALID' : 'NOT VALID',
    archetypeLabel: lang === 'id' ? 'Arketipe' : 'Archetype',
    holderLabel: lang === 'id' ? 'Pemilik' : 'Holder',
    emailLabel: lang === 'id' ? 'Email Terdaftar' : 'Registered Email',
    issueLabel: lang === 'id' ? 'Diterbitkan' : 'Issued',
    networkLabel: lang === 'id' ? 'Jaringan' : 'Network',
    hashLabel: lang === 'id' ? 'Tx Hash' : 'Tx Hash',
    viewExplorer: lang === 'id' ? 'Block Explorer' : 'Block Explorer',
    backHome: lang === 'id' ? '← Kembali ke Dashboard' : '← Back to Dashboard',
    certLabel: lang === 'id' ? 'Pratinjau Sertifikat' : 'Certificate Preview',
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input })
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || (lang === 'id' ? "Verifikasi gagal." : "Verification failed."));
      else setResult(data);
    } catch (e) {
      setError("Kesalahan jaringan.");
    }
    setLoading(false);
  };

  return (
    <section className={styles.container}>
      <div className={styles.grid}>
        {/* Left Block: Form */}
        <div className={styles.formBlock}>
          <h1 className={styles.title}>{t.title}</h1>
          <p className={styles.subtitle}>{t.subtitle}</p>

          <form onSubmit={handleVerify} className={styles.form}>
            <div className={styles.inputWrap}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t.placeholder}
                className={styles.input}
                autoFocus
              />
              {loading && <span className={styles.spinner} />}
            </div>
            <button type="submit" className={styles.verifyBtn} disabled={!input.trim() || loading}>
              {loading ? t.loading : t.verify}
            </button>
          </form>

          {error && (
            <div className={styles.resultCard} data-state="fail">
              <span className={styles.resultIcon}>&#10007;</span>
              <div className={styles.resultText}>
                <h3>{t.failure}</h3>
                <p>{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Block: Certificate */}
        <div className={styles.certBlock}>
          {result ? (
            <>
              <p className={styles.certLabel}>{t.certLabel}</p>
              {result.imageUri && (
                <CertImage src={result.imageUri} holderName={result.holderName} />
              )}
              <div className={styles.certMeta}>
                <p className={styles.certOwner}>{result.holderName || t.holderLabel}</p>
                <p className={styles.certArchetype}>{result.archetype}</p>
                <div className={styles.certDivider} />
                {result.holderEmail && (
                  <div className={styles.certRow}>
                    <span className={styles.certRowLabel}>{t.emailLabel}</span>
                    <span className={styles.certRowValue}>{result.holderEmail}</span>
                  </div>
                )}
                {result.issuedAt && (
                  <div className={styles.certRow}>
                    <span className={styles.certRowLabel}>{t.issueLabel}</span>
                    <span className={styles.certRowValue}>
                      {new Date(result.issuedAt).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                )}
                <div className={styles.certRow}>
                  <span className={styles.certRowLabel}>{t.hashLabel}</span>
                  <span className={`${styles.certRowValue} ${styles.certRowMono}`}>
                    {result.txHash.substring(0, 16)}…
                  </span>
                </div>
                <a href={result.explorerUrl} target="_blank" rel="noopener noreferrer" className={styles.certExplorerLink}>
                  {t.viewExplorer} →
                </a>
              </div>
            </>
          ) : !error && (
            <div className={styles.sealPlaceholder}>
              <div className={styles.seal}>
                <span className={styles.sealLetter}>N</span>
                <svg className={styles.sealRing} width="200" height="200" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="90" fill="none" stroke="var(--text-main)" strokeWidth="1" opacity="0.2" />
                  <circle cx="100" cy="100" r="75" fill="none" stroke="var(--text-main)" strokeWidth="1" opacity="0.35" strokeDasharray="4 4" />
                </svg>
              </div>
              <p className={styles.certPlaceholderText}>
                {lang === 'id' ? 'Masukkan Tx Hash untuk melihat pratinjau sertifikat' : 'Enter Tx Hash to preview the certificate'}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className={styles.actionRow}>
        <Link href="/dashboard" className={styles.backBtn}>{t.backHome}</Link>
      </div>
    </section>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  );
}
