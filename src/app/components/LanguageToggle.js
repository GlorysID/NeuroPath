"use client";

import { useLanguage } from "../context/LanguageContext";
import styles from "./LanguageToggle.module.css";

export default function LanguageToggle() {
  const { lang, toggleLanguage } = useLanguage();

  return (
    <button className={styles.toggleBtn} onClick={toggleLanguage} aria-label="Toggle Language">
      <span className={`${styles.option} ${lang === 'en' ? styles.active : ''}`}>EN</span>
      <span className={`${styles.option} ${lang === 'id' ? styles.active : ''}`}>ID</span>
    </button>
  );
}
