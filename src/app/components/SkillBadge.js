"use client";

import { useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import styles from "./SkillBadge.module.css";
import { db } from "../../lib/firebase";
import { doc, getDoc, setDoc, arrayUnion } from "firebase/firestore";
import { ethers } from "ethers";

export default function SkillBadge({ interviewState = {}, credentials = [], userId, hasRoadmap }) {
  const { lang } = useLanguage();
  const [minting, setMinting] = useState(false);
  const [mintResult, setMintResult] = useState(null);
  const [showCertModal, setShowCertModal] = useState(false);

  // 3D Tilt Effect for NFT Image
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const xPct = mouseX / rect.width - 0.5;
    const yPct = mouseY / rect.height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const rotateX = useTransform(y, [-0.5, 0.5], [15, -15]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-15, 15]);

  const currentState = interviewState.currentState || "PROFILING";
  const STATES_ORDER = ["PROFILING", "TECHNICAL_DEEP_DIVE", "CASE_STUDY", "STRATEGIC_BRANDING"];
  const currentIndex = STATES_ORDER.indexOf(currentState);

  // Badge is unlocked if user has progressed past PROFILING or has generated the roadmap
  const isUnlocked = currentIndex > 0 || credentials.length > 0 || hasRoadmap;
  const latestCredential = credentials.length > 0 ? credentials[credentials.length - 1] : null;

  const handleMint = async () => {
    setMinting(true);
    try {
      if (!userId) throw new Error("User ID is required to mint");

      // 1. Fetch user data and get/create wallet securely on the client
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : {};
      
      let userWallet = userData.wallet;
      if (!userWallet || !userWallet.address) {
        const randomWallet = ethers.Wallet.createRandom();
        userWallet = { address: randomWallet.address, privateKey: randomWallet.privateKey };
        await setDoc(userRef, { wallet: userWallet }, { merge: true });
      }

      // 2. Call serverless API to perform the actual blockchain transaction
      const res = await fetch("/api/blockchain/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          badgeType: "PROFILING_COMPLETE",
          scores: interviewState,
          userAddress: userWallet.address,
          userEmail: userData.email || "Anonymous",
          userArchetype: userData.profile?.archetype || "Unknown Archetype"
        })
      });
      const data = await res.json();
      
      if (data.txHash && data.certificateData) {
        setMintResult(data);
        
        // 3. Save the credential reliably back to Firestore from the client using arrayUnion
        const cleanCredential = JSON.parse(JSON.stringify(data.certificateData));
        await setDoc(userRef, { 
          credentials: arrayUnion(cleanCredential) 
        }, { merge: true });
      }
    } catch (e) {
      console.error("Mint failed:", e);
    }
    setMinting(false);
  };

  const displayHash = mintResult?.txHash || latestCredential?.txHash;

  return (
    <>
      <motion.div
        className={`${styles.badge} ${isUnlocked ? styles.unlocked : styles.locked}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        onClick={() => { if (displayHash) setShowCertModal(true); }}
        style={{ cursor: displayHash ? 'pointer' : 'default' }}
      >
      {/* Holographic overlay effect */}
      {isUnlocked && <div className={styles.holographic} />}

      <div className={styles.content}>
        <div className={styles.header}>
          <span className={styles.headerLabel}>
            {lang === 'id' ? 'Sertifikat Digital' : 'Digital Credential'}
          </span>
          {isUnlocked ? (
            <span className={styles.statusUnlocked}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4, display: 'inline-block', verticalAlign: 'middle' }}><polyline points="20 6 9 17 4 12"/></svg>
              {lang === 'id' ? 'Terverifikasi' : 'Verified'}
            </span>
          ) : (
            <span className={styles.statusLocked}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4, display: 'inline-block', verticalAlign: 'middle' }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              {lang === 'id' ? 'Terkunci' : 'Locked'}
            </span>
          )}
        </div>

        <div className={styles.badgeTitle}>
          {isUnlocked
            ? (lang === 'id' ? 'Profiling Selesai' : 'Profiling Complete')
            : (lang === 'id' ? 'Selesaikan tahap Profiling' : 'Complete Profiling stage')
          }
        </div>

        {displayHash && (
          <div className={styles.hashContainer}>
            <span className={styles.hashLabel}>Hash:</span>
            <code className={styles.hash}>{displayHash.substring(0, 20)}...</code>
          </div>
        )}

        {isUnlocked && !displayHash && (
          <button
            className={styles.mintBtn}
            onClick={handleMint}
            disabled={minting}
          >
            {minting
              ? (lang === 'id' ? 'Mencetak...' : 'Minting...')
              : (lang === 'id' ? 'Cetak Sertifikat' : 'Mint Certificate')
            }
          </button>
        )}

        {!isUnlocked && (
          <div className={styles.blurOverlay}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
        )}
      </div>
    </motion.div>

      {/* Certificate Modal */}
      {showCertModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCertModal(false)}>
          <motion.div
            className={styles.certModal}
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className={styles.certHeader}>
              <div className={styles.certLogo}>N</div>
              <button onClick={() => setShowCertModal(false)} className={styles.closeBtn}>✕</button>
            </div>
            
            <div className={styles.certBody}>
              <div className={styles.certContent}>
                
                {/* Left Column: Details */}
                <div style={{ flex: 1 }}>
                  <h4 className={styles.certSubtitle}>{lang === 'id' ? 'Sertifikat Kognitif' : 'Cognitive Credential'}</h4>
                  <h2 className={styles.certTitle}>NeuroPath NFT Credential</h2>
                  
                  <div className={styles.certDetails}>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>User ID:</span>
                      <span className={styles.detailValue}>{userId || 'Anonymous'}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Type:</span>
                      <span className={styles.detailValue}>ERC-721 NFT (Full Profiling Complete)</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Network:</span>
                      <span className={styles.detailValue}>{mintResult?.certificateData?.network || latestCredential?.network || 'Ethereum Sepolia'}</span>
                    </div>
                    {(mintResult?.certificateData?.ownerAddress || latestCredential?.ownerAddress) && (
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Owner Wallet:</span>
                        <span className={styles.detailValue} style={{ fontSize: '0.85rem' }}>{mintResult?.certificateData?.ownerAddress || latestCredential?.ownerAddress}</span>
                      </div>
                    )}
                    {latestCredential?.contractAddress && (
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Contract Address:</span>
                        <span className={styles.detailValue} style={{ fontSize: '0.85rem' }}>{latestCredential.contractAddress}</span>
                      </div>
                    )}
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Tx Hash:</span>
                      <a 
                        href={mintResult?.explorerUrl || latestCredential?.explorerUrl || `https://sepolia.etherscan.io/tx/${displayHash}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={styles.detailValue} 
                        style={{ fontSize: '0.85rem', color: '#ffffff', wordBreak: 'break-all', textDecoration: 'underline' }}
                      >
                        {displayHash}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Right Column: NFT Image */}
                {(mintResult?.certificateData?.imageUri || latestCredential?.imageUri) && (
                  <div className={styles.certImageWrapper}>
                    <motion.img 
                      src={mintResult?.certificateData?.imageUri || latestCredential?.imageUri} 
                      alt="NFT Image" 
                      style={{ 
                        width: '320px', 
                        height: '400px', 
                        borderRadius: '12px', 
                        border: '1px solid #333333', 
                        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
                        rotateX,
                        rotateY,
                        cursor: 'grab'
                      }} 
                      onMouseMove={handleMouseMove}
                      onMouseLeave={handleMouseLeave}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ cursor: 'grabbing' }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className={styles.certFooter}>
              <div className={styles.verifiedStamp}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" style={{ marginTop: '2px' }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span style={{ color: '#ffffff', position: 'relative', top: '-1px' }}>BLOCKCHAIN VERIFIED</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
