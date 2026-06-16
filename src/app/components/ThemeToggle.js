"use client";

import { useTheme } from "../context/ThemeProvider";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import styles from "./ThemeToggle.module.css";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // Prevent hydration mismatch

  return (
    <button
      className={styles.toggleBtn}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Toggle Theme"
    >
      <motion.div
        initial={false}
        animate={{ rotate: resolvedTheme === "dark" ? 180 : 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ display: "flex" }}
      >
        {resolvedTheme === "dark" ? (
          <Sun size={18} className={styles.icon} />
        ) : (
          <Moon size={18} className={styles.icon} />
        )}
      </motion.div>
    </button>
  );
}
